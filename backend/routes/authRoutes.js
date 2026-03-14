const express = require("express");
const { login, studentLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/student-login", studentLogin);

module.exports = router;
