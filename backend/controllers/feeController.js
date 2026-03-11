const FeePayment = require("../models/FeePayment");
const Student = require("../models/Student");

async function addFeePayment(req, res) {
  const payload = req.body;
  const payment = await FeePayment.create(payload);

  await Student.findByIdAndUpdate(payload.student, { $inc: { feesPaid: Number(payload.amount || 0) } });

  const populated = await FeePayment.findById(payment._id).populate("student course");
  return res.status(201).json(populated);
}

async function getFeePayments(req, res) {
  const payments = await FeePayment.find().populate("student course").sort({ paidOn: -1, createdAt: -1 });
  return res.json(payments);
}

module.exports = { addFeePayment, getFeePayments };
