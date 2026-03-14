const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

function signToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function seedDefaultUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create([
      { username: "admin", password: "admin123", role: "Admin", name: "Academy Admin" },
      { username: "staff", password: "staff123", role: "Staff", name: "Academy Staff" },
    ]);
  }

  const demoStudent = await Student.findOne({ email: "student@example.com" });
  if (!demoStudent) {
    await Student.create({
      name: "Demo Student",
      email: "student@example.com",
      mobile: "9876543210",
      password: "9876543210",
      examType: "GPSC",
    });
  } else if (!demoStudent.password) {
    demoStudent.password = demoStudent.mobile || "9876543210";
    await demoStudent.save();
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username: String(username || "").toLowerCase() });

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isValid = await user.comparePassword(password || "");
  if (!isValid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = signToken({
    userId: user._id,
    username: user.username,
    role: user.role,
    name: user.name,
  });
  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
      name: user.name,
    },
  });
}

async function studentLogin(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  const student = await Student.findOne({ email }).select("+password");
  if (!student) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const hashMatch = student.password ? await student.comparePassword(password) : false;
  const legacyMobileMatch = (student.mobile || "") === password;

  if (!hashMatch && !legacyMobileMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({
    studentId: student._id,
    role: "Student",
    name: student.name,
    email: student.email,
  });

  return res.json({
    token,
    user: {
      id: student._id,
      role: "Student",
      name: student.name,
      email: student.email,
    },
  });
}

module.exports = { login, studentLogin, seedDefaultUsers };
