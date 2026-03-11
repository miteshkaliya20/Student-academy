import { useMemo, useState } from 'react';
import { useAcademy } from '../hooks/useAcademy';

export default function Fees() {
  const { students, courses, feePayments, addFeePayment } = useAcademy();
  const [form, setForm] = useState({ studentId: '', amount: '', paidOn: '' });

  const dues = useMemo(() => {
    return students.map((student) => {
      const course = courses.find((item) => item.id === student.courseId);
      const totalFee = Number(course?.fee || 0);
      const paid = feePayments
        .filter((item) => item.studentId === student.id)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        student,
        totalFee,
        paid,
        pending: Math.max(totalFee - paid, 0),
      };
    });
  }, [students, courses, feePayments]);

  async function submit(event) {
    event.preventDefault();
    if (!form.studentId || !form.amount || !form.paidOn) {
      return;
    }
    const selected = students.find((item) => item.id === form.studentId);
    try {
      await addFeePayment({
        ...form,
        amount: Number(form.amount),
        courseId: selected?.courseId || '',
        month: form.paidOn.slice(0, 7),
      });
      setForm({ studentId: '', amount: '', paidOn: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to save payment.');
    }
  }

  return (
    <div className="page-stack">
      <h2>Fees Management</h2>

      <section className="panel">
        <h3>Collect Payment</h3>
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
            Amount
            <input
              type="number"
              value={form.amount}
              onChange={(event) => setForm((c) => ({ ...c, amount: event.target.value }))}
            />
          </label>
          <label>
            Payment Date
            <input
              type="date"
              value={form.paidOn}
              onChange={(event) => setForm((c) => ({ ...c, paidOn: event.target.value }))}
            />
          </label>
          <div className="actions span-all">
            <button className="btn" type="submit">
              Save Payment
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Pending Fees Tracker</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {dues.map((item) => (
                <tr key={item.student.id}>
                  <td>{item.student.fullName}</td>
                  <td>₹ {item.totalFee}</td>
                  <td>₹ {item.paid}</td>
                  <td>₹ {item.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
