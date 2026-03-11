const express = require("express");
const { addFeePayment, getFeePayments } = require("../controllers/feeController");

const router = express.Router();

router.post("/", addFeePayment);
router.get("/", getFeePayments);

module.exports = router;
