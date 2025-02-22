package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB(path, password, schemaPath string) (*sql.DB, error) {
	var err error
	//SQLCipher v4  https://utelle.github.io/SQLite3MultipleCiphers/docs/ciphers/cipher_sqlcipher/
	dbPath := fmt.Sprintf("%s?_cipher=sqlcipher&"+
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
		"_key=%s", path, password)
	db, err := sql.Open("sqlite3", dbPath)
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

func OpenSqlite3DB(path, password string) (*sql.DB, error) {
	var err error
	//SQLCipher v4  https://utelle.github.io/SQLite3MultipleCiphers/docs/ciphers/cipher_sqlcipher/
	dbPath := fmt.Sprintf("%s?_cipher=sqlcipher&"+
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
		"_key=%s", path, password)
	db, err := sql.Open("sqlite3", dbPath)
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
	db, err := OpenSqlite3DB(path, password)
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
