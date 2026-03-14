const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    profilePic: { type: String, required: true },
    idProof: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Approved", "Rejected"],
      default: "Pending",
    },
    convertedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);
