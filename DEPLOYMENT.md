# Deployment Guide

This project can be deployed in two parts:

- Frontend: Vercel
- Backend: Render

## 1) Backend on Render

1. Create a new Web Service on Render.
2. Connect your GitHub repo.
3. Set the root directory to `backend`.
4. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `PORT=10000` (Render sets this automatically, but you can leave as is)
   - `CORS_ORIGIN=https://your-frontend-url.vercel.app`
   - `PGHOST=...`
   - `PGPORT=5432`
   - `PGUSER=...`
   - `PGPASSWORD=...`
   - `PGDATABASE=...`
6. Create a PostgreSQL database and connect it.

## 2) Frontend on Vercel

1. Create a new Vercel project.
2. Set the root directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variable:
   - `VITE_API_URL=https://your-backend-url.onrender.com`

## 3) Final check

- Open the frontend URL.
- Confirm the API works.
- Confirm photo uploads and search/filter features work.
