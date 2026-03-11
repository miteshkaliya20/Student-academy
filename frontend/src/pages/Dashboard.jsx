import StatCard from '../components/dashboard/StatCard';
import { useAcademy } from '../hooks/useAcademy';

export default function Dashboard() {
  const { totalStudents, activeBatches, monthlyFees, upcomingExams } = useAcademy();

  return (
    <div className="page-stack">
      <h2>Dashboard</h2>
      <section className="stats-grid">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Active Batches" value={activeBatches} />
        <StatCard label="Monthly Fee Collection" value={`₹ ${monthlyFees}`} />
        <StatCard label="Upcoming Exams (30 days)" value={upcomingExams} />
      </section>
    </div>
  );
}
