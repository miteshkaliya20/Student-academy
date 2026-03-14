const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    examType: { type: String, default: "GPSC" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    photo: { type: String, default: "" },
    password: { type: String, default: "", select: false },
    feesTotal: { type: Number, default: 0 },
    feesPaid: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentSchema.pre("save", async function save(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

studentSchema.methods.comparePassword = function comparePassword(rawPassword) {
  if (!this.password) {
    return Promise.resolve(false);
  }

  return bcrypt.compare(rawPassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
