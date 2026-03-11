import { useMemo, useState } from 'react';

export default function StudentTable({ students, courses, batches, onEdit, onDelete, canEdit, canDelete }) {
  const [query, setQuery] = useState('');
  const [examFilter, setExamFilter] = useState('All');

  const courseMap = useMemo(() => Object.fromEntries(courses.map((item) => [item.id, item.name])), [courses]);
  const batchMap = useMemo(() => Object.fromEntries(batches.map((item) => [item.id, item.name])), [batches]);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const byExam = examFilter === 'All' || student.examType === examFilter;
      if (!byExam) {
        return false;
      }
      const text = query.toLowerCase().trim();
      if (!text) {
        return true;
      }
      return [student.fullName, student.phone, student.email, student.examType]
        .join(' ')
        .toLowerCase()
        .includes(text);
    });
  }, [students, query, examFilter]);

  return (
    <section className="panel">
      <div className="table-header">
        <h2>Students List</h2>
        <div className="filters-row">
          <input
            className="search"
            placeholder="Search students"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
            <option>All</option>
            <option>GPSC</option>
            <option>Talati</option>
            <option>Junior Clerk</option>
            <option>Bin Sachivalay</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Exam</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="empty" colSpan="7">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((student) => (
                <tr key={student.id}>
                  <td>
                    {student.photo ? (
                      <img src={student.photo} alt={student.fullName} className="avatar" />
                    ) : (
                      <div className="avatar placeholder">NA</div>
                    )}
                  </td>
                  <td>{student.fullName}</td>
                  <td>
                    {student.phone}
                    <div className="sub-cell">{student.email || '-'}</div>
                  </td>
                  <td>{student.examType}</td>
                  <td>{student.courseId ? courseMap[student.courseId] || '-' : '-'}</td>
                  <td>{student.batchId ? batchMap[student.batchId] || '-' : '-'}</td>
                  <td className="row-actions">
                    <button
                      className="btn small"
                      onClick={() => onEdit(student)}
                      disabled={!canEdit}
                      title={canEdit ? 'Edit student' : 'Only Admin can edit students'}
                    >
                      Edit
                    </button>
                    <button className="btn small danger" onClick={() => onDelete(student.id)} disabled={!canDelete}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
