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
    let leaderboard = {};

    let texts = await Text.find({}, "_id");
    
    let r = 0.95; // can remove after 200 texts in db
    if (texts.lengths > 200) {
      r = Math.exp(Math.log(1 / 1000) / ((texts.length - 1) * (2 / 3)));
    }

    for (var i = 0; i < texts.length; i++) {
      let replays = await Replay.aggregate(
        [
          {
            $match: { textId: texts[i]._id }
          },
          {
            $sort: { wpm: -1 }
          },
          {
            $group: {
              _id: "$username",
              wpm: { $first: "$wpm" },
              acc: { $first: "$accuracy" }
            }
          },
          {
            $sort: { wpm: -1 }
          },
        ]
      );
      for (var j = 0; j < replays.length; j++) {
        if (!leaderboard[replays[j]._id]) {
          leaderboard[replays[j]._id] = {
            "pp": [],
            "wpm": [],
            "acc": [],
          }
        }
        if (j === 0) {
          pp = 1000;
        } else {
          let maxWPM = replays[0].wpm;
          pp = 100 * (Math.pow(Math.exp(1),(replays[j].wpm * Math.log(11)) / maxWPM) - 1);
        }
        leaderboard[replays[j]._id].pp.push(pp);
        leaderboard[replays[j]._id].wpm.push(replays[j].wpm);
        leaderboard[replays[j]._id].acc.push(replays[j].acc);
      }
    }
    
    let rankings = [];
    
    let usernames = Object.keys(leaderboard);
    for (i = 0; i < usernames.length; i++) {
      leaderboard[usernames[i]].pp.sort((a, b) => {
        return -1 * (a - b);
      });
      let totalpp = 0;
      let totalwpm = 0;
      let totalacc = 0;
      for (j = 0; j < leaderboard[usernames[i]].pp.length; j++) {
        totalpp += leaderboard[usernames[i]].pp[j]*Math.pow(r, j);
        totalwpm += leaderboard[usernames[i]].wpm[j]
        totalacc += leaderboard[usernames[i]].acc[j]
      }
      leaderboard[usernames[i]].pp = totalpp;
      leaderboard[usernames[i]].wpm = totalwpm / leaderboard[usernames[i]].wpm.length;
      leaderboard[usernames[i]].acc = totalacc / leaderboard[usernames[i]].acc.length;
      leaderboard[usernames[i]].username = usernames[i];
      rankings.push(leaderboard[usernames[i]]);
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

router.get("/:id", async (req, res) => {
  try {
    let replays = await Replay.aggregate(
      [
        {
          $match: { textId: req.params.id }
        },
        {
          $sort: { wpm: -1 }
        },
        {
          $group: {
            _id: "$username",
            wpm: { $first: "$wpm" },
            acc: { $first: "$accuracy" }
          }
        },
        {
          $sort: { wpm: -1 }
        },
      ]
    );
    res.status(200).json(replays);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

module.exports = router;
