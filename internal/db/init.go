package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path"

	"echohush/pkg/daemon"

	"sync"

	"github.com/mattn/go-sqlite3"
	_ "github.com/mattn/go-sqlite3"
)

var once sync.Once

func loadExtension(path string) string {
	const driverName = "sqlite3_simple"
	once.Do(func() {
		sql.Register(driverName, &sqlite3.SQLiteDriver{
			Extensions: []string{
				path,
			},
		})
	})
	return driverName
}

func openDB(dbPath, password string) (db *sql.DB, err error) {
	driverName := ""
	if daemon.IsDev() {
		workingDir, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		driverName = loadExtension(path.Join(workingDir, "libs", "libsimple"))
	} else {
		panic("todo")
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
	return
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

	_, err = db.Exec(string(schemaContent))
	if err != nil {
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
		fmt.Printf("%s", err)
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

func getTables(db *sql.DB) ([]string, error) {
	// Query the sqlite_master table to get all tables
	rows, err := db.Query("SELECT name FROM sqlite_master WHERE type='table';")
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
		log.Fatal("Error iterating rows:", err)
		return nil, err
	}
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
