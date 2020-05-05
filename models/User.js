const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
    default: "Standard",
  },
  keyboard: {
    type: String,
    required: true,
    default: "QWERTY",
  },
});

module.exports = mongoose.model("user", UserSchema);
