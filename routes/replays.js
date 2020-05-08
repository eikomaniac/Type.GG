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
    let replays;
    if (!req.query.q) {
      replays = await Replay.find().select("-replayData");
    } else {
      replays = await Replay.find(
        JSON.parse(req.query.q),
        "_id username wpm accuracy date replayData"
      ).sort("-wpm");
    }
    res.status(200).json(replays);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

// TODO: make SAFE (don't show password etc.)
// Get specific replay
router.get("/:id", async (req, res) => {
  try {
    const replay = await Replay.findById(req.params.id);
    if (!replay) {
      res.status(404).json({ message: "Not Found" });
    } else {
      res.status(200).json(replay);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

// TODO: add authentication & validation
// Create new replay
router.post("/", async (req, res) => {
  let user = await User.findById(req.body.username);
  if (!user) {
    res.status(401).json({
      message: "Unauthorised",
    });
  }
  let username = "";
  jwt.verify(
    req.headers.authorization.substring(7, req.headers.authorization.length),
    process.env.SECRET_KEY + user.password,
    (err, decoded) => {
      username = decoded.username;
      if (err) {
        console.log(err);
        return res.status(401).json({
          message: "Unauthorised",
        });
      }
    }
  );

  let error = "";

  // Get correct text data
  let text = "";

  try {
    let textObject = await Text.findById(req.body.textId);
    if (!textObject) {
      error = "Invalid Text ID";
    } else {
      text = textObject.text;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }

  // Verify & validate replay data
  let userInput = "";
  let lastSpaceIndex = 0;
  let errorCorrected = true;
  let totalErrors = 0;
  let highlighted = false;
  let correctCharsTyped = 0;
  for (var i = 0; i < req.body.replayData.length; i++) {
    let char = req.body.replayData[i].key;
    if (highlighted) {
      if (char.length === 1) {
        userInput = userInput.substring(0, lastSpaceIndex);
        userInput += char;
        highlighted = false;
      } else if (char === "Backspace") {
        userInput = userInput.substring(0, lastSpaceIndex);
        highlighted = false;
      } else if (char === "Unhighlight") {
        highlighted = false;
      }
    } else {
      if (char.length === 1) {
        userInput += char;

        // If input is correct
        if (text.substring(0, userInput.length) === userInput) {
          correctCharsTyped += 1;
          if (char === " ") {
            lastSpaceIndex = userInput.length;
          }
        } else if (errorCorrected) {
          totalErrors += 1;
          errorCorrected = false;
        }
      } else {
        if (char === "CtrlBackspace") {
          userInput = userInput.substring(0, lastSpaceIndex);
        } else if (char === "Backspace") {
          userInput = userInput.substring(0, userInput.length - 1);
        } else if (char === "Highlight") {
          highlighted = true;
        } else if (char === "Unhighlight") {
          highlighted = false;
        } else {
          error = "Corrupt keys in replay";
        }
      }
    }
    if (
      (i > 0 &&
        req.body.replayData[i].time < req.body.replayData[i - 1].time) ||
      req.body.replayData[i].time < 0
    ) {
      error = "Corrupt time in replay";
    }
    if (error.length > 0) {
      break;
    }
    if (text.substring(0, userInput.length) === userInput) {
      errorCorrected = true;
    }
  }
  if (userInput !== text) {
    error = `Corrupt replay: ${userInput}`;
  }
  let calculatedWPM =
    text.length /
    5 /
    (req.body.replayData[req.body.replayData.length - 1].time / 1000 / 60);
  let calculatedAccuracy =
    (correctCharsTyped / (correctCharsTyped + totalErrors)) * 100;

  let existingPB = await Replay.findOne(
    { textId: req.body.textId, username: username, isPB: true },
    "wpm"
  )
    .sort("-wpm")
    .catch((err) => console.log(err));

  let isPB = true;

  if (error.length > 0) {
    res.status(400).json({ error });
  } else {
    if (existingPB) {
      isPB = calculatedWPM > existingPB.wpm;
      if (isPB) {
        existingPB.isPB = false;
        existingPB.save();
        let textDoc = await Text.findById(req.body.textId);
        let pp =
          100 *
          (Math.pow(
            Math.exp(1),
            (calculatedWPM * Math.log(11)) / textDoc.maxWPM
          ) -
            1);

        if (calculatedWPM > textDoc.maxWPM) {
          pp = 1000;
          textDoc.maxWPM = calculatedWPM;
          let i;
          for (i = 0; i < textDoc.leaderboard.length; i++) {
            let userWPM = textDoc.leaderboard[i].wpm;
            if (textDoc.leaderboard[i].username === username) {
              textDoc.leaderboard.set(i, {
                username: username,
                pp: pp,
                wpm: calculatedWPM,
                acc: calculatedAccuracy,
              });
            } else {
              textDoc.leaderboard.set(i, {
                username: textDoc.leaderboard[i].username,
                pp:
                  100 *
                  (Math.pow(
                    Math.exp(1),
                    (userWPM * Math.log(11)) / textDoc.maxWPM
                  ) -
                    1),
                wpm: userWPM,
                acc: textDoc.leaderboard[i].acc,
              });
            }
          }
        }
        textDoc.save();
      }
    } else {
      let textDoc = await Text.findById(req.body.textId);
      let pp =
        100 *
        (Math.pow(
          Math.exp(1),
          (calculatedWPM * Math.log(11)) / textDoc.maxWPM
        ) -
          1);
      if (calculatedWPM > textDoc.maxWPM) {
        // if new WR on quote
        pp = 1000;
        textDoc.maxWPM = calculatedWPM;
        let i;
        for (i = 0; i < textDoc.leaderboard.length; i++) {
          let userWPM = textDoc.leaderboard[i].wpm;
          textDoc.leaderboard.set(i, {
            username: textDoc.leaderboard[i].username,
            pp:
              100 *
              (Math.pow(
                Math.exp(1),
                (userWPM * Math.log(11)) / textDoc.maxWPM
              ) -
                1),
            wpm: userWPM,
            acc: textDoc.leaderboard[i].acc,
          });
        }
      }
      textDoc.leaderboard.push({
        username: username,
        pp: pp,
        wpm: calculatedWPM,
        acc: calculatedAccuracy,
      });
      textDoc.save();
    }

    let stats = await Stats.findOne({ _id: username }).catch((err) =>
      console.log(err)
    );
    stats.xp += text.length;
    stats.races += 1;
    stats.save();

    const newReplay = new Replay({
      textId: req.body.textId,
      text: text,
      username: username,
      isPB: isPB,
      replayData: req.body.replayData,
      wpm: calculatedWPM,
      accuracy: calculatedAccuracy,
    });
    newReplay
      .save()
      .then((replay) => {
        res.status(201).json(replay);
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  }
});

// TODO
// Update replay information
// ? necessary?

// TODO
// Delete replay

module.exports = router;
