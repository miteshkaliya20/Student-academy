const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    amount: { type: Number, required: true },
    paidOn: { type: Date, required: true },
    month: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeePayment", feePaymentSchema);
