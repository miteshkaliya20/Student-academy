const express = require("express");
const { addBatch, getBatches } = require("../controllers/batchController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", adminOnly, addBatch);
router.get("/", getBatches);

module.exports = router;
