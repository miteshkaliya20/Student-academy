import CourseBatchManager from '../components/batches/CourseBatchManager';
import { useAcademy } from '../hooks/useAcademy';

export default function Batches() {
  const { courses, batches, addCourse, addBatch } = useAcademy();

  return (
    <div className="page-stack">
      <h2>Course & Batch Management</h2>
      <CourseBatchManager courses={courses} batches={batches} addCourse={addCourse} addBatch={addBatch} />
    </div>
  );
}
