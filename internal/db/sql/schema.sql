CREATE TABLE IF NOT EXISTS diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  entry TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT (strftime('%s', 'now')) NOT NULL,
  updated_at TIMESTAMP DEFAULT (strftime('%s', 'now')) NOT NULL 
);

CREATE VIRTUAL TABLE IF NOT EXISTS diary_fts USING fts5(
    entry, 
    content='diary', 
    content_rowid='id',
    tokenize='simple 0' 
);

CREATE TRIGGER IF NOT EXISTS diary_ai AFTER INSERT ON diary
    BEGIN
        INSERT INTO diary_fts (rowid, entry)
        VALUES (new.id, new.entry);
    END;

CREATE TRIGGER IF NOT EXISTS diary_ad AFTER DELETE ON diary
    BEGIN
        INSERT INTO diary_fts(diary_fts, rowid, entry)
        VALUES ('delete', old.id, old.entry);
    END;

CREATE TRIGGER IF NOT EXISTS diary_au AFTER UPDATE ON diary
    BEGIN
        INSERT INTO diary_fts(diary_fts, rowid, entry)
        VALUES ('delete', old.id, old.entry);
        INSERT INTO diary_fts (rowid, entry)
        VALUES (new.id, new.entry);
    END;

CREATE TABLE IF NOT EXISTS configurations(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    key TEXT,
    value TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_configurations_key on configurations(key);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY,
  diary_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  UNIQUE (tag, diary_id), /*create tag index automatically*/
  FOREIGN KEY (diary_id) REFERENCES diary(id)
);
CREATE INDEX IF NOT EXISTS idx_tags_diary_id on tags(diary_id);

CREATE TABLE IF NOT EXISTS trash (
  id INTEGER PRIMARY KEY,
  diary_id INTEGER NOT NULL,
  diary_entry TEXT NOT NULL,
  diary_created_at TIMESTAMP NOT NULL,
  diary_updated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT (strftime('%s', 'now')) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trash_diary_id on trash(diary_id);
