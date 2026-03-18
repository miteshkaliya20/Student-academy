import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import StatCard from '../components/dashboard/StatCard';
import { useAcademy } from '../hooks/useAcademy';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.scss';

function parseSafeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseSafeDate(value);
  if (!date) {
    return 'Date not set';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const {
    courses,
    students,
    feePayments,
    examRecords,
    totalStudents,
    activeBatches,
    monthlyFees,
    upcomingExams,
    reloadData,
    loading,
  } = useAcademy();

  const totals = useMemo(() => {
    const totalFeesAssigned = students.reduce((sum, student) => sum + Number(student.feesTotal || 0), 0);
    const totalFeesCollected = students.reduce((sum, student) => sum + Number(student.feesPaid || 0), 0);
    const outstandingFees = Math.max(totalFeesAssigned - totalFeesCollected, 0);
    const collectionPercent = totalFeesAssigned
      ? Math.min(Math.round((totalFeesCollected / totalFeesAssigned) * 100), 100)
      : 0;

    return {
      totalFeesAssigned,
      totalFeesCollected,
      outstandingFees,
      collectionPercent,
    };
  }, [students]);

  const topCourses = useMemo(() => {
    const countsByCourse = students.reduce((map, student) => {
      if (!student.courseId) {
        return map;
      }
      map.set(student.courseId, (map.get(student.courseId) || 0) + 1);
      return map;
    }, new Map());

    return courses
      .map((course) => ({
        id: course.id,
        name: course.name,
        count: countsByCourse.get(course.id) || 0,
      }))
      .filter((course) => course.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [courses, students]);

  const recentPayments = useMemo(() => {
    return [...feePayments]
      .filter((payment) => payment.paidOn)
      .sort((a, b) => {
        const first = parseSafeDate(a.paidOn);
        const second = parseSafeDate(b.paidOn);
        return (second?.getTime() || 0) - (first?.getTime() || 0);
      })
      .slice(0, 4);
  }, [feePayments]);

  const nextExams = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return [...examRecords]
      .filter((exam) => {
        const examDate = parseSafeDate(exam.examDate);
        return examDate ? examDate >= now : false;
      })
      .sort((a, b) => {
        const first = parseSafeDate(a.examDate);
        const second = parseSafeDate(b.examDate);
        return (first?.getTime() || 0) - (second?.getTime() || 0);
      })
      .slice(0, 4);
  }, [examRecords]);

  return (
    <div className="page-stack dashboard-modern">
      <section className="dashboard-hero panel">
        <div className="dashboard-hero-copy">
          <span className="dashboard-tag">Live Academy Overview</span>
          <h2>{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</h2>
          <p>
            {isAdmin
              ? 'Track admissions, fee movement, and exam readiness from one control center.'
              : 'Monitor day-to-day academy operations with quick read-only operational insights.'}
          </p>
        </div>
      </section>

      <section className="panel section-toolbar">
        <div className="toolbar-meta">
          <span className="toolbar-chip">Role: {isAdmin ? 'Admin' : 'Staff'}</span>
          <span className="toolbar-chip">Students: {totalStudents}</span>
          <span className="toolbar-chip">Batches: {activeBatches}</span>
        </div>
        <div className="actions toolbar-actions">
          {isAdmin ? (
            <Link to="/students/add" className="btn">
              Add Student
            </Link>
          ) : null}
          <button type="button" className="btn secondary" onClick={reloadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total Students" value={totalStudents} icon="STU" tone="indigo" />
        <StatCard label="Active Batches" value={activeBatches} icon="BAT" tone="teal" />
        <StatCard
          label={isAdmin ? 'Monthly Fee Collection' : 'Fee Collection (View Only)'}
          value={formatCurrency(monthlyFees)}
          icon="FEE"
          tone="amber"
          hint={`${totals.collectionPercent}% collected overall`}
        />
        <StatCard
          label="Upcoming Exams (30 days)"
          value={upcomingExams}
          icon="EXM"
          tone="rose"
          hint={nextExams.length ? `Next on ${formatDate(nextExams[0].examDate)}` : 'No scheduled exams'}
        />
      </section>

      <section className="dashboard-grid-split">
        <article className="panel dashboard-panel dashboard-revenue">
          <div className="dashboard-panel-head">
            <h3>Fee Collection Pulse</h3>
            <span className="dashboard-chip">{totals.collectionPercent}%</span>
          </div>
          <p className="dashboard-subtext">Total collected against assigned student fee targets.</p>
          <div className="dashboard-progress">
            <span style={{ width: `${totals.collectionPercent}%` }} />
          </div>
          <div className="dashboard-kpi-row">
            <div>
              <p>Collected</p>
              <strong>{formatCurrency(totals.totalFeesCollected)}</strong>
            </div>
            <div>
              <p>Assigned</p>
              <strong>{formatCurrency(totals.totalFeesAssigned)}</strong>
            </div>
            <div>
              <p>Outstanding</p>
              <strong>{formatCurrency(totals.outstandingFees)}</strong>
            </div>
          </div>
        </article>

        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Next Exam Queue</h3>
            <span className="dashboard-chip neutral">{nextExams.length} scheduled</span>
          </div>

          {nextExams.length ? (
            <ul className="dashboard-list">
              {nextExams.map((exam) => (
                <li key={exam.id}>
                  <strong>{exam.testName}</strong>
                  <span>{formatDate(exam.examDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No future exam records found.</p>
          )}
        </article>
      </section>

      <section className="dashboard-grid-split">
        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Top Course Demand</h3>
            <span className="dashboard-chip neutral">By enrolled students</span>
          </div>

          {topCourses.length ? (
            <ul className="dashboard-list">
              {topCourses.map((course) => (
                <li key={course.id}>
                  <strong>{course.name}</strong>
                  <span>{course.count} students</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No enrollments yet.</p>
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Recent Fee Payments</h3>
            <span className="dashboard-chip neutral">Latest 4 records</span>
          </div>

          {recentPayments.length ? (
            <ul className="dashboard-list">
              {recentPayments.map((payment) => (
                <li key={payment.id}>
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <span>{formatDate(payment.paidOn)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No fee payments available yet.</p>
          )}
        </article>
      </section>

      {!isAdmin ? (
        <p className="muted">Staff permissions: create, update, and delete actions are restricted.</p>
      ) : null}
    </div>
  );
}
