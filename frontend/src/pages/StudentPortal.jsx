import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import studentApi, {
  STUDENT_TOKEN_STORAGE_KEY,
  STUDENT_USER_STORAGE_KEY,
} from '../api/studentApi';
import './StudentPortal.scss';

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

  const activeExamTotalQuestions = activeExam?.questions?.length || 0;
  const answeredCount = answers.filter((value) => value >= 0).length;

  if (!hasToken || !studentUser) {
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="page-stack student-portal student-portal-modern">
      <section className="student-portal-hero student-portal-hero-modern">
        <div className="student-hero-left">
          {profile?.photo ? (
            <img src={profile.photo} alt={studentUser.name} className="student-hero-avatar" />
          ) : (
            <div className="student-hero-avatar placeholder">{getInitials(studentUser.name)}</div>
          )}
          <div className="student-hero-text">
            <span className="student-hero-pill">Live Learning Hub</span>
            <h2>Welcome back, {studentUser.name}</h2>
            <p>{studentUser.email || '-'}</p>
          </div>
        </div>

        <div className="student-hero-actions">
          <div className="student-hero-metrics">
            <div>
              <span>Teachers</span>
              <strong>{teachers.length}</strong>
            </div>
            <div>
              <span>Upcoming Exams</span>
              <strong>{upcomingExams.length}</strong>
            </div>
            <div>
              <span>Attempts</span>
              <strong>{myAttempts.length}</strong>
            </div>
          </div>
          <button className="btn secondary" onClick={logoutStudent}>
            Logout
          </button>
        </div>
      </section>

      {error ? <div className="portal-alert error-msg">{error}</div> : null}
      {resultMessage ? <div className="portal-alert admission-submit-msg">{resultMessage}</div> : null}

      <section className="split-grid student-profile-grid">
        <div className="panel student-portal-card">
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

        <div className="panel student-portal-card">
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

      <section className="panel student-portal-card">
        <div className="page-head student-section-head">
          <h3>Teachers List</h3>
          <span className="student-hero-pill subtle">Mentors & Faculty</span>
        </div>
        {loading ? (
          <p className="muted">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="muted">No teachers found.</p>
        ) : (
          <ul className="list student-teacher-list">
            {teachers.map((teacher) => (
              <li key={`${teacher.username}-${teacher.role}`}>
                <span>{teacher.name}</span>
                <span className="teacher-role-chip">{teacher.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel student-portal-card">
        <div className="page-head student-section-head">
          <h3>Weekly Timetable</h3>
          <span className="student-hero-pill subtle">Stay On Track</span>
        </div>
        <div className="table-wrap">
          <table className="portal-table mobile-cards">
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
                    <td data-label="Day">{row.day}</td>
                    <td data-label="Time">{`${row.startTime} - ${row.endTime}`}</td>
                    <td data-label="Subject">{row.subject}</td>
                    <td data-label="Teacher">{row.teacherName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel student-portal-card">
        <div className="page-head student-section-head">
          <h3>Upcoming Exams</h3>
          <span className="student-hero-pill subtle">Ready For Challenge</span>
        </div>

        {upcomingExams.length === 0 ? (
          <p className="muted">No upcoming exams.</p>
        ) : (
          <div className="exam-card-grid">
            {upcomingExams.map((exam) => (
              <article key={exam._id} className="exam-card">
                <h4>{exam.title}</h4>
                <p>{formatDateTime(exam.scheduledAt)}</p>
                <div className="exam-card-meta">
                  <span>{exam.durationMinutes} mins</span>
                  <span>{exam.totalQuestions} questions</span>
                  <span>{`-${exam.negativeMarkPerWrong} negative`}</span>
                </div>
                <button className="btn small" disabled={exam.attempted} onClick={() => startExam(exam._id)}>
                  {exam.attempted ? 'Attempted' : 'Start Exam'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeExam ? (
        <section className="panel student-portal-card exam-live-panel">
          <div className="exam-live-top">
            <div>
              <h3>{activeExam.title}</h3>
              <p>{activeExam.description}</p>
              <p className="muted">
                {`Duration: ${activeExam.durationMinutes} mins | Questions: ${activeExam.questions.length} | Negative: -${activeExam.negativeMarkPerWrong}`}
              </p>
            </div>
            <div className="exam-live-status">
              <p className={remainingSeconds < 60 ? 'error-msg' : 'muted'}>
                Time Remaining: <strong>{formatTimer(remainingSeconds)}</strong>
              </p>
              <p className="muted">Answered: {answeredCount} / {activeExamTotalQuestions}</p>
            </div>
          </div>

          <div className="exam-progress-track" aria-hidden="true">
            <div
              className="exam-progress-value"
              style={{ width: `${activeExamTotalQuestions ? (answeredCount / activeExamTotalQuestions) * 100 : 0}%` }}
            />
          </div>

          <div className="page-stack">
            {activeExam.questions.map((question) => (
              <div key={question.index} className="panel exam-question-card">
                <p>
                  <strong>{`Q${question.index + 1}. ${question.text}`}</strong>
                </p>
                <div className="form-grid single-col exam-options-grid">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${question.index}-${optionIndex}`} className="exam-option-item">
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

      <section className="panel student-portal-card">
        <div className="page-head student-section-head">
          <h3>My Exam Attempts</h3>
          <span className="student-hero-pill subtle">Performance Timeline</span>
        </div>

        {myAttempts.length === 0 ? (
          <p className="muted">No attempts submitted.</p>
        ) : (
          <div className="attempt-card-grid">
            {myAttempts.map((attempt) => (
              <article key={attempt.id} className="attempt-card">
                <h4>{attempt.examTitle}</h4>
                <p className="muted">Scheduled: {formatDateTime(attempt.scheduledAt)}</p>
                <p className="attempt-score">{`${attempt.score}/${attempt.maxScore} (${attempt.percentage}%)`}</p>
                <p className="muted">Submitted: {formatDateTime(attempt.submittedAt)}</p>
                <button
                  className="btn small"
                  onClick={() => viewAttemptAnalytics(attempt.id)}
                  disabled={loadingAnalyticsId === attempt.id}
                >
                  {loadingAnalyticsId === attempt.id ? 'Loading...' : 'View Details'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedAttemptAnalytics ? (
        <section className="panel student-portal-card">
          <div className="page-head student-section-head">
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
              <div key={question.questionIndex} className="panel exam-question-card">
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
