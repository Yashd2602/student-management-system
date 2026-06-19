# 📘 PROJECT DETAILS — What Was Built, When, How & Why

This document is a **detailed, in-depth walkthrough** of the Student Management System:
what each part does, how the pieces work together, and the reasoning behind each decision.
It maps every requirement from the task to where it is implemented.

---

## 1. High-level overview

The system is a classic **three-tier full-stack application**:

```
┌──────────────┐      HTTP / JSON       ┌──────────────┐      SQL        ┌──────────────┐
│   FRONTEND   │  ───────────────────▶  │   BACKEND    │  ────────────▶  │  DATABASE    │
│ React + Vite │  ◀───────────────────  │ Node/Express │  ◀────────────  │ PostgreSQL   │
│ (port 5173)  │   photos via /uploads  │ (port 5000)  │   pg pool       │ (port 5432)  │
└──────────────┘                        └──────────────┘                 └──────────────┘
```

- The **frontend** is a single-page React app. It renders a form + table and talks to the backend purely over REST using Axios.
- The **backend** is a stateless Express REST API. It validates input, talks to PostgreSQL, stores uploaded photos on disk, and serves them back as static files.
- The **database** stores student records, an activity log, and a sequence that powers the unique admission number.

---

## 2. Backend — how it works (file by file)

### `src/server.js` — the entry point
- Loads environment variables with `dotenv`.
- Enables **CORS** (restricted to the frontend origin from `CORS_ORIGIN`).
- Parses JSON and URL-encoded bodies.
- Serves uploaded photos statically at `/uploads/<filename>`.
- Mounts the student routes at `/students`.
- Has a **central error handler** that turns Multer errors (file too large / wrong type) and unexpected errors into clean JSON responses.
- On boot it **runs the database migration first**, and only starts listening once the schema is ready — so the app never serves traffic against a missing table.

### `src/config/db.js` — database connection
- Creates a single shared **`pg` connection pool** (efficient: connections are reused, not opened per request).
- Supports **either** a `DATABASE_URL` connection string **or** individual `PG*` variables — whichever you set in `.env`.
- Exports a `query(text, params)` helper so the rest of the code never has to manage clients manually.
- **Why a pool?** Opening a new TCP connection per request is slow; pooling keeps a warm set of connections.

### `src/db/migrate.js` — automatic schema setup
- Reads `db/schema.sql` and executes it on startup.
- Every statement uses `IF NOT EXISTS`, so it is **idempotent** (safe to run every boot).
- Can also be run on its own with `npm run migrate`.

### `db/schema.sql` — the database design
- **`admission_seq`** — a PostgreSQL `SEQUENCE`. This is the heart of the unique admission number: `nextval()` is atomic and unique even under concurrent inserts.
- **`students`** table — all required fields with proper data types and constraints:
  - `admission_number VARCHAR UNIQUE NOT NULL` — uniqueness enforced at the DB level.
  - `email VARCHAR UNIQUE NOT NULL` — no duplicate emails.
  - `year INTEGER CHECK (year BETWEEN 1 AND 10)` and `gender ... CHECK (...)` — data integrity constraints.
  - `photo_path` — stores the **reference** (filename) to the uploaded photo, not the binary.
  - `created_at` / `updated_at` timestamps.
- **Indexes** on `name`, `course`, `year`, `created_at` — speed up search, filtering and the default sort (bonus requirement).
- **`activity_logs`** table — records every create / update / delete (bonus requirement).

### `src/utils/admissionNumber.js` — unique admission number
- Calls `nextval('admission_seq')` and formats the result as **`ADM-<currentYear>-<5-digit-zero-padded>`**, e.g. `ADM-2026-00001`.
- **Auto-generated** (the client never sends it) and **guaranteed unique** (sequence + the UNIQUE column constraint as a safety net).

### `src/middleware/upload.js` — photo uploads
- Uses **Multer** with disk storage into `backend/uploads/`.
- Generates a collision-proof filename (`student-<timestamp>-<random>.<ext>`).
- **Validates** the file: only JPEG/PNG/WEBP/GIF, max size from `MAX_UPLOAD_BYTES` (default 2 MB).

### `src/middleware/validate.js` — backend validation
- A single `validateStudent` middleware reused by both create and update.
- Checks: required fields, name length, year range (1–10), valid + not-future date of birth, email format, mobile (7–15 digits), allowed gender.
- Returns **HTTP 400** with a structured `{ errors: { field: message } }` object so the frontend can show errors per field.
- **Why validate on the backend too?** The frontend can be bypassed; the server is the source of truth.

