import { useState } from 'react';
import './CourseBatchManager.scss';

export default function CourseBatchManager({ courses, batches, addCourse, addBatch }) {
  const [courseForm, setCourseForm] = useState({ name: '', fee: '' });
  const [batchForm, setBatchForm] = useState({ name: '', courseId: '', timing: '' });

  async function submitCourse(event) {
    event.preventDefault();
    if (!courseForm.name.trim() || !courseForm.fee) {
      return;
    }
    await addCourse({ name: courseForm.name.trim(), fee: Number(courseForm.fee) });
    setCourseForm({ name: '', fee: '' });
  }

  async function submitBatch(event) {
    event.preventDefault();
    if (!batchForm.name.trim() || !batchForm.courseId) {
      return;
    }
    await addBatch({ ...batchForm, name: batchForm.name.trim() });
    setBatchForm({ name: '', courseId: '', timing: '' });
  }

  return (
    <div className="split-grid">
      <section className="panel section-panel">
        <h2>Courses</h2>
        <p className="muted">Define courses and fee structures offered by Academy.</p>
        <form className="form-grid two-col" onSubmit={submitCourse}>
          <label>
            Course Name
            <input
              value={courseForm.name}
              onChange={(event) => setCourseForm((c) => ({ ...c, name: event.target.value }))}
            />
          </label>
          <label>
            Fee Structure
            <input
              type="number"
              value={courseForm.fee}
              onChange={(event) => setCourseForm((c) => ({ ...c, fee: event.target.value }))}
            />
          </label>
          <div className="actions span-all">
            <button className="btn" type="submit">
              Add Course
            </button>
          </div>
        </form>

        <ul className="list">
          {courses.map((course) => (
            <li key={course.id}>
              <strong>{course.name}</strong>
              <span>₹ {course.fee}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel section-panel">
        <h2>Batches</h2>
        <p className="muted">Assign schedules by mapping each batch to a course.</p>
        <form className="form-grid two-col" onSubmit={submitBatch}>
          <label>
            Batch Name
            <input
              value={batchForm.name}
              onChange={(event) => setBatchForm((b) => ({ ...b, name: event.target.value }))}
            />
          </label>
          <label>
            Course
            <select
              value={batchForm.courseId}
              onChange={(event) => setBatchForm((b) => ({ ...b, courseId: event.target.value }))}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label className="span-all">
            Batch Timing
            <input
              value={batchForm.timing}
              onChange={(event) => setBatchForm((b) => ({ ...b, timing: event.target.value }))}
              placeholder="Morning / Evening"
            />
          </label>
          <div className="actions span-all">
            <button className="btn" type="submit">
              Add Batch
            </button>
          </div>
        </form>

        <ul className="list">
          {batches.map((batch) => {
            const course = courses.find((item) => item.id === batch.courseId);
            return (
              <li key={batch.id}>
                <strong>{batch.name}</strong>
                <span>{course?.name || 'No course'} • {batch.timing || 'NA'}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
