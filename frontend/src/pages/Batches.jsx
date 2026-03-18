import { useMemo } from 'react';
import CourseBatchManager from '../components/batches/CourseBatchManager';
import { useAcademy } from '../hooks/useAcademy';
import './Batches.scss';

export default function Batches() {
  const { courses, batches, addCourse, addBatch } = useAcademy();
  const avgFee = useMemo(() => {
    if (!courses.length) {
      return 0;
    }
    const total = courses.reduce((sum, course) => sum + Number(course.fee || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  return (
    <div className="page-stack section-page-modern">
      <section className="panel section-hero batches-hero">
        <div>
          <h2>Course & Batch Management</h2>
          <p>Create academic structure and keep timings aligned with enrolled courses.</p>
        </div>
      </section>

      <section className="section-metric-grid">
        <article className="panel section-metric-card">
          <p>Total Courses</p>
          <h3>{courses.length}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Total Batches</p>
          <h3>{batches.length}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Average Course Fee</p>
          <h3>₹ {avgFee}</h3>
        </article>
      </section>

      <CourseBatchManager courses={courses} batches={batches} addCourse={addCourse} addBatch={addBatch} />
    </div>
  );
}
