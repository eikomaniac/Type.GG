const mongoose = require("mongoose");

const StatsSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    required: true,
    default: 0,
  },
  races: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("stats", StatsSchema);
