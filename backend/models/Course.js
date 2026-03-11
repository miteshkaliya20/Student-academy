const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
