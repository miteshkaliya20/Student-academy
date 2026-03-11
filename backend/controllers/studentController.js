const Student = require("../models/Student");
const Course = require("../models/Course");

async function addStudent(req, res) {
  const payload = req.body;

  if (payload.course) {
    const selectedCourse = await Course.findById(payload.course);
    if (selectedCourse) {
      payload.feesTotal = selectedCourse.fee;
    }
  }

  const student = await Student.create(payload);
  const populated = await Student.findById(student._id).populate("course batch");
  return res.status(201).json(populated);
}

async function getStudents(req, res) {
  const students = await Student.find().populate("course batch").sort({ createdAt: -1 });
  return res.json(students);
}

async function updateStudent(req, res) {
  const payload = req.body;

  if (payload.course) {
    const selectedCourse = await Course.findById(payload.course);
    if (selectedCourse) {
      payload.feesTotal = selectedCourse.fee;
    }
  }

  const student = await Student.findByIdAndUpdate(req.params.id, payload, { new: true }).populate("course batch");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json(student);
}

async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  return res.json({ message: "Student deleted" });
}

module.exports = {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent,
};
