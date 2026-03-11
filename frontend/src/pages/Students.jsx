import { useState } from 'react';
import { Link } from 'react-router-dom';
import StudentForm from '../components/students/StudentForm';
import StudentTable from '../components/students/StudentTable';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';

export default function Students() {
  const { students, courses, batches, addStudent, updateStudent, deleteStudent } = useAcademy();
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);

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

  return (
    <div className="page-stack">
      <div className="page-head">
        <h2>Student Management</h2>
        {user?.role === 'Admin' ? (
          <Link className="btn" to="/students/add">
            Add Student
          </Link>
        ) : null}
      </div>
      {editing ? (
        <StudentForm
          onSubmit={handleSubmit}
          courses={courses}
          batches={batches}
          editStudent={editing}
          onCancelEdit={() => setEditing(null)}
        />
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
