const path = require("path");
const Admission = require("../models/Admission");
const Student = require("../models/Student");

const NAME_REGEX = /^[A-Za-z]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const ALLOWED_STATUSES = ["Pending", "Reviewed", "Approved", "Rejected"];

function validateAdmissionPayload(payload) {
  const errors = {};

  if (!NAME_REGEX.test((payload.firstName || "").trim())) {
    errors.firstName = "First name must be at least 2 letters and contain only alphabets.";
  }

  if (!NAME_REGEX.test((payload.lastName || "").trim())) {
    errors.lastName = "Last name must be at least 2 letters and contain only alphabets.";
  }

  if (!EMAIL_REGEX.test((payload.email || "").trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!PHONE_REGEX.test((payload.phone || "").trim())) {
    errors.phone = "Phone number must be a valid 10-digit mobile number.";
  }

  return errors;
}

async function submitAdmission(req, res) {
  const payload = {
    firstName: (req.body.firstName || "").trim(),
    lastName: (req.body.lastName || "").trim(),
    email: (req.body.email || "").trim(),
    phone: (req.body.phone || "").trim(),
  };

  const validationErrors = validateAdmissionPayload(payload);

  if (!req.files?.profilePic?.[0]) {
    validationErrors.profilePic = "Profile picture is required.";
  }

  if (!req.files?.idProof?.[0]) {
    validationErrors.idProof = "ID proof is required.";
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  const profilePicFile = req.files.profilePic[0];
  const idProofFile = req.files.idProof[0];

  const admission = await Admission.create({
    ...payload,
    profilePic: path.posix.join("uploads", "admissions", profilePicFile.filename),
    idProof: path.posix.join("uploads", "admissions", idProofFile.filename),
  });

  return res.status(201).json({
    message: "Admission form submitted successfully.",
    id: admission._id,
  });
}

async function getAdmissions(_req, res) {
  const admissions = await Admission.find().sort({ createdAt: -1 });
  return res.json(admissions);
}

async function updateAdmissionStatus(req, res) {
  const { status } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Allowed values: Pending, Reviewed, Approved, Rejected.",
    });
  }

  const admission = await Admission.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!admission) {
    return res.status(404).json({ message: "Admission not found" });
  }

  return res.json(admission);
}

async function convertAdmissionToStudent(req, res) {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ message: "Admission not found" });
  }

  if (admission.status !== "Approved") {
    return res.status(400).json({ message: "Only approved admissions can be converted." });
  }

  if (admission.convertedStudent) {
    return res.status(400).json({ message: "Admission is already converted to a student." });
  }

  const student = await Student.create({
    name: `${admission.firstName} ${admission.lastName}`.trim(),
    mobile: admission.phone,
    email: admission.email,
    photo: admission.profilePic,
    password: admission.phone,
    examType: "GPSC",
  });

  admission.convertedStudent = student._id;
  admission.convertedAt = new Date();
  await admission.save();

  return res.status(201).json({
    message: "Admission converted to student successfully.",
    admission,
    student,
  });
}

module.exports = {
  submitAdmission,
  getAdmissions,
  updateAdmissionStatus,
  convertAdmissionToStudent,
};
