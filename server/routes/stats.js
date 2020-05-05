const express = require("express");
const router = express.Router();
const Stats = require("../models/Stats");

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
    const stats = await Stats.findById(req.params.username);
    if (!stats) {
      res.status(404).json({ message: "Not Found" });
    } else {
      res.status(200).json(stats);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

module.exports = router;
