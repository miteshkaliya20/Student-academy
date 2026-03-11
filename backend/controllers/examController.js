const ExamRecord = require("../models/ExamRecord");

async function addExamRecord(req, res) {
  const record = await ExamRecord.create(req.body);
  const populated = await ExamRecord.findById(record._id).populate("student");
  return res.status(201).json(populated);
}

async function getExamRecords(req, res) {
  const records = await ExamRecord.find().populate("student").sort({ examDate: -1, createdAt: -1 });
  return res.json(records);
}

module.exports = { addExamRecord, getExamRecords };
