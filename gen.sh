rm internal/db/query.gen.go
go run cmd/gencall/main.go > 11
mv 11 internal/db/query.gen.go
