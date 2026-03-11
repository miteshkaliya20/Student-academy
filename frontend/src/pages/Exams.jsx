import { useMemo, useState } from 'react';
import { useAcademy } from '../hooks/useAcademy';

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
    <div className="page-stack">
      <h2>Exam Tracking</h2>

      <section className="panel">
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

      <section className="panel">
        <h3>Performance Report</h3>
        <div className="table-wrap">
          <table>
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
                    <td>{studentMap[record.studentId] || '-'}</td>
                    <td>{record.testName}</td>
                    <td>{record.examDate}</td>
                    <td>{record.score}</td>
                    <td>{record.attendance}</td>
                    <td>{record.remarks || '-'}</td>
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
