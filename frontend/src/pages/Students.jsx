import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentForm from '../components/students/StudentForm';
import StudentTable from '../components/students/StudentTable';
import api from '../api/api';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';
import './Students.scss';

export default function Students() {
  const { students, courses, batches, addStudent, updateStudent, deleteStudent } = useAcademy();
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const editFormRef = useRef(null);
  const [exportFilters, setExportFilters] = useState({
    courseId: '',
    batchId: '',
  });

  useEffect(() => {
    if (!editing || !editFormRef.current) {
      return;
    }

    editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing]);

  const studentInsights = useMemo(() => {
    const withEmail = students.filter((student) => student.email).length;
    const withPhoto = students.filter((student) => student.photo).length;
    const withoutBatch = students.filter((student) => !student.batchId).length;
    return { withEmail, withPhoto, withoutBatch };
  }, [students]);

  async function handleSubmit(formData) {
    try {
      if (editing) {
        await updateStudent(editing.id, formData);
        setEditing(null);
        return;
      }
      await addStudent(formData);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to save student.');
      throw error;
    }
  }

  async function handleDelete(studentId) {
    if (user?.role !== 'Admin') {
      alert('Only Admin can delete students.');
      return;
    }
    const confirmed = window.confirm('Delete this student?');
    if (confirmed) {
      try {
        await deleteStudent(studentId);
      } catch (error) {
        alert(error.response?.data?.message || 'Unable to delete student.');
      }
    }
  }

  async function handleExportPdf() {
    if (user?.role !== 'Admin') {
      alert('Only Admin can export student data.');
      return;
    }

    try {
      setExportingPdf(true);
      const response = await api.get('/students/export/pdf', {
        responseType: 'blob',
        params: {
          courseId: exportFilters.courseId || undefined,
          batchId: exportFilters.batchId || undefined,
        },
      });

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const fallbackFilename = `students-${new Date().toISOString().slice(0, 10)}.pdf`;
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || fallbackFilename;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();

      // iOS Safari may ignore download attribute for blobs; opening in a new tab is a reliable fallback.
      if (!('download' in HTMLAnchorElement.prototype)) {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      }

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      try {
        if (error.response?.data instanceof Blob) {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          alert(parsed?.message || 'Unable to export student PDF.');
          return;
        }
      } catch (_parseError) {
        // Fall through to generic message when blob parsing fails.
      }

      alert(error.response?.data?.message || 'Unable to export student PDF.');
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="page-stack students-page-modern">
      <section className="panel students-hero">
        <div>
          <h2>Student Management</h2>
          <p>
            Manage student records, keep contacts accurate, and quickly export lists for operations.
          </p>
        </div>
      </section>

      <section className="panel section-toolbar">
        <div className="toolbar-meta">
          <span className="toolbar-chip">Role: {user?.role || 'Staff'}</span>
          <span className="toolbar-chip">Total: {students.length}</span>
          <span className="toolbar-chip">Email Profiles: {studentInsights.withEmail}</span>
        </div>
        {user?.role === 'Admin' ? (
          <div className="actions toolbar-actions">
            <button className="btn secondary" onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>
            <Link className="btn" to="/students/add">
              Add Student
            </Link>
          </div>
        ) : null}
      </section>

      <section className="students-mini-grid">
        <article className="panel students-mini-card">
          <p>Total Students</p>
          <h3>{students.length}</h3>
        </article>
        <article className="panel students-mini-card">
          <p>Profiles With Email</p>
          <h3>{studentInsights.withEmail}</h3>
        </article>
        <article className="panel students-mini-card">
          <p>Profiles With Photo</p>
          <h3>{studentInsights.withPhoto}</h3>
        </article>
        <article className="panel students-mini-card">
          <p>Students Missing Batch</p>
          <h3>{studentInsights.withoutBatch}</h3>
        </article>
      </section>

      {user?.role === 'Admin' ? (
        <section className="panel students-filter-panel">
          <h3>Export Filters</h3>
          <div className="filters-row">
            <select
              value={exportFilters.courseId}
              onChange={(event) =>
                setExportFilters((current) => ({ ...current, courseId: event.target.value }))
              }
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              value={exportFilters.batchId}
              onChange={(event) =>
                setExportFilters((current) => ({ ...current, batchId: event.target.value }))
              }
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn secondary"
              onClick={() => setExportFilters({ courseId: '', batchId: '' })}
            >
              Clear Filters
            </button>
          </div>
        </section>
      ) : null}
      {editing ? (
        <div ref={editFormRef}>
          <StudentForm
            onSubmit={handleSubmit}
            courses={courses}
            batches={batches}
            editStudent={editing}
            onCancelEdit={() => setEditing(null)}
          />
        </div>
      ) : null}
      <StudentTable
        students={students}
        courses={courses}
        batches={batches}
        onEdit={setEditing}
        onDelete={handleDelete}
        canEdit={user?.role === 'Admin'}
        canDelete={user?.role === 'Admin'}
      />
    </div>
  );
}
