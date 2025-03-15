package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"echohush/libs"
	"echohush/pkg/daemon"
	"echohush/pkg/path"

	"sync"

	sqlite3 "github.com/mattn/go-sqlite3"
)

var once sync.Once

func loadExtension(extPath string) string {
	const driverName = "sqlite3_simple"
	once.Do(func() {
		sql.Register(driverName, &sqlite3.SQLiteDriver{
			Extensions: []string{
				extPath,
			},
		})
	})
	return driverName
}

func openDB(dbPath, password string) (db *sql.DB, err error) {
	defer func() {
		if err != nil {
			fmt.Printf("open db, the error is: %s\n", err.Error())
			if db != nil {
				db.Close()
			}
		}
	}()
	if dbPath == "" {
		return nil, errors.New("db path cannot be nil")
	}
	driverName := ""
	if daemon.IsDev() {
		workingDir, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		driverName = loadExtension(path.Join(workingDir, "libs", "libsimple"))
	} else {
		configDir := daemon.GetConfigDir()
		libPath := path.Join(configDir, libs.GetSimpleLibraryName())
		if !path.PathIsExist(libPath) {
			libContent, err := libs.Simple.ReadFile(libs.GetSimpleLibraryName())
			if err != nil {
				return nil, err
			}
			err = os.WriteFile(libPath, libContent, 0644)
			if err != nil {
				return nil, err
			}
		}
		driverName = loadExtension(path.Join(configDir, "libsimple"))
	}

	//SQLCipher v4  https://utelle.github.io/SQLite3MultipleCiphers/docs/ciphers/cipher_sqlcipher/
	dbString := fmt.Sprintf("%s?_cipher=sqlcipher&"+
		"_kdf_iter=256000&"+
		"_fast_kdf_iter=2&"+
		"_hmac_use=1&"+
		"_hmac_pgno=1&"+
		"_hmac_salt_mask=0x3a&"+
		"_legacy=4&"+
		"_legacy_page_size=4096&"+
		"_kdf_algorithm=2&"+
		"_hmac_algorithm=2&"+
		"_plaintext_header_size=0&"+
		"_key=%s", dbPath, password)

	db, err = sql.Open(driverName, dbString)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		if sqliteErr, ok := err.(sqlite3.Error); ok {
			fmt.Printf("SQLite Error Code: %d\n", sqliteErr.Code)
			fmt.Printf("SQLite Extended Error Code: %d\n", sqliteErr.ExtendedCode)
			fmt.Printf("SQLite Error Message: %s\n", sqliteErr.Error())
			return nil, fmt.Errorf("database ping failed: %w", err)
		}
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	return db, nil
}

func InitDB(path, password, schemaPath string) (*sql.DB, error) {
	db, err := openDB(path, password)
	if err != nil {
		return nil, err
	}

	schemaContent, err := os.ReadFile(schemaPath)
	if err != nil {
		return nil, err
	}
	fmt.Printf("%s\n", schemaContent)
	_, err = db.Exec(string(schemaContent))
	if err != nil {
		return nil, err
	}

	return db, err
}

func InitDBWithSchema(path, password string, schemaContent []byte) (*sql.DB, error) {
	db, err := openDB(path, password)
	if err != nil {
		return nil, err
	}

	result, err := db.Exec(string(schemaContent))
	if err != nil {
		fmt.Printf("init db============%s %v\n", err, result)
		return nil, err
	}
	return db, nil
}

func OpenDBAndCheckPassword(path, password string) (*sql.DB, error) {
	db, err := openDB(path, password)
	if err != nil {
		return nil, err
	}
	tables, err := getTables(db)
	if err != nil {
		fmt.Printf("============%s\n", err)
		return nil, errors.New("password wrong")
	}
	if len(tables) == 0 {
		return nil, errors.New("password wrong")
	}

	return db, err
}

func NewQuery() *Queries {
	return New(nil)
}

