const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, default: -1 },
    correctOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const onlineExamAttemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "OnlineExam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    answers: { type: [Number], default: [] },
    questionResults: { type: [questionResultSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

onlineExamAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("OnlineExamAttempt", onlineExamAttemptSchema);
