# Postinstall Backend

### Run Development Postgres Datase
Run `docker run --rm --name postgres-postinstall -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres:13-alpine`

DB URL: `DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/postinstall"`