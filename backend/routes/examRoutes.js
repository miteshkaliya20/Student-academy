const express = require("express");
const { addExamRecord, getExamRecords } = require("../controllers/examController");

const router = express.Router();

router.post("/", addExamRecord);
router.get("/", getExamRecords);

module.exports = router;
