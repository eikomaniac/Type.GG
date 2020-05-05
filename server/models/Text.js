const mongoose = require("mongoose");
const shortid = require("shortid");
const ReplaySchema = require("./Replay").schema;

const TextSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  text: {
    type: String,
    required: true,
  },
  maxWPM: {
    type: Number,
    required: true,
    default: 0,
  },
  leaderboard: {
    type: [Object],
    required: true,
    default: [],
  },
  submittedBy: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("text", TextSchema);