### `src/controllers/studentController.js` — business logic
Each function is one REST action:
- **`listStudents`** — builds a dynamic, **parameterised** SQL query (prevents SQL injection) supporting `search` (name/email/admission #), `course` filter, `year` filter, plus **server-side pagination** (`page`, `limit`, `OFFSET`). Returns data + a `pagination` object.
- **`getStudent`** — fetch one by id (404 if missing).
- **`createStudent`** — generates the admission number, inserts the row, writes an activity log, returns 201. On a unique-constraint violation (`23505`) it returns a friendly 409 telling which field clashed. If the DB insert fails, the just-uploaded orphan file is cleaned up.
- **`updateStudent`** — updates the row; keeps the old photo unless a new one is uploaded (and deletes the replaced file); logs the activity.
- **`deleteStudent`** — deletes the row, removes its photo file, logs the activity.
- **`analytics`** — returns totals grouped by course / gender / year (bonus).
- A `serialize()` helper converts the stored `photo_path` into a full **`photo_url`** the browser can load.

### `src/routes/students.js` — REST routing
Maps the required endpoints to controller functions and wires in the upload + validation middleware:
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/students` | listStudents |
| GET | `/students/:id` | getStudent |
| POST | `/students` | upload → validate → createStudent |
| PUT | `/students/:id` | upload → validate → updateStudent |
| DELETE | `/students/:id` | deleteStudent |
| GET | `/students/meta/analytics` | analytics |

> Note: `/meta/analytics` is declared **before** `/:id` so Express doesn't treat "meta" as an id.

---

## 3. Frontend — how it works

### `src/services/api.js` — API client
- A configured **Axios** instance pointing at `VITE_API_URL`.
- A `toFormData()` helper packs the student fields + optional photo into `FormData` (needed for file upload).
- Exposes `StudentApi.list / get / create / update / remove / analytics`.

### `src/components/StudentForm.jsx` — add / edit form
- Controlled inputs for every field, plus a file input with **live image preview**.
- **Client-side validation** mirroring the backend rules — instant feedback before a request is sent.
- Merges **server-side field errors** (e.g. duplicate email) into the same per-field error display.
- The same component handles both **Add** and **Edit** (it pre-fills when an `editing` student is passed in).

### `src/components/StudentList.jsx` — the table
- Renders all students in a responsive table with photo avatars (falls back to an initial when there is no photo).
- Provides **Edit** and **Drop** buttons per row.

### `src/App.jsx` — the orchestrator
- Holds all state: students, pagination, the student being edited, loading/submitting flags, toasts, and the search/filter/page values.
- **Debounces** search/filter changes (300 ms) so typing doesn't fire a request per keystroke.
- Handles create/update/delete, shows toast notifications, and refreshes the list.
- Implements the **Prev / Next pagination** controls.

### `src/styles.css` — responsive UI
- Plain CSS with a small design system (CSS variables for colours).
- A responsive grid form that collapses to a single column on small screens (`@media (max-width: 720px)`), styled table, toasts, and buttons.

---

## 4. How a request flows end-to-end (example: adding a student)

1. User fills the form and clicks **Add Student**.
2. `StudentForm` runs client-side validation. If OK, it calls `onSubmit(form, photo)`.
3. `App.handleSubmit` calls `StudentApi.create`, which posts `multipart/form-data` to `POST /students`.
4. Express runs **Multer** (saves the photo) → **validateStudent** (server validation) → **createStudent**.
5. The controller generates `ADM-2026-0000X`, inserts the row, writes an **activity log**, and returns the new student as JSON (including `photo_url`).
6. The frontend shows a success toast and refreshes the list.
7. If the email already exists, the DB raises a unique violation → backend returns **409** → the form shows "email already exists" under the email field.

---

## 5. Requirement → implementation map

| Requirement | Where it lives |
| --- | --- |
| Add student (all 8 fields) | `StudentForm.jsx`, `createStudent`, `students` table |
| Upload student photo | `middleware/upload.js`, `photo_path`, static `/uploads` |
| Edit / update | `updateStudent`, `StudentForm` edit mode |
| View student list | `StudentList.jsx`, `listStudents` |
| Drop / delete | `deleteStudent`, Drop button |
| Form validation (FE + BE) | `StudentForm` validate() + `middleware/validate.js` |
| Responsive UI | `styles.css` media queries / grid |
| Unique auto admission number | `admission_seq` + `utils/admissionNumber.js` + UNIQUE column |
| REST APIs (GET/POST/PUT/DELETE) | `routes/students.js` |
| Proper DB schema/types/constraints | `db/schema.sql` |
| Store photo reference | `photo_path` column |
| Frontend ↔ backend integration | `services/api.js` + Axios |
| **Bonus:** search / filter / analytics | `listStudents`, `analytics` endpoint |
| **Bonus:** indexes | `db/schema.sql` |
| **Bonus:** activity logging | `activity_logs` + `logActivity()` |
| **Bonus:** server-side pagination | `listStudents` (LIMIT/OFFSET) |
| **Bonus:** environment variables | `.env` / `dotenv` in backend & Vite env in frontend |

---

## 6. Design decisions & trade-offs

- **Sequence-based admission number** rather than `COUNT(*)+1`: counting rows is racy and breaks after deletions; a sequence is atomic and never reuses numbers.
- **Disk storage + path in DB** rather than storing image bytes in the database: keeps the DB small and lets the web server serve images efficiently. (For production you'd use S3 / object storage — the `photo_path` abstraction makes that an easy swap.)
- **Validation in both layers**: UX (instant) on the client, security (authoritative) on the server.
- **Parameterised SQL everywhere**: prevents SQL injection.
- **Auto-migration on startup**: zero manual DB setup for the reviewer — just create the empty database and run.
- **Stateless backend**: no sessions, easy to scale horizontally.

---

## 7. Possible future enhancements

- Authentication & role-based access (admin vs viewer).
- A dedicated analytics dashboard screen in the UI (the backend endpoint already exists).
- Soft-delete (archive) instead of hard delete.
- Unit/integration tests (Jest + Supertest) and CI.
- Dockerise with `docker-compose` (Postgres + API + frontend).
- Move uploads to cloud object storage.

---

## 8. Build timeline (what was done, in order)

1. Created the folder structure (`backend/`, `frontend/`, docs).
2. Designed the **database schema** (table, constraints, indexes, sequence, activity log).
3. Built the **backend**: DB pool → migration runner → admission-number util → upload & validation middleware → controller → routes → server with error handling.
4. Built the **frontend**: Axios API client → form (with validation + preview) → list table → App orchestration (search/filter/pagination/toasts) → responsive CSS.
5. Wrote **documentation**: `README.md`, `HOW_TO_RUN.md`, and this `PROJECT_DETAILS.md`.
6. Added `.gitignore` and env examples for clean version control.
