# ▶️ HOW TO RUN — Student Management System

This guide walks you through running the project from scratch on **Windows, macOS, or Linux**. Follow the steps in order.

---

## 0. Prerequisites

Install these first (if you don't already have them):

| Tool        | Version (min) | Check it's installed       | Download                              |
| ----------- | ------------- | -------------------------- | ------------------------------------- |
| Node.js     | 18+           | `node -v`                  | https://nodejs.org                    |
| npm         | comes w/ Node | `npm -v`                   | —                                     |
| PostgreSQL  | 13+           | `psql --version`           | https://www.postgresql.org/download   |
| Git         | any           | `git --version`            | https://git-scm.com                   |

> 💡 Node 18+ is required because the backend uses ES modules and `node --watch`.

---

## 1. Get the code

If you cloned from GitHub:
```bash
git clone https://github.com/<your-username>/student-management-system.git
cd student-management-system
```
Otherwise just open the `student-management-system` folder in a terminal.

---

## 2. Create the PostgreSQL database

Open a terminal and create an empty database. (You only do this once.)

**Option A — using `createdb`:**
```bash
createdb -U postgres student_db
```

**Option B — using the psql shell:**
```bash
psql -U postgres
# then inside psql:
CREATE DATABASE student_db;
\q
```

> The application **creates all tables, indexes and sequences automatically** on first
> startup (it runs `backend/db/schema.sql`). You do **not** need to create tables by hand.
> If you prefer to do it manually:
> ```bash
> psql -U postgres -d student_db -f backend/db/schema.sql
> ```

---

## 3. Configure & start the BACKEND

```bash
cd backend

# Copy the example env file and edit it with your DB credentials
# Windows (PowerShell):  copy .env.example .env
# macOS / Linux:         cp .env.example .env
cp .env.example .env
```

Open `.env` and set your PostgreSQL password (and any other values):
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password_here
PGDATABASE=student_db
```

Install dependencies and start:
```bash
npm install
npm start
```

You should see:
```
✓ Database schema is ready
✓ API running on http://localhost:5000
```

✅ Test it in a browser or with curl: <http://localhost:5000/health> → `{"status":"ok"}`

> Use `npm run dev` instead of `npm start` for auto-restart on file changes.

---

## 4. Configure & start the FRONTEND

Open a **second terminal** (leave the backend running):

```bash
cd frontend

# Copy env file (points the UI at the backend)
cp .env.example .env

npm install
npm run dev
```

You should see Vite print a local URL:
```
➜  Local:   http://localhost:5173/
```

---

## 5. Use the app

Open **<http://localhost:5173>** in your browser. You can now:

1. **Add a student** — fill the form (try uploading a photo) and click **Add Student**.
   An admission number like `ADM-2026-00001` is generated automatically.
2. **View the list** — students appear in the table below the form.
3. **Search / filter** — use the search box and the course/year filters.
4. **Edit** — click **Edit** on a row, change details, click **Update**.
5. **Drop** — click **Drop** to delete a record (asks for confirmation).
6. **Pagination** — use **Prev / Next** at the bottom of the table.

---

## 6. Quick API test (optional)

With the backend running:

```bash
# Create a student
curl -X POST http://localhost:5000/students \
  -F "name=John Doe" -F "course=BCA" -F "year=2" \
  -F "date_of_birth=2003-05-12" -F "email=john@example.com" \
  -F "mobile=9876543210" -F "gender=Male" -F "address=123 Main St"

# List students
curl "http://localhost:5000/students?page=1&limit=10"
```

---

## 🛠 Troubleshooting

| Problem | Fix |
| ------- | --- |
| `ECONNREFUSED` / `password authentication failed` | PostgreSQL isn't running, or the credentials in `backend/.env` are wrong. |
| `database "student_db" does not exist` | Run step 2 to create the database. |
| Frontend loads but no data / network errors | Make sure the backend is running on port 5000 and `frontend/.env` `VITE_API_URL` matches it. |
| CORS error in browser console | Ensure `CORS_ORIGIN` in `backend/.env` equals the frontend URL (`http://localhost:5173`). |
| Photo upload fails | File must be an image (JPEG/PNG/WEBP/GIF) under 2 MB (configurable via `MAX_UPLOAD_BYTES`). |
| Port already in use | Change `PORT` in `backend/.env` or stop the other process. |

---

## 📌 Summary of commands

```bash
# Terminal 1 — backend
cd backend && cp .env.example .env && npm install && npm start

# Terminal 2 — frontend
cd frontend && cp .env.example .env && npm install && npm run dev
```

Backend → http://localhost:5000  Frontend → http://localhost:5173
