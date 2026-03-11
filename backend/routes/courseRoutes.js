const express = require("express");
const { addCourse, getCourses } = require("../controllers/courseController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", adminOnly, addCourse);
router.get("/", getCourses);

module.exports = router;
