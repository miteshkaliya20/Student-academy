const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    examType: { type: String, default: "GPSC" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    photo: { type: String, default: "" },
    feesTotal: { type: Number, default: 0 },
    feesPaid: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
