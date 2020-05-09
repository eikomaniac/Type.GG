const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Text = require("../models/Text");
const Stats = require("../models/Stats");
const User = require("../models/User");
const Replay = require("../models/Replay");

// TODO: add pagination
// Get all replays
router.get("/", async (req, res) => {
  try {
    let texts;
    texts = await Text.find({}, "leaderboard");
    ppScores = {};
    wpmScores = {};
    accuracyScores = {};
    // ! MAKE MORE EFFICIENT AT A LATER DATE MAYBE
    for (var i = 0; i < texts.length; i++) {
      for (var j = 0; j < texts[i].leaderboard.length; j++) {
        if (!ppScores[texts[i].leaderboard[j].username]) {
          ppScores[texts[i].leaderboard[j].username] = [];
        }
        ppScores[texts[i].leaderboard[j].username].push(
          texts[i].leaderboard[j].pp
        );
        if (!wpmScores[texts[i].leaderboard[j].username]) {
          wpmScores[texts[i].leaderboard[j].username] = [];
        }
        wpmScores[texts[i].leaderboard[j].username].push(
          texts[i].leaderboard[j].wpm
        );
        if (!accuracyScores[texts[i].leaderboard[j].username]) {
          accuracyScores[texts[i].leaderboard[j].username] = [];
        }
        accuracyScores[texts[i].leaderboard[j].username].push(
          parseFloat(texts[i].leaderboard[j].acc) // ! why?
        );
      }
    }
    console.log(accuracyScores);
    let rankings = [];
    let r = 0.95; // can remove after 200 texts in db
    if (texts.lengths > 200) {
      r = Math.exp(Math.log(1 / 1000) / ((texts.length - 1) * (2 / 3)));
    }
    let usernames = Object.keys(ppScores);
    for (var i = 0; i < usernames.length; i++) {
      ppScores[usernames[i]].sort((a, b) => -1 * (a - b));
      let pp = 0;
      for (var j = 0; j < ppScores[usernames[i]].length; j++) {
        pp += ppScores[usernames[i]][j] * Math.pow(r, j);
      }
      let totalwpm = 0;
      for (var j = 0; j < wpmScores[usernames[i]].length; j++) {
        totalwpm += wpmScores[usernames[i]][j];
      }
      wpmAvg = totalwpm / wpmScores[usernames[i]].length;
      let totalacc = 0;
      for (var j = 0; j < accuracyScores[usernames[i]].length; j++) {
        totalacc += accuracyScores[usernames[i]][j];
      }
      accAvg = totalacc / accuracyScores[usernames[i]].length;
      rankings.push({ username: usernames[i], pp, wpmAvg, accAvg });
    }
    rankings.sort((a, b) => {
      return -1 * (a.pp - b.pp);
    });
    res.status(200).json(rankings);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

module.exports = router;
