import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { generateAdmissionNumber } from '../utils/admissionNumber.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Build the public URL for a stored photo file name.
const photoUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/uploads/${filename}` : null;

// Shape a DB row into the JSON we send to the client.
const serialize = (req, row) => ({
  ...row,
  photo_url: photoUrl(req, row.photo_path),
});

async function logActivity(studentId, action, details) {
  try {
    await query(
      'INSERT INTO activity_logs (student_id, action, details) VALUES ($1, $2, $3)',
      [studentId, action, details]
    );
  } catch (err) {
    // Logging must never break the main request.
    console.error('Failed to write activity log:', err.message);
  }
}

// Remove an orphaned uploaded file (used when a DB insert/update fails).
function removeFile(filename) {
  if (!filename) return;
  fs.promises.unlink(path.join(uploadDir, filename)).catch(() => {});
}

// GET /students  — list with server-side pagination, search and filtering.
export async function listStudents(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    // Free-text search across name, email and admission number.
    if (req.query.search) {
      params.push(`%${req.query.search.trim()}%`);
      const i = params.length;
      where.push(`(name ILIKE $${i} OR email ILIKE $${i} OR admission_number ILIKE $${i})`);
    }
    // Filter by course.
    if (req.query.course) {
      params.push(req.query.course.trim());
      where.push(`course = $${params.length}`);
    }
    // Filter by year.
    if (req.query.year) {
      params.push(Number(req.query.year));
      where.push(`year = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalResult = await query(
      `SELECT COUNT(*)::int AS total FROM students ${whereClause}`,
      params
    );
    const total = totalResult.rows[0].total;

    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT * FROM students ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: dataResult.rows.map((r) => serialize(req, r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /students/:id
export async function getStudent(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(serialize(req, rows[0]));
  } catch (err) {
    next(err);
  }
}

// POST /students
export async function createStudent(req, res, next) {
  const filename = req.file ? req.file.filename : null;
  try {
    const admissionNumber = await generateAdmissionNumber();
    const { name, course, year, date_of_birth, email, mobile, gender, address } = req.body;

    const { rows } = await query(
      `INSERT INTO students
         (admission_number, name, course, year, date_of_birth, email, mobile, gender, address, photo_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [admissionNumber, name.trim(), course.trim(), Number(year), date_of_birth,
       email.trim(), mobile.trim(), gender, address || null, filename]
    );

    await logActivity(rows[0].id, 'CREATE', `Created student ${rows[0].admission_number}`);
    res.status(201).json(serialize(req, rows[0]));
  } catch (err) {
    removeFile(filename);
    if (err.code === '23505') {
      // unique_violation — figure out which column.
      const field = err.constraint && err.constraint.includes('email') ? 'email' : 'admission_number';
      return res.status(409).json({ message: 'Duplicate value', errors: { [field]: `${field} already exists` } });
    }
    next(err);
  }
}

// PUT /students/:id
export async function updateStudent(req, res, next) {
  const filename = req.file ? req.file.filename : null;
  try {
    const existing = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      removeFile(filename);
      return res.status(404).json({ message: 'Student not found' });
    }

    const old = existing.rows[0];
    const { name, course, year, date_of_birth, email, mobile, gender, address } = req.body;
    // Keep the old photo unless a new one was uploaded.
    const newPhoto = filename || old.photo_path;

    const { rows } = await query(
      `UPDATE students SET
         name = $1, course = $2, year = $3, date_of_birth = $4, email = $5,
         mobile = $6, gender = $7, address = $8, photo_path = $9, updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [name.trim(), course.trim(), Number(year), date_of_birth, email.trim(),
       mobile.trim(), gender, address || null, newPhoto, req.params.id]
    );

    // If a new photo replaced an old one, delete the old file.
    if (filename && old.photo_path) removeFile(old.photo_path);

    await logActivity(rows[0].id, 'UPDATE', `Updated student ${rows[0].admission_number}`);
    res.json(serialize(req, rows[0]));
  } catch (err) {
    removeFile(filename);
    if (err.code === '23505') {
      const field = err.constraint && err.constraint.includes('email') ? 'email' : 'admission_number';
      return res.status(409).json({ message: 'Duplicate value', errors: { [field]: `${field} already exists` } });
    }
    next(err);
  }
}

// DELETE /students/:id
export async function deleteStudent(req, res, next) {
  try {
    const { rows } = await query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    removeFile(rows[0].photo_path);
    await logActivity(rows[0].id, 'DELETE', `Dropped student ${rows[0].admission_number}`);
    res.json({ message: 'Student deleted', id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

// GET /students/meta/analytics  — bonus: simple analytics.
export async function analytics(req, res, next) {
  try {
    const total = await query('SELECT COUNT(*)::int AS total FROM students');
    const byCourse = await query(
      'SELECT course, COUNT(*)::int AS count FROM students GROUP BY course ORDER BY count DESC'
    );
    const byGender = await query(
      'SELECT gender, COUNT(*)::int AS count FROM students GROUP BY gender'
    );
    const byYear = await query(
      'SELECT year, COUNT(*)::int AS count FROM students GROUP BY year ORDER BY year'
    );
    res.json({
      total: total.rows[0].total,
      byCourse: byCourse.rows,
      byGender: byGender.rows,
      byYear: byYear.rows,
    });
  } catch (err) {
    next(err);
  }
}
