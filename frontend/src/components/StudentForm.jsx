import { useState, useEffect, useRef } from 'react';

const EMPTY = {
  name: '',
  course: '',
  year: '',
  date_of_birth: '',
  email: '',
  mobile: '',
  gender: '',
  address: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{7,15}$/;

// Client-side validation mirrors the backend rules for instant feedback.
function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.course.trim()) errors.course = 'Course is required';
  if (!form.year) errors.year = 'Year is required';
  else if (Number(form.year) < 1 || Number(form.year) > 10) errors.year = 'Year must be 1-10';
  if (!form.date_of_birth) errors.date_of_birth = 'Date of birth is required';
  else if (new Date(form.date_of_birth) > new Date()) errors.date_of_birth = 'DOB cannot be in the future';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Email is not valid';
  if (!form.mobile.trim()) errors.mobile = 'Mobile is required';
  else if (!MOBILE_RE.test(form.mobile)) errors.mobile = 'Mobile must be 7-15 digits';
  if (!form.gender) errors.gender = 'Gender is required';
  return errors;
}

export default function StudentForm({ editing, onSubmit, onCancel, submitting, serverErrors, resetFormKey }) {
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const resetFormState = () => {
    setForm({ ...EMPTY });
    setPhoto(null);
    setPreview(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        course: editing.course || '',
        year: editing.year || '',
        date_of_birth: editing.date_of_birth ? editing.date_of_birth.slice(0, 10) : '',
        email: editing.email || '',
        mobile: editing.mobile || '',
        gender: editing.gender || '',
        address: editing.address || '',
      });
      setPreview(editing.photo_url || null);
      setPhoto(null);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      resetFormState();
    }
  }, [editing, resetFormKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(form, photo);
  };

  // Merge server-side field errors (e.g. duplicate email) with local ones.
  const allErrors = { ...errors, ...(serverErrors || {}) };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? 'Edit Student' : 'Add Student'}</h2>

      <div className="grid">
        <label>
          Name *
          <input name="name" value={form.name} onChange={handleChange} />
          {allErrors.name && <span className="error">{allErrors.name}</span>}
        </label>

        <label>
          Course *
          <input name="course" value={form.course} onChange={handleChange} />
          {allErrors.course && <span className="error">{allErrors.course}</span>}
        </label>

        <label>
          Year *
          <input type="number" name="year" min="1" max="10" value={form.year} onChange={handleChange} />
          {allErrors.year && <span className="error">{allErrors.year}</span>}
        </label>

        <label>
          Date of Birth *
          <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
          {allErrors.date_of_birth && <span className="error">{allErrors.date_of_birth}</span>}
        </label>

        <label>
          Email *
          <input type="email" name="email" value={form.email} onChange={handleChange} />
          {allErrors.email && <span className="error">{allErrors.email}</span>}
        </label>

        <label>
          Mobile *
          <input name="mobile" value={form.mobile} onChange={handleChange} />
          {allErrors.mobile && <span className="error">{allErrors.mobile}</span>}
        </label>

        <label>
          Gender *
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          {allErrors.gender && <span className="error">{allErrors.gender}</span>}
        </label>

        <label>
          Photo
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} />
        </label>

        <label className="full">
          Address
          <textarea name="address" rows="2" value={form.address} onChange={handleChange} />
        </label>
      </div>

      {preview && <img className="preview" src={preview} alt="preview" />}

      <div className="actions">
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : editing ? 'Update' : 'Add Student'}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
