const User = require("../models/User");
const Student = require("../models/Student");
const WeeklyTimetable = require("../models/WeeklyTimetable");
const OnlineExam = require("../models/OnlineExam");
const OnlineExamAttempt = require("../models/OnlineExamAttempt");

const dayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

async function seedStudentPortalData() {
  await OnlineExam.updateMany(
    { negativeMarkPerWrong: { $exists: false } },
    { $set: { negativeMarkPerWrong: 0.25 } }
  );

  const timetableCount = await WeeklyTimetable.countDocuments();
  if (timetableCount === 0) {
    await WeeklyTimetable.create([
      {
        day: "Monday",
        startTime: "08:00",
        endTime: "09:30",
        subject: "Indian Polity",
        teacherName: "Academy Staff",
      },
      {
        day: "Wednesday",
        startTime: "10:00",
        endTime: "11:30",
        subject: "Current Affairs",
        teacherName: "Academy Staff",
      },
      {
        day: "Friday",
        startTime: "09:00",
        endTime: "10:30",
        subject: "History of Gujarat",
        teacherName: "Academy Staff",
      },
    ]);
  }

  const upcomingExamCount = await OnlineExam.countDocuments();
  if (upcomingExamCount === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await OnlineExam.create({
      title: "Weekly Mock Test - Foundation",
      description: "General aptitude and Gujarat GK.",
      scheduledAt: tomorrow,
      durationMinutes: 30,
      negativeMarkPerWrong: 0.25,
      questions: [
        {
          text: "Capital city of Gujarat is?",
          options: ["Surat", "Ahmedabad", "Gandhinagar", "Rajkot"],
          correctOptionIndex: 2,
        },
        {
          text: "The Constitution of India came into effect on?",
          options: ["15 Aug 1947", "26 Jan 1950", "26 Nov 1949", "2 Oct 1950"],
          correctOptionIndex: 1,
        },
        {
          text: "Which river is known as the lifeline of Gujarat?",
          options: ["Sabarmati", "Narmada", "Tapi", "Mahi"],
          correctOptionIndex: 1,
        },
      ],
    });
  }
}

async function getTeachers(_req, res) {
  const teachers = await User.find({ role: { $in: ["Staff", "Admin"] } })
    .select("name username role -_id")
    .sort({ role: 1, name: 1 });
  return res.json(teachers);
}

async function getTimetable(_req, res) {
  const timetable = await WeeklyTimetable.find().sort({ day: 1, startTime: 1 });
  const ordered = [...timetable].sort((a, b) => {
    const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dayDiff !== 0) {
      return dayDiff;
    }
    return String(a.startTime).localeCompare(String(b.startTime));
  });

  return res.json(ordered);
}

async function getUpcomingExams(req, res) {
  const now = new Date();
  const exams = await OnlineExam.find({ active: true, scheduledAt: { $gte: now } })
    .sort({ scheduledAt: 1 })
    .lean();

  const studentId = req.user.studentId;
  const attempts = await OnlineExamAttempt.find({ student: studentId }).select("exam").lean();
  const attemptedExamIds = new Set(attempts.map((attempt) => String(attempt.exam)));

  const response = exams.map((exam) => ({
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    scheduledAt: exam.scheduledAt,
    durationMinutes: exam.durationMinutes,
    negativeMarkPerWrong: Number(exam.negativeMarkPerWrong ?? 0.25),
    totalQuestions: exam.questions.length,
    attempted: attemptedExamIds.has(String(exam._id)),
  }));

  return res.json(response);
}

async function getExamForAttempt(req, res) {
  const exam = await OnlineExam.findById(req.params.examId).lean();
  if (!exam || !exam.active) {
    return res.status(404).json({ message: "Exam not found" });
  }

  const attempt = await OnlineExamAttempt.findOne({
    exam: exam._id,
    student: req.user.studentId,
  }).lean();

  if (attempt) {
    return res.status(400).json({ message: "Exam already attempted" });
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + Number(exam.durationMinutes || 0) * 60 * 1000);

  return res.json({
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    scheduledAt: exam.scheduledAt,
    durationMinutes: exam.durationMinutes,
    negativeMarkPerWrong: Number(exam.negativeMarkPerWrong ?? 0.25),
    startedAt,
    endsAt,
    questions: exam.questions.map((question, index) => ({
      index,
      text: question.text,
      options: question.options,
    })),
  });
}

