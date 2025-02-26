
-- name: InsertDiaryRecord :one
insert into diary(entry) values(?) RETURNING *;

-- name: InsertDiaryEntry :one
insert into diary(entry, created_at, updated_at) values(?, ?, ?) RETURNING *;

-- name: GetAllDiaries :many
select * from diary order by id desc;

-- name: GetAllDiariesLimit :many
select * from diary order by id desc limit ? offset ?;
-- name: GetDiaryByID :one
select * from diary where id = ?;

-- name: GetDiariesCount :one
select count(1) as count from diary;

-- name: GetDeletedDiaries :many
select * from trash order by diary_id desc limit ? offset ?;

-- name: AssignDiaryTag :one
insert into tags(diary_id, tag) values(?, ?) RETURNING *;

-- name: GetNoTagDiaries :many
SELECT diary.* FROM diary LEFT JOIN tags ON diary.id = tags.diary_id WHERE tags.diary_id IS NULL order by diary.id desc limit ? offset ?;

-- name: GetDiaryByTag :many
SELECT diary.* FROM diary JOIN tags ON diary.id = tags.diary_id WHERE tags.tag = ? order by diary.id desc limit ? offset ?;

-- name: UpdateDiaryEntryByID :one
UPDATE diary set entry = ?, updated_at=strftime('%s', 'now') where id = ? RETURNING *; 


