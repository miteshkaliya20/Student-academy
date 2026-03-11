const Course = require("../models/Course");

async function addCourse(req, res) {
  const course = await Course.create(req.body);
  return res.status(201).json(course);
}

async function getCourses(req, res) {
  const courses = await Course.find().sort({ createdAt: -1 });
  return res.json(courses);
}

module.exports = { addCourse, getCourses };
