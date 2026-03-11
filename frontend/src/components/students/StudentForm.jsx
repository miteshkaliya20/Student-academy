import { useEffect, useState } from 'react';

const initialValues = {
  fullName: '',
  phone: '',
  email: '',
  examType: 'GPSC',
  courseId: '',
  batchId: '',
  photo: '',
};

async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentForm({ onSubmit, courses, batches, editStudent, onCancelEdit }) {
  const [form, setForm] = useState(editStudent || initialValues);

  useEffect(() => {
    setForm(editStudent || initialValues);
  }, [editStudent]);

  const batchOptions = batches.filter((batch) => !form.courseId || batch.courseId === form.courseId);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'courseId' ? { batchId: '' } : {}),
    }));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const encoded = await toBase64(file);
    setForm((current) => ({ ...current, photo: encoded }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.examType.trim()) {
      alert('Name, phone and exam type are required.');
      return;
    }
    onSubmit(form);
    setForm(initialValues);
  }

  return (
    <section className="panel">
      <h2>{editStudent ? 'Edit Student' : 'Add Student'}</h2>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Full Name
          <input name="fullName" value={form.fullName} onChange={handleChange} />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <label>
          Email
          <input name="email" value={form.email} onChange={handleChange} />
        </label>
        <label>
          Exam Type
          <select name="examType" value={form.examType} onChange={handleChange}>
            <option>GPSC</option>
            <option>Talati</option>
            <option>Junior Clerk</option>
            <option>Bin Sachivalay</option>
          </select>
        </label>
        <label>
          Course
          <select name="courseId" value={form.courseId} onChange={handleChange}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Batch
          <select name="batchId" value={form.batchId} onChange={handleChange}>
            <option value="">Select batch</option>
            {batchOptions.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="photo-input">
          Student Photo
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </label>
        <div className="actions span-all">
          <button className="btn" type="submit">
            {editStudent ? 'Update Student' : 'Add Student'}
          </button>
          {editStudent && (
            <button className="btn secondary" type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
