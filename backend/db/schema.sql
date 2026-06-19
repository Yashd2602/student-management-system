-- =====================================================================
-- Student Management System — database schema
-- Run this against your PostgreSQL database, e.g.:
--   psql -U postgres -d student_db -f db/schema.sql
-- The backend also runs this automatically on startup (src/db/migrate.js).
-- =====================================================================

-- Sequence that backs the auto-generated, unique Admission Number.
CREATE SEQUENCE IF NOT EXISTS admission_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS students (
    id               SERIAL PRIMARY KEY,
    admission_number VARCHAR(20)  NOT NULL UNIQUE,        -- auto-generated, unique
    name             VARCHAR(120) NOT NULL,
    course           VARCHAR(120) NOT NULL,
    year             INTEGER      NOT NULL CHECK (year BETWEEN 1 AND 10),
    date_of_birth    DATE         NOT NULL,
    email            VARCHAR(160) NOT NULL UNIQUE,
    mobile           VARCHAR(20)  NOT NULL,
    gender           VARCHAR(20)  NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    address          TEXT,
    photo_path       VARCHAR(255),                        -- reference (path) to the stored photo
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes to speed up search / filter / sort (bonus requirement).
CREATE INDEX IF NOT EXISTS idx_students_name   ON students (name);
CREATE INDEX IF NOT EXISTS idx_students_course ON students (course);
CREATE INDEX IF NOT EXISTS idx_students_year   ON students (year);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students (created_at DESC);

-- Activity log (bonus requirement) — records every create/update/delete.
CREATE TABLE IF NOT EXISTS activity_logs (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER,
    action      VARCHAR(20) NOT NULL,          -- CREATE | UPDATE | DELETE
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
