const Batch = require("../models/Batch");

async function addBatch(req, res) {
  const batch = await Batch.create(req.body);
  const populated = await Batch.findById(batch._id).populate("course");
  return res.status(201).json(populated);
}

async function getBatches(req, res) {
  const batches = await Batch.find().populate("course").sort({ createdAt: -1 });
  return res.json(batches);
}

module.exports = { addBatch, getBatches };
