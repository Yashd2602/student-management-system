import { query } from '../config/db.js';

// Generates a unique Admission Number of the form:  ADM-<year>-<0000N>
// The numeric part comes from a PostgreSQL sequence (admission_seq), so it is
// guaranteed unique and monotonically increasing even under concurrency.
export async function generateAdmissionNumber() {
  const { rows } = await query("SELECT nextval('admission_seq') AS seq");
  const seq = String(rows[0].seq).padStart(5, '0');
  const year = new Date().getFullYear();
  return `ADM-${year}-${seq}`;
}
