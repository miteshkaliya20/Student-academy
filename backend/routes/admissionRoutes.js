const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  submitAdmission,
  getAdmissions,
  updateAdmissionStatus,
  convertAdmissionToStudent,
} = require("../controllers/admissionController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "admissions");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "file", ext).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase() || "file";
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (file.fieldname === "profilePic") {
      const allowedProfileExtensions = [".jpg", ".jpeg", ".png"];
      if (!allowedProfileExtensions.includes(ext)) {
        return cb(new Error("Profile picture must be JPG, JPEG, or PNG."));
      }
      return cb(null, true);
    }

    if (file.fieldname === "idProof") {
      const allowedIdProofExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      if (!allowedIdProofExtensions.includes(ext)) {
        return cb(new Error("ID proof must be JPG, JPEG, PNG, or PDF."));
      }
      return cb(null, true);
    }

    return cb(new Error("Invalid file field."));
  },
});

router.post(
  "/public",
  (req, res, next) => {
    upload.fields([
      { name: "profilePic", maxCount: 1 },
      { name: "idProof", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "File upload failed." });
      }
      return next();
    });
  },
  submitAdmission
);

router.get("/", protect, adminOnly, getAdmissions);
router.patch("/:id/status", protect, adminOnly, updateAdmissionStatus);
router.post("/:id/convert", protect, adminOnly, convertAdmissionToStudent);

module.exports = router;