async function submitExam(req, res) {
  const exam = await OnlineExam.findById(req.params.examId);
  if (!exam || !exam.active) {
    return res.status(404).json({ message: "Exam not found" });
  }

  const existingAttempt = await OnlineExamAttempt.findOne({
    exam: exam._id,
    student: req.user.studentId,
  });

  if (existingAttempt) {
    return res.status(400).json({ message: "Exam already submitted" });
  }

  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const maxScore = exam.questions.length;
  const negativeMarkPerWrong = Number(exam.negativeMarkPerWrong ?? 0.25);
  const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : new Date();
  const submittedAt = new Date();
  const examEnd = new Date(startedAt.getTime() + Number(exam.durationMinutes || 0) * 60 * 1000);
  const isAutoSubmitted = submittedAt.getTime() >= examEnd.getTime();

  let rawScore = 0;
  const questionResults = [];

  exam.questions.forEach((question, idx) => {
    const parsed = Number(answers[idx]);
    const selectedOptionIndex = Number.isInteger(parsed) ? parsed : -1;
    const isCorrect = selectedOptionIndex === question.correctOptionIndex;

    if (isCorrect) {
      rawScore += 1;
    } else if (selectedOptionIndex >= 0) {
      rawScore -= negativeMarkPerWrong;
    }

    questionResults.push({
      questionIndex: idx,
      selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect,
    });
  });

  const score = Math.max(0, Number(rawScore.toFixed(2)));

  const attempt = await OnlineExamAttempt.create({
    exam: exam._id,
    student: req.user.studentId,
    answers: answers.map((value) => Number(value)),
    questionResults,
    score,
    maxScore,
    submittedAt,
  });

  return res.status(201).json({
    message: isAutoSubmitted ? "Time up. Exam auto-submitted." : "Exam submitted successfully",
    result: {
      attemptId: attempt._id,
      examId: exam._id,
      score,
      maxScore,
      negativeMarkPerWrong,
      percentage: maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0,
      isAutoSubmitted,
      questionResults,
    },
  });
}

async function getMyAttempts(req, res) {
  const attempts = await OnlineExamAttempt.find({ student: req.user.studentId })
    .populate("exam", "title scheduledAt")
    .sort({ submittedAt: -1 })
    .lean();

  return res.json(
    attempts.map((attempt) => ({
      id: attempt._id,
      examId: attempt.exam?._id,
      examTitle: attempt.exam?.title || "-",
      scheduledAt: attempt.exam?.scheduledAt || null,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage:
        Number(attempt.maxScore || 0) > 0
          ? Number(((Number(attempt.score || 0) / Number(attempt.maxScore || 0)) * 100).toFixed(2))
          : 0,
      submittedAt: attempt.submittedAt,
    }))
  );
}

async function getAttemptAnalytics(req, res) {
  const attempt = await OnlineExamAttempt.findOne({
    _id: req.params.attemptId,
    student: req.user.studentId,
  })
    .populate("exam", "title scheduledAt questions negativeMarkPerWrong")
    .lean();

  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  const questionAnalytics = (attempt.questionResults || []).map((result) => {
    const question = attempt.exam?.questions?.[result.questionIndex];
    return {
      questionIndex: result.questionIndex,
      questionText: question?.text || "",
      options: question?.options || [],
      selectedOptionIndex: result.selectedOptionIndex,
      correctOptionIndex: result.correctOptionIndex,
      isCorrect: result.isCorrect,
    };
  });

  return res.json({
    attemptId: attempt._id,
    examId: attempt.exam?._id,
    examTitle: attempt.exam?.title || "-",
    scheduledAt: attempt.exam?.scheduledAt || null,
    submittedAt: attempt.submittedAt,
    score: attempt.score,
    maxScore: attempt.maxScore,
    negativeMarkPerWrong: Number(attempt.exam?.negativeMarkPerWrong ?? 0.25),
    percentage:
      Number(attempt.maxScore || 0) > 0
        ? Number(((Number(attempt.score || 0) / Number(attempt.maxScore || 0)) * 100).toFixed(2))
        : 0,
    questionAnalytics,
  });
}

async function getMyProfile(req, res) {
  const student = await Student.findById(req.user.studentId).select("name email mobile examType photo joinDate");
  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  return res.json(student);
}

async function updateMyProfile(req, res) {
  const updates = {
    name: String(req.body.name || "").trim(),
    mobile: String(req.body.mobile || "").trim(),
    photo: String(req.body.photo || "").trim(),
  };

  if (!updates.name) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (!/^[6-9]\d{9}$/.test(updates.mobile)) {
    return res.status(400).json({ message: "Mobile number must be a valid 10-digit number" });
  }

  const student = await Student.findByIdAndUpdate(req.user.studentId, updates, {
    new: true,
  }).select("name email mobile examType photo joinDate");

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  return res.json(student);
}

async function changeMyPassword(req, res) {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  const student = await Student.findById(req.user.studentId).select("+password mobile");
  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  const hashMatch = student.password ? await student.comparePassword(currentPassword) : false;
  const legacyMobileMatch = (student.mobile || "") === currentPassword;

  if (!hashMatch && !legacyMobileMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  student.password = newPassword;
  await student.save();

  return res.json({ message: "Password updated successfully" });
}

module.exports = {
  seedStudentPortalData,
  getTeachers,
  getTimetable,
  getUpcomingExams,
  getExamForAttempt,
  submitExam,
  getMyAttempts,
  getAttemptAnalytics,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
