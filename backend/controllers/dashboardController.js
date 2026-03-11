const Batch = require("../models/Batch");
const ExamRecord = require("../models/ExamRecord");
const FeePayment = require("../models/FeePayment");
const Student = require("../models/Student");

async function getDashboardStats(req, res) {
  const [totalStudents, activeBatches, monthlyFeesResult] = await Promise.all([
    Student.countDocuments(),
    Batch.countDocuments(),
    FeePayment.aggregate([
      {
        $match: {
          month: new Date().toISOString().slice(0, 7),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const today = new Date();
  const inThirtyDays = new Date();
  inThirtyDays.setDate(today.getDate() + 30);

  const upcomingExams = await ExamRecord.countDocuments({
    examDate: {
      $gte: today,
      $lte: inThirtyDays,
    },
  });

  return res.json({
    totalStudents,
    activeBatches,
    monthlyFees: monthlyFeesResult[0]?.total || 0,
    upcomingExams,
  });
}

module.exports = { getDashboardStats };
