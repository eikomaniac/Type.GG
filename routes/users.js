const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Stats = require("../models/Stats");
const Replay = require("../models/Replay");

// TODO: add pagination
// Get all users' stats
// router.get("/", async (req, res) => {
//   try {
//     // const users = await User.find({}, "username");
//     // const users = await Stats.find();
//     const
//     res.status(200).json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(400).json({ message: err });
//   }
// });

// TODO: make SAFE (don't show password etc.)
// Get specific user's stats
router.get("/:username", async (req, res) => {
  try {
    const replays = await Replay.find({ username: req.params.username }).select(
      "-replayData"
    );
    if (!replays) {
      res.status(404).json({ message: "Not Found" });
    } else {
      res.status(200).json(replays);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

// TODO
// Update user information

// TODO
// Delete user from collection

module.exports = router;
