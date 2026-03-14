import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { totalStudents, activeBatches, monthlyFees, upcomingExams } = useAcademy();

  return (
    <div className="page-stack">
      <h2>{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</h2>
      <p className="muted">
        {isAdmin
          ? 'You can manage records, batches, and fee workflows.'
          : 'View analytics and monitor day-to-day academy operations.'}
      </p>

      {isAdmin ? (
        <div className="actions-row">
          <Link to="/students/add" className="btn">
            Add Student
          </Link>
        </div>
      ) : null}

      <section className="stats-grid">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Active Batches" value={activeBatches} />
        <StatCard
          label={isAdmin ? 'Monthly Fee Collection' : 'Fee Collection (View Only)'}
          value={`Rs ${monthlyFees}`}
        />
        <StatCard label="Upcoming Exams (30 days)" value={upcomingExams} />
      </section>

      {!isAdmin ? (
        <p className="muted">Staff permissions: create, update, and delete actions are restricted.</p>
      ) : null}
    </div>
  );
}
