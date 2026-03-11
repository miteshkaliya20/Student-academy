const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function seedDefaultUsers() {
  const count = await User.countDocuments();
  if (count > 0) {
    return;
  }

  await User.create([
    { username: "admin", password: "admin123", role: "Admin", name: "Academy Admin" },
    { username: "staff", password: "staff123", role: "Staff", name: "Academy Staff" },
  ]);
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

  const token = signToken(user);
  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
      name: user.name,
    },
  });
}

module.exports = { login, seedDefaultUsers };
