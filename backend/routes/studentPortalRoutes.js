const express = require("express");
const {
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
} = require("../controllers/studentPortalController");

const router = express.Router();

router.get("/teachers", getTeachers);
router.get("/timetable", getTimetable);
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.patch("/change-password", changeMyPassword);
router.get("/upcoming-exams", getUpcomingExams);
router.get("/upcoming-exams/:examId", getExamForAttempt);
router.post("/upcoming-exams/:examId/submit", submitExam);
router.get("/my-attempts", getMyAttempts);
router.get("/my-attempts/:attemptId", getAttemptAnalytics);

module.exports = router;
