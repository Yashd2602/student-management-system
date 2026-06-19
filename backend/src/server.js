import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import studentRoutes from './routes/students.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ---- Middleware ----
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos statically.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---- Routes ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/students', studentRoutes);

// ---- 404 ----
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ---- Central error handler ----
// Catches Multer errors (e.g. file too large / wrong type) and anything thrown
// by route handlers via next(err).
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Photo is too large' });
  }
  if (err.message && err.message.startsWith('Only ')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

// ---- Start ----
runMigrations()
  .then(() => {
    app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not start server — database migration failed:', err.message);
    process.exit(1);
  });
