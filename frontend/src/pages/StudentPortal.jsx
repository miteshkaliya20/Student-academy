import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import studentApi, {
  STUDENT_TOKEN_STORAGE_KEY,
  STUDENT_USER_STORAGE_KEY,
} from '../api/studentApi';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

function formatTimer(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const sec = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
  return `${min}:${sec}`;
}

function getInitials(name) {
  const raw = String(name || '').trim();
  if (!raw) {
    return 'ST';
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return `${first}${second}`.toUpperCase() || raw.slice(0, 2).toUpperCase();
}

export default function StudentPortal() {
  const [studentUser, setStudentUser] = useState(() => {
    const raw = localStorage.getItem(STUDENT_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '', photo: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);

  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submittingExam, setSubmittingExam] = useState(false);

  const [selectedAttemptAnalytics, setSelectedAttemptAnalytics] = useState(null);

  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingAnalyticsId, setLoadingAnalyticsId] = useState('');
  const [error, setError] = useState('');

  const autoSubmittedRef = useRef(false);

  const hasToken = useMemo(() => Boolean(localStorage.getItem(STUDENT_TOKEN_STORAGE_KEY)), [studentUser]);

  async function loadPortalData() {
    setLoading(true);
    setError('');

    try {
      const [profileRes, teachersRes, timetableRes, upcomingRes, attemptsRes] = await Promise.all([
        studentApi.get('/student-portal/me'),
        studentApi.get('/student-portal/teachers'),
        studentApi.get('/student-portal/timetable'),
        studentApi.get('/student-portal/upcoming-exams'),
        studentApi.get('/student-portal/my-attempts'),
      ]);

      setProfile(profileRes.data);
      setProfileForm({
        name: profileRes.data.name || '',
        mobile: profileRes.data.mobile || '',
        photo: profileRes.data.photo || '',
      });
      setTeachers(teachersRes.data);
      setTimetable(timetableRes.data);
      setUpcomingExams(upcomingRes.data);
      setMyAttempts(attemptsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load student portal data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasToken) {
      loadPortalData();
    }
  }, [hasToken]);

  useEffect(() => {
    if (!activeExam || submittingExam) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeExam, submittingExam]);

  useEffect(() => {
    if (!activeExam || remainingSeconds > 0 || submittingExam || autoSubmittedRef.current) {
      return;
    }

    autoSubmittedRef.current = true;
    submitExam(true);
  }, [activeExam, remainingSeconds, submittingExam]);

  async function startExam(examId) {
    setError('');
    setResultMessage('');
    setSelectedAttemptAnalytics(null);

    try {
      const { data } = await studentApi.get(`/student-portal/upcoming-exams/${examId}`);
      setActiveExam(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      const endsAt = new Date(data.endsAt).getTime();
      const now = Date.now();
      setRemainingSeconds(Math.max(0, Math.floor((endsAt - now) / 1000)));
      autoSubmittedRef.current = false;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start exam.');
    }
  }

  function updateAnswer(questionIndex, optionIndex) {
    setAnswers((current) => current.map((value, idx) => (idx === questionIndex ? optionIndex : value)));
  }

  async function submitExam(isAutoSubmit = false) {
    if (!activeExam || submittingExam) {
      return;
    }

    setSubmittingExam(true);
    setError('');
    setResultMessage('');

    try {
      const { data } = await studentApi.post(`/student-portal/upcoming-exams/${activeExam._id}/submit`, {
        answers,
        startedAt: activeExam.startedAt,
      });

      const prefix = isAutoSubmit || data.result.isAutoSubmitted ? 'Time up. ' : '';
      setResultMessage(
        `${prefix}Submitted successfully. Score: ${data.result.score}/${data.result.maxScore} (${data.result.percentage}%)`
      );
      setActiveExam(null);
      setRemainingSeconds(0);
      await loadPortalData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit exam.');
    } finally {
      setSubmittingExam(false);
      autoSubmittedRef.current = false;
    }
  }

  async function viewAttemptAnalytics(attemptId) {
    setLoadingAnalyticsId(attemptId);
    setError('');

    try {
      const { data } = await studentApi.get(`/student-portal/my-attempts/${attemptId}`);
      setSelectedAttemptAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attempt analytics.');
    } finally {
      setLoadingAnalyticsId('');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setResultMessage('');

    try {
      const { data } = await studentApi.put('/student-portal/me', profileForm);
      setProfile(data);
      setResultMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setChangingPassword(true);
    setError('');
    setResultMessage('');

    try {
      const { data } = await studentApi.patch('/student-portal/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setResultMessage(data.message || 'Password updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  function logoutStudent() {
    localStorage.removeItem(STUDENT_TOKEN_STORAGE_KEY);
    localStorage.removeItem(STUDENT_USER_STORAGE_KEY);
    setStudentUser(null);
  }

  if (!hasToken || !studentUser) {
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="page-stack student-portal">
      <section className="student-portal-hero">
        <div className="student-hero-left">
          {profile?.photo ? (
            <img src={profile.photo} alt={studentUser.name} className="student-hero-avatar" />
          ) : (
            <div className="student-hero-avatar placeholder">{getInitials(studentUser.name)}</div>
          )}
          <div className="student-hero-text">
            <h2>Student Portal</h2>
            <p>{studentUser.name}</p>
            <p>{studentUser.email || '-'}</p>
          </div>
        </div>

        <button className="btn secondary" onClick={logoutStudent}>
          Logout
        </button>
      </section>

      {error ? <div className="error-msg">{error}</div> : null}
      {resultMessage ? <div className="admission-submit-msg">{resultMessage}</div> : null}

      <section className="split-grid">
        <div className="panel">
          <h3>My Profile</h3>
          {profile ? <p className="muted">Email: {profile.email || '-'}</p> : null}
          <form className="form-grid single-col" onSubmit={saveProfile}>
            <label>
              Name
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Mobile
              <input
                value={profileForm.mobile}
                maxLength={10}
                onChange={(event) => setProfileForm((current) => ({ ...current, mobile: event.target.value }))}
              />
            </label>
            <label>
              Photo URL
              <input
                value={profileForm.photo}
                onChange={(event) => setProfileForm((current) => ({ ...current, photo: event.target.value }))}
              />
            </label>
            <button className="btn" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>Change Password</h3>
          <form className="form-grid single-col" onSubmit={updatePassword}>
            <label>
              Current Password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
            </label>
            <button className="btn" type="submit" disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <h3>Teachers List</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="list">
            {teachers.map((teacher) => (
              <li key={`${teacher.username}-${teacher.role}`}>
                <span>{teacher.name}</span>
                <span>{teacher.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>Weekly Timetable</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {timetable.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={4}>
                    No timetable entries.
                  </td>
                </tr>
              ) : (
                timetable.map((row) => (
                  <tr key={row._id}>
                    <td>{row.day}</td>
                    <td>{`${row.startTime} - ${row.endTime}`}</td>
                    <td>{row.subject}</td>
                    <td>{row.teacherName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Upcoming Exams</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Scheduled At</th>
                <th>Duration</th>
                <th>Negative Marking</th>
                <th>Questions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {upcomingExams.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={6}>
                    No upcoming exams.
                  </td>
                </tr>
              ) : (
                upcomingExams.map((exam) => (
                  <tr key={exam._id}>
                    <td>{exam.title}</td>
                    <td>{formatDateTime(exam.scheduledAt)}</td>
                    <td>{exam.durationMinutes} mins</td>
                    <td>{`-${exam.negativeMarkPerWrong}`}</td>
                    <td>{exam.totalQuestions}</td>
                    <td>
                      <button
                        className="btn small"
                        disabled={exam.attempted}
                        onClick={() => startExam(exam._id)}
                      >
                        {exam.attempted ? 'Attempted' : 'Start Exam'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {activeExam ? (
        <section className="panel">
          <h3>{activeExam.title}</h3>
          <p>{activeExam.description}</p>
          <p>
            Duration: {activeExam.durationMinutes} mins | Questions: {activeExam.questions.length} | Negative:
            {` -${activeExam.negativeMarkPerWrong}`}
          </p>
          <p className={remainingSeconds < 60 ? 'error-msg' : 'muted'}>
            Time Remaining: {formatTimer(remainingSeconds)}
          </p>

          <div className="page-stack">
            {activeExam.questions.map((question) => (
              <div key={question.index} className="panel">
                <p>
                  <strong>{`Q${question.index + 1}. ${question.text}`}</strong>
                </p>
                <div className="form-grid single-col">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${question.index}-${optionIndex}`}>
                      <input
                        type="radio"
                        name={`q-${question.index}`}
                        checked={answers[question.index] === optionIndex}
                        onChange={() => updateAnswer(question.index, optionIndex)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="actions">
              <button className="btn" onClick={() => submitExam(false)} disabled={submittingExam}>
                {submittingExam ? 'Submitting...' : 'Submit Exam'}
              </button>
              <button className="btn secondary" onClick={() => setActiveExam(null)} disabled={submittingExam}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h3>My Exam Attempts</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Scheduled At</th>
                <th>Score</th>
                <th>Submitted At</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {myAttempts.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={5}>
                    No attempts submitted.
                  </td>
                </tr>
              ) : (
                myAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.examTitle}</td>
                    <td>{formatDateTime(attempt.scheduledAt)}</td>
                    <td>{`${attempt.score}/${attempt.maxScore} (${attempt.percentage}%)`}</td>
                    <td>{formatDateTime(attempt.submittedAt)}</td>
                    <td>
                      <button
                        className="btn small"
                        onClick={() => viewAttemptAnalytics(attempt.id)}
                        disabled={loadingAnalyticsId === attempt.id}
                      >
                        {loadingAnalyticsId === attempt.id ? 'Loading...' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedAttemptAnalytics ? (
        <section className="panel">
          <div className="page-head">
            <h3>Attempt Analytics</h3>
            <button className="btn secondary small" onClick={() => setSelectedAttemptAnalytics(null)}>
              Hide Details
            </button>
          </div>
          <p>
            {selectedAttemptAnalytics.examTitle} | Score: {selectedAttemptAnalytics.score}/
            {selectedAttemptAnalytics.maxScore} ({selectedAttemptAnalytics.percentage}%)
          </p>
          <p>Negative Marking: -{selectedAttemptAnalytics.negativeMarkPerWrong} per wrong answer</p>

          <div className="page-stack">
            {selectedAttemptAnalytics.questionAnalytics.map((question) => (
              <div key={question.questionIndex} className="panel">
                <p>
                  <strong>{`Q${question.questionIndex + 1}. ${question.questionText}`}</strong>
                </p>
                <p>
                  Your answer:{' '}
                  {question.selectedOptionIndex >= 0
                    ? question.options[question.selectedOptionIndex]
                    : 'Not answered'}
                </p>
                <p>Correct answer: {question.options[question.correctOptionIndex]}</p>
                <p className={question.isCorrect ? 'admission-submit-msg' : 'error-msg'}>
                  {question.isCorrect ? 'Correct' : 'Incorrect'}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
