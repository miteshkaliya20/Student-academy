import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import StudentForm from '../components/students/StudentForm';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-head">
        <h2>Add Student</h2>
        <Link className="btn secondary" to="/students">
          Back to Students
        </Link>
      </div>
      {saving ? <div className="panel">Saving student...</div> : null}
      <StudentForm onSubmit={handleSubmit} courses={courses} batches={batches} />
    </div>
  );
}
