import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { useAuthContext } from './AuthContext';

const AcademyContext = createContext(null);

function getId(entityOrId) {
  if (!entityOrId) {
    return '';
  }
  return typeof entityOrId === 'string' ? entityOrId : entityOrId._id;
}

function mapCourse(course) {
  return {
    id: course._id,
    name: course.name,
    fee: Number(course.fee || 0),
  };
}

function mapBatch(batch) {
  return {
    id: batch._id,
    name: batch.name,
    courseId: getId(batch.course),
    timing: batch.timing || '',
  };
}

function mapStudent(student) {
  return {
    id: student._id,
    fullName: student.name,
    phone: student.mobile || '',
    email: student.email || '',
    examType: student.examType || 'GPSC',
    courseId: getId(student.course),
    batchId: getId(student.batch),
    photo: student.photo || '',
    feesTotal: Number(student.feesTotal || 0),
    feesPaid: Number(student.feesPaid || 0),
  };
}

function mapFeePayment(payment) {
  return {
    id: payment._id,
    studentId: getId(payment.student),
    courseId: getId(payment.course),
    amount: Number(payment.amount || 0),
    paidOn: payment.paidOn ? new Date(payment.paidOn).toISOString().slice(0, 10) : '',
    month: payment.month || '',
  };
}

function mapExamRecord(record) {
  return {
    id: record._id,
    studentId: getId(record.student),
    testName: record.testName,
    examDate: record.examDate ? new Date(record.examDate).toISOString().slice(0, 10) : '',
    score: Number(record.score || 0),
    attendance: record.attendance || 'Present',
    remarks: record.remarks || '',
  };
}

export function AcademyProvider({ children }) {
  const { user } = useAuthContext();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [examRecords, setExamRecords] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalStudents: 0,
    activeBatches: 0,
    monthlyFees: 0,
    upcomingExams: 0,
  });
  const [loading, setLoading] = useState(false);

  async function reloadData() {
    setLoading(true);
    try {
      const [
        coursesRes,
        batchesRes,
        studentsRes,
        feesRes,
        examsRes,
        dashboardRes,
      ] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        api.get('/students'),
        api.get('/fees'),
        api.get('/exams'),
        api.get('/dashboard/stats'),
      ]);

      setCourses(coursesRes.data.map(mapCourse));
      setBatches(batchesRes.data.map(mapBatch));
      setStudents(studentsRes.data.map(mapStudent));
      setFeePayments(feesRes.data.map(mapFeePayment));
      setExamRecords(examsRes.data.map(mapExamRecord));
      setDashboard(dashboardRes.data);
    } catch (_error) {
      setCourses([]);
      setBatches([]);
      setStudents([]);
      setFeePayments([]);
      setExamRecords([]);
      setDashboard({ totalStudents: 0, activeBatches: 0, monthlyFees: 0, upcomingExams: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setBatches([]);
      setStudents([]);
      setFeePayments([]);
      setExamRecords([]);
      setDashboard({ totalStudents: 0, activeBatches: 0, monthlyFees: 0, upcomingExams: 0 });
      return;
    }

    reloadData();
  }, [user]);

  async function addStudent(student) {
    await api.post('/students', {
      name: student.fullName,
      mobile: student.phone,
      email: student.email,
      examType: student.examType,
      course: student.courseId || null,
      batch: student.batchId || null,
      photo: student.photo || '',
    });
    await reloadData();
  }

  async function updateStudent(studentId, payload) {
    await api.put(`/students/${studentId}`, {
      name: payload.fullName,
      mobile: payload.phone,
      email: payload.email,
      examType: payload.examType,
      course: payload.courseId || null,
      batch: payload.batchId || null,
      photo: payload.photo || '',
    });
    await reloadData();
  }

  async function deleteStudent(studentId) {
    await api.delete(`/students/${studentId}`);
    await reloadData();
  }

  async function addCourse(course) {
    await api.post('/courses', course);
    await reloadData();
  }

  async function addBatch(batch) {
    await api.post('/batches', {
      name: batch.name,
      course: batch.courseId,
      timing: batch.timing,
    });
    await reloadData();
  }

  async function addFeePayment(payment) {
    await api.post('/fees', {
      student: payment.studentId,
      course: payment.courseId || null,
      amount: Number(payment.amount),
      paidOn: payment.paidOn,
      month: payment.month,
    });
    await reloadData();
  }

  async function addExamRecord(record) {
    await api.post('/exams', {
      student: record.studentId,
      testName: record.testName,
      examDate: record.examDate,
      score: Number(record.score || 0),
      attendance: record.attendance,
      remarks: record.remarks,
    });
    await reloadData();
  }

  const value = useMemo(
    () => ({
      courses,
      batches,
      students,
      feePayments,
      examRecords,
      totalStudents: Number(dashboard.totalStudents || students.length),
      activeBatches: Number(dashboard.activeBatches || batches.length),
      monthlyFees: Number(dashboard.monthlyFees || 0),
      upcomingExams: Number(dashboard.upcomingExams || 0),
      loading,
      addStudent,
      updateStudent,
      deleteStudent,
      addCourse,
      addBatch,
      addFeePayment,
      addExamRecord,
      reloadData,
    }),
    [courses, batches, students, feePayments, examRecords, dashboard, loading]
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademyContext() {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademyContext must be used inside AcademyProvider');
  }
  return context;
}
