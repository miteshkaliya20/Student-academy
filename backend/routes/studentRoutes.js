const express = require("express");
const {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", adminOnly, addStudent);
router.get("/", getStudents);
router.put("/:id", adminOnly, updateStudent);
router.delete("/:id", adminOnly, deleteStudent);

module.exports = router;
