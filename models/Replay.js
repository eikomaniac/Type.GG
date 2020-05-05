const mongoose = require("mongoose");
const shortid = require("shortid");

const ReplaySchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  username: {
    type: String,
    required: true,
  },
  isPB: {
    type: Boolean,
    required: true,
  },
  textId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  wpm: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  replayData: {
    type: [Object],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("replay", ReplaySchema);
