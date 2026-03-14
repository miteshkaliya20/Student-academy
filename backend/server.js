const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { protect } = require("./middleware/authMiddleware");
const { seedDefaultUsers } = require("./controllers/authController");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admissions", require("./routes/admissionRoutes"));
app.use("/api/students", protect, require("./routes/studentRoutes"));
app.use("/api/courses", protect, require("./routes/courseRoutes"));
app.use("/api/batches", protect, require("./routes/batchRoutes"));
app.use("/api/fees", protect, require("./routes/feeRoutes"));
app.use("/api/exams", protect, require("./routes/examRoutes"));
app.use("/api/dashboard", protect, require("./routes/dashboardRoutes"));

const PORT = process.env.PORT || 5001;

(async function startServer() {
  await connectDB();
  await seedDefaultUsers();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
