import { useMemo, useState } from 'react';
import './StudentTable.scss';

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

  const resultText = `${filtered.length} of ${students.length} students`;

  return (
    <section className="panel students-table-panel">
      <div className="table-header">
        <div>
          <h2>Students List</h2>
          <p className="muted students-result-note">{resultText}</p>
        </div>
        <div className="filters-row">
          <input
            className="search"
            placeholder="Search by name, phone, email, exam"
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
          <button type="button" className="btn secondary" onClick={() => setQuery('')}>
            Clear Search
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="mobile-cards">
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
                  No students found for current filters.
                </td>
              </tr>
            ) : (
              filtered.map((student) => (
                <tr key={student.id}>
                  <td data-label="Photo">
                    {student.photo ? (
                      <img src={student.photo} alt={student.fullName} className="avatar" />
                    ) : (
                      <div className="avatar placeholder">NA</div>
                    )}
                  </td>
                  <td data-label="Name">{student.fullName}</td>
                  <td data-label="Contact">
                    {student.phone}
                    <div className="sub-cell">{student.email || '-'}</div>
                  </td>
                  <td data-label="Exam">{student.examType}</td>
                  <td data-label="Course">{student.courseId ? courseMap[student.courseId] || '-' : '-'}</td>
                  <td data-label="Batch">{student.batchId ? batchMap[student.batchId] || '-' : '-'}</td>
                  <td className="row-actions" data-label="Actions">
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
