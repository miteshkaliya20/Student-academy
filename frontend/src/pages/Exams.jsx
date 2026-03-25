import { useMemo, useState } from 'react';
import { useAcademy } from '../hooks/useAcademy';
import './Exams.scss';

export default function Exams() {
  const { students, examRecords, addExamRecord } = useAcademy();
  const [form, setForm] = useState({
    studentId: '',
    testName: '',
    examDate: '',
    score: '',
    attendance: 'Present',
    remarks: '',
  });

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student.fullName])),
    [students]
  );

  const examSummary = useMemo(() => {
    const total = examRecords.length;
    const presentCount = examRecords.filter((record) => record.attendance === 'Present').length;
    const avgScore = total
      ? Math.round(examRecords.reduce((sum, record) => sum + Number(record.score || 0), 0) / total)
      : 0;

    return {
      total,
      presentCount,
      avgScore,
    };
  }, [examRecords]);

  async function submit(event) {
    event.preventDefault();
    if (!form.studentId || !form.testName || !form.examDate) {
      return;
    }

    try {
      await addExamRecord({
        ...form,
        score: Number(form.score || 0),
      });

      setForm({ studentId: '', testName: '', examDate: '', score: '', attendance: 'Present', remarks: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to save exam record.');
    }
  }

  return (
    <div className="page-stack section-page-modern exams-page-modern">
      <section className="panel section-hero exams-hero">
        <div>
          <h2>Exam Tracking</h2>
          <p>Capture mock tests, monitor attendance, and maintain performance history.</p>
        </div>
      </section>

      <section className="section-metric-grid">
        <article className="panel section-metric-card">
          <p>Total Records</p>
          <h3>{examSummary.total}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Present Marked</p>
          <h3>{examSummary.presentCount}</h3>
        </article>
        <article className="panel section-metric-card">
          <p>Average Score</p>
          <h3>{examSummary.avgScore}</h3>
        </article>
      </section>

      <section className="panel section-panel">
        <h3>Add Mock Test / Attendance</h3>
        <form className="form-grid three-col" onSubmit={submit}>
          <label>
            Student
            <select
              value={form.studentId}
              onChange={(event) => setForm((c) => ({ ...c, studentId: event.target.value }))}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Test Name
            <input
              value={form.testName}
              onChange={(event) => setForm((c) => ({ ...c, testName: event.target.value }))}
            />
          </label>
          <label>
            Exam Date
            <input
              type="date"
              value={form.examDate}
              onChange={(event) => setForm((c) => ({ ...c, examDate: event.target.value }))}
            />
          </label>
          <label>
            Score
            <input
              type="number"
              value={form.score}
              onChange={(event) => setForm((c) => ({ ...c, score: event.target.value }))}
            />
          </label>
          <label>
            Attendance
            <select
              value={form.attendance}
              onChange={(event) => setForm((c) => ({ ...c, attendance: event.target.value }))}
            >
              <option>Present</option>
              <option>Absent</option>
            </select>
          </label>
          <label>
            Remarks
            <input
              value={form.remarks}
              onChange={(event) => setForm((c) => ({ ...c, remarks: event.target.value }))}
            />
          </label>
          <div className="actions span-all">
            <button className="btn" type="submit">
              Save Record
            </button>
          </div>
        </form>
      </section>

      <section className="panel section-panel">
        <h3>Performance Report</h3>
        <div className="table-wrap">
          <table className="exams-table mobile-cards">
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Date</th>
                <th>Score</th>
                <th>Attendance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {examRecords.length === 0 ? (
                <tr>
                  <td className="empty" colSpan="6">
                    No records yet.
                  </td>
                </tr>
              ) : (
                examRecords.map((record) => (
                  <tr key={record.id}>
                    <td data-label="Student">{studentMap[record.studentId] || '-'}</td>
                    <td data-label="Test">{record.testName}</td>
                    <td data-label="Date">{record.examDate}</td>
                    <td data-label="Score">{record.score}</td>
                    <td data-label="Attendance">{record.attendance}</td>
                    <td data-label="Remarks">{record.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
