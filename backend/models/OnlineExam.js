const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: { type: [String], required: true, validate: (arr) => Array.isArray(arr) && arr.length === 4 },
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const onlineExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    negativeMarkPerWrong: { type: Number, default: 0.25, min: 0 },
    questions: { type: [questionSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OnlineExam", onlineExamSchema);