func SetDB(q *Queries, dbConn *sql.DB) {
	q.db = dbConn
}

func (q *Queries) OpenDB(ctx context.Context, path, password string) error {
	db, err := OpenDBAndCheckPassword(path, password)
	if err != nil {
		return err
	}
	q.db = db
	return err
}

func (q *Queries) InitDB(ctx context.Context, path, password string) error {
	schemaContent, err := daemon.GetGlobalFSContent("schema", "internal/db/sql/schema.sql")
	if err != nil {
		return err
	}
	db, err := InitDBWithSchema(path, password, schemaContent)
	if err != nil {
		return err
	}
	q.db = db
	return q.insertReadme()
}

func (q *Queries) insertReadme() error {
	count, err := q.GetDiariesCount(context.Background())
	if err == nil && count == 0 {
		readme, err := daemon.GetGlobalFSContent("readme", "README.md")
		if err != nil {
			return err
		}
		_, err = q.InsertDiaryRecord(context.Background(), string(readme))
	}

	return err
}

func getTables(db *sql.DB) ([]string, error) {
	// Query the sqlite_master table to get all tables
	rows, err := db.Query("SELECT name FROM sqlite_master WHERE type= ?", "table")
	if err != nil {
		return nil, fmt.Errorf("Error querying tables: %s", err)
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var tableName string
		err = rows.Scan(&tableName)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		result = append(result, tableName)
	}

	// Check for errors from iterating over rows
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func GetDBInfo(db *sql.DB) (string, error) {
	var result string
	rows, err := db.Query("PRAGMA compile_options;")
	if err != nil {
		return "", err
	}

	for rows.Next() {
		var row string
		if err = rows.Scan(&row); err != nil {
			return "", err
		}
		if row == "ENABLE_FTS5" {
			result += row + "\n"
			break
		}
	}
	rows.Close()

	rows, err = db.Query(`select simple_query('pinyin')`)
	if err != nil {
		return "", err
	}
	for rows.Next() {
		var row string
		if err = rows.Scan(&row); err != nil {
			return "", err
		}
		result += row + "\n"
	}
	rows.Close()

	tables, err := getTables(db)
	if err != nil {
		return "", err
	}
	result += "tables: " + strings.Join(tables, "\t")

	return result, nil
}

func (q *Queries) FtsDiarySearch(ctx context.Context, keyword string) (results []Diary, err error) {
	const sql = `SELECT rowid, simple_snippet(diary_fts, 0, '<mark>', '</mark>', '...', ?) as snippet FROM diary_fts WHERE entry MATCH simple_query(?, 0) ORDER BY rank limit ?,?;`

	tokenLength := len(keyword) + 20
	rows, err := q.db.QueryContext(ctx, sql, tokenLength, keyword, 0, 10)
	if err != nil {
		return nil, fmt.Errorf("Error querying tables: %s", err)
	}
	defer rows.Close()

	for rows.Next() {
		var d Diary
		err = rows.Scan(&d.ID, &d.Entry)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		results = append(results, d)
	}
	return
}

type configParams struct {
	Key   sql.NullString
	Value sql.NullString
}

func (q *Queries) SetConfig(ctx context.Context, key, value string) error {
	const setConfig = `
	INSERT INTO configurations (key, value) 
	VALUES (?, ?)
	ON CONFLICT(key) DO UPDATE SET value = excluded.value;
	`
	argKey := sql.NullString{String: key, Valid: true}
	argValue := sql.NullString{String: value, Valid: true}
	_, err := q.db.ExecContext(ctx, setConfig, argKey, argValue)
	return err
}

func (q *Queries) GetConfig(ctx context.Context, key string) (string, error) {
	const getConfig = `select value from configurations where "key" = ?`
	row := q.db.QueryRowContext(ctx, getConfig, key)
	var value sql.NullString
	err := row.Scan(&value)
	if err != nil {
		return "", err
	}
	return value.String, nil
}
