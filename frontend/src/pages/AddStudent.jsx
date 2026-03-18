import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import StudentForm from '../components/students/StudentForm';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';
import './AddStudent.scss';

export default function AddStudent() {
  const { courses, batches, addStudent } = useAcademy();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (user?.role !== 'Admin') {
    return <Navigate to="/students" replace />;
  }

  async function handleSubmit(formData) {
    try {
      setSaving(true);
      await addStudent(formData);
      navigate('/students');
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to add student.');
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack add-student-modern">
      <div className="page-head add-student-head panel">
        <div>
          <h2>Add Student</h2>
          <p className="muted">Fill in student profile details to register a new admission record.</p>
        </div>
        <Link className="btn secondary" to="/students">
          Back to Students
        </Link>
      </div>
      {saving ? <div className="panel">Saving student...</div> : null}
      <StudentForm onSubmit={handleSubmit} courses={courses} batches={batches} />
    </div>
  );
}
