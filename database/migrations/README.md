# Database Migrations

This directory contains Alembic migration scripts for PostgreSQL schema management.

To generate a new migration:
```bash
alembic revision --autogenerate -m "description of changes"
```

To run migrations:
```bash
alembic upgrade head
```
