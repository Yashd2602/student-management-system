# 🎓 Student Management System

A full-stack web application to **add, view, edit, search and delete (drop) student records**, including photo upload, auto-generated unique admission numbers, server-side pagination, search/filter, and activity logging.

Built as a demonstration of full-stack development using **React + Node.js (Express) + PostgreSQL**.

---

## 🧰 Technologies Used

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| **Frontend** | React 18, Vite, Axios, plain CSS (responsive)|
| **Backend**  | Node.js, Express.js, Multer (file uploads)   |
| **Database** | PostgreSQL                                   |
| **Tooling**  | dotenv (env vars), CORS, Git/GitHub          |

---

## ✨ Features

- ➕ **Add Student** — name, course, year, date of birth, email, mobile, gender, address
- 🖼 **Photo upload** — image stored on disk, path saved in the database
- ✏️ **Edit / Update** student details (optionally replace the photo)
- 📋 **View list** of all students in a responsive table
- ❌ **Drop (delete)** a student record
- ✅ **Validation** on both the frontend and the backend
- 📱 **Responsive UI**
- 🔑 **Auto-generated unique Admission Number** (`ADM-<year>-<00001>`)
- 🔍 **Search** (name / email / admission number) and **filter** (course / year)
- 📄 **Server-side pagination**
- 📊 **Analytics** endpoint (totals by course / gender / year)
- 🗂 **Activity logging** for every create / update / delete
- ⚡ **Database indexes** on common search columns
- 🔐 **Environment variables** for all configuration

---

## 📁 Project Structure

```
student-management-system/
├── README.md              ← this file
├── HOW_TO_RUN.md          ← step-by-step run instructions
├── PROJECT_DETAILS.md     ← detailed write-up of what was built & how it works
├── .gitignore
├── backend/
│   ├── db/schema.sql       ← database schema, indexes, sequences
│   ├── src/
│   │   ├── server.js        ← Express app entry point
│   │   ├── config/db.js     ← PostgreSQL connection pool
│   │   ├── db/migrate.js    ← runs schema.sql on startup
│   │   ├── routes/students.js
│   │   ├── controllers/studentController.js
│   │   ├── middleware/      ← validation + photo upload
│   │   └── utils/admissionNumber.js
│   └── uploads/             ← stored photos
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/      ← StudentForm, StudentList
        └── services/api.js  ← Axios API client
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000`

| Method   | Endpoint                   | Description                                        |
| -------- | -------------------------- | -------------------------------------------------- |
| `GET`    | `/students`                | List students (supports `page`, `limit`, `search`, `course`, `year`) |
| `GET`    | `/students/:id`            | Get a single student                               |
| `POST`   | `/students`                | Create a student (multipart/form-data, optional `photo`) |
| `PUT`    | `/students/:id`            | Update a student                                   |
| `DELETE` | `/students/:id`            | Delete (drop) a student                            |
| `GET`    | `/students/meta/analytics` | Aggregate counts by course / gender / year         |
| `GET`    | `/health`                  | Health check                                       |

**Example — list with search & pagination:**
```
GET /students?search=john&course=BCA&year=2&page=1&limit=10
```

**Successful list response:**
```json
{
  "data": [ { "id": 1, "admission_number": "ADM-2026-00001", "name": "John Doe", "photo_url": "http://localhost:5000/uploads/student-...jpg", "...": "..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

---

## 🗄 Database Design

Table **`students`**

| Column             | Type           | Notes                              |
| ------------------ | -------------- | ---------------------------------- |
| `id`               | SERIAL PK      |                                    |
| `admission_number` | VARCHAR UNIQUE | auto-generated, unique             |
| `name`             | VARCHAR        | required                           |
| `course`           | VARCHAR        | required, indexed                  |
| `year`             | INTEGER        | CHECK 1–10, indexed                |
| `date_of_birth`    | DATE           | required                           |
| `email`            | VARCHAR UNIQUE | required                           |
| `mobile`           | VARCHAR        | required                           |
| `gender`           | VARCHAR        | CHECK Male/Female/Other            |
| `address`          | TEXT           | optional                           |
| `photo_path`       | VARCHAR        | stored photo reference             |
| `created_at`       | TIMESTAMPTZ    |                                    |
| `updated_at`       | TIMESTAMPTZ    |                                    |

Plus an **`activity_logs`** table and an **`admission_seq`** sequence backing the unique admission number. See `backend/db/schema.sql`.

---

## 🚀 Quick Start

See **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** for full step-by-step instructions. In short:

```bash
# 1. Create the database
createdb student_db

# 2. Backend
cd backend
cp .env.example .env        # edit DB credentials
npm install
npm start                   # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

---

## 📦 Version Control / GitHub

```bash
git init
git add .
git commit -m "Initial commit: Student Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/student-management-system.git
git push -u origin main
```

---

## 📝 License

MIT — for educational/demo use.
