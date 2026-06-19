export default function StudentList({ students, onEdit, onDelete, loading }) {
  if (loading) return <p className="muted">Loading students…</p>;
  if (!students.length) return <p className="muted">No students found.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Admission #</th>
            <th>Name</th>
            <th>Course</th>
            <th>Year</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>
                {s.photo_url ? (
                  <img className="avatar" src={s.photo_url} alt={s.name} />
                ) : (
                  <span className="avatar placeholder">{s.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </td>
              <td>{s.admission_number}</td>
              <td>{s.name}</td>
              <td>{s.course}</td>
              <td>{s.year}</td>
              <td>{s.email}</td>
              <td>{s.mobile}</td>
              <td>{s.gender}</td>
              <td>
                <div className="row-actions">
                <button className="btn small" onClick={() => onEdit(s)}>Edit</button>
                <button className="btn small danger" onClick={() => onDelete(s)}>Drop</button></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
