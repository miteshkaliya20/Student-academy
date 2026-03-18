import { useEffect, useState } from 'react';
import './StudentForm.scss';

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

const allowedExamTypes = ['GPSC', 'Talati', 'Junior Clerk', 'Bin Sachivalay'];

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function validateStudentForm(values, batches) {
  const errors = {};

  const fullName = values.fullName.trim();
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.';
  } else if (!/^[A-Za-z\s.'-]+$/.test(fullName)) {
    errors.fullName = 'Full name can include letters, spaces, dot, apostrophe, and hyphen only.';
  }

  const phone = normalizePhone(values.phone);
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.examType.trim()) {
    errors.examType = 'Exam type is required.';
  } else if (!allowedExamTypes.includes(values.examType)) {
    errors.examType = 'Choose a valid exam type.';
  }

  if (!values.courseId) {
    errors.courseId = 'Please select a course.';
  }

  const availableBatches = batches.filter((batch) => batch.courseId === values.courseId);
  if (values.courseId && availableBatches.length > 0 && !values.batchId) {
    errors.batchId = 'Please select a batch for the selected course.';
  }

  return errors;
}

export default function StudentForm({ onSubmit, courses, batches, editStudent, onCancelEdit }) {
  const [form, setForm] = useState(editStudent || initialValues);
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setForm(editStudent || initialValues);
    setErrors({});
    setPhotoError('');
  }, [editStudent]);

  const batchOptions = batches.filter((batch) => !form.courseId || batch.courseId === form.courseId);

  function handleChange(event) {
    const { name } = event.target;
    const value = name === 'phone' ? normalizePhone(event.target.value).slice(0, 10) : event.target.value;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'courseId' ? { batchId: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoError('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be 2MB or smaller.');
      return;
    }

    const encoded = await toBase64(file);
    setPhotoError('');
    setForm((current) => ({ ...current, photo: encoded }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextForm = {
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: normalizePhone(form.phone),
    };

    const validationErrors = validateStudentForm(nextForm, batches);
    setErrors(validationErrors);

    if (photoError || Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit(nextForm);
    setForm(initialValues);
    setErrors({});
    setPhotoError('');
  }

  return (
    <section className="panel student-form-panel">
      <h2>{editStudent ? 'Edit Student' : 'Add Student'}</h2>
      <p className="muted student-form-note">All fields marked with * are mandatory.</p>
      <form className="form-grid student-form-grid" onSubmit={submit} noValidate>
        <label>
          Full Name *
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter student full name"
            className={errors.fullName ? 'input-error' : ''}
          />
          {errors.fullName ? <span className="error-msg">{errors.fullName}</span> : null}
        </label>
        <label>
          Phone *
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
            className={errors.phone ? 'input-error' : ''}
          />
          {errors.phone ? <span className="error-msg">{errors.phone}</span> : null}
        </label>
        <label>
          Email *
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="student@example.com"
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email ? <span className="error-msg">{errors.email}</span> : null}
        </label>
        <label>
          Exam Type *
          <select
            name="examType"
            value={form.examType}
            onChange={handleChange}
            className={errors.examType ? 'input-error' : ''}
          >
            <option>GPSC</option>
            <option>Talati</option>
            <option>Junior Clerk</option>
            <option>Bin Sachivalay</option>
          </select>
          {errors.examType ? <span className="error-msg">{errors.examType}</span> : null}
        </label>
        <label>
          Course *
          <select
            name="courseId"
            value={form.courseId}
            onChange={handleChange}
            className={errors.courseId ? 'input-error' : ''}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {errors.courseId ? <span className="error-msg">{errors.courseId}</span> : null}
        </label>
        <label>
          Batch *
          <select
            name="batchId"
            value={form.batchId}
            onChange={handleChange}
            className={errors.batchId ? 'input-error' : ''}
          >
            <option value="">Select batch</option>
            {batchOptions.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          {errors.batchId ? <span className="error-msg">{errors.batchId}</span> : null}
        </label>
        <label className="photo-input">
          Student Photo
          <input type="file" accept="image/*" onChange={handlePhoto} />
          {photoError ? <span className="error-msg">{photoError}</span> : null}
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
