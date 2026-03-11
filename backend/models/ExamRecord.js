const mongoose = require("mongoose");

const examRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    testName: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    score: { type: Number, default: 0 },
    attendance: { type: String, enum: ["Present", "Absent"], default: "Present" },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamRecord", examRecordSchema);
