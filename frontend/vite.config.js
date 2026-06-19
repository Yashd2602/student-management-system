import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The frontend talks to the backend via the VITE_API_URL env var (see .env.example).
// During development we also proxy /uploads and /students through Vite so relative
// URLs work even without setting the env var.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
