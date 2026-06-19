import { useState, useEffect, useCallback } from 'react';
import { StudentApi } from './services/api.js';
import StudentForm from './components/StudentForm.jsx';
import StudentList from './components/StudentList.jsx';

export default function App() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [serverErrors, setServerErrors] = useState(null);
  const [toast, setToast] = useState(null);
  const [resetFormKey, setResetFormKey] = useState(0);

  // Search & filter state.
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (course) params.course = course;
      if (year) params.year = year;
      const res = await StudentApi.list(params);
      setStudents(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, course, year]);

  // Debounce search/filter changes.
  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleSubmit = async (form, photo) => {
    setSubmitting(true);
    setServerErrors(null);
    try {
      if (editing) {
        await StudentApi.update(editing.id, form, photo);
        showToast('Student updated', 'success');
      } else {
        await StudentApi.create(form, photo);
        showToast('Student added', 'success');
      }
      setEditing(null);
      if (!editing) setResetFormKey((k) => k + 1);
      setPage(1);
      fetchStudents();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setServerErrors(data.errors);
      showToast(data?.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Drop ${student.name} (${student.admission_number})?`)) return;
    try {
      await StudentApi.remove(student.id);
      showToast('Student dropped', 'success');
      fetchStudents();
    } catch (err) {
      showToast('Failed to delete student', 'error');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Student Management System</h1>
        <p className="muted">Add, edit, search and manage student records.</p>
      </header>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <StudentForm
        editing={editing}
        onSubmit={handleSubmit}
        onCancel={() => { setEditing(null); setServerErrors(null); }}
        submitting={submitting}
        serverErrors={serverErrors}
        resetFormKey={resetFormKey}
      />

      <section className="card">
        <div className="toolbar">
          <input
            className="search"
            placeholder="Search by name, email or admission #"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <input
            placeholder="Filter by course"
            value={course}
            onChange={(e) => { setCourse(e.target.value); setPage(1); }}
          />
          <input
            type="number"
            placeholder="Year"
            value={year}
            min="1"
            max="10"
            onChange={(e) => { setYear(e.target.value); setPage(1); }}
          />
        </div>

        <StudentList
          students={students}
          onEdit={(s) => { setEditing(s); setServerErrors(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onDelete={handleDelete}
          loading={loading}
        />

        <div className="pager">
          <button className="btn small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
          </span>
          <button
            className="btn small"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </section>
    </div>
  );
}
