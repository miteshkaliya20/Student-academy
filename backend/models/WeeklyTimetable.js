const mongoose = require("mongoose");

const weeklyTimetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyTimetable", weeklyTimetableSchema);
