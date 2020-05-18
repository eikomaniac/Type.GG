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

  let textArray = text.split(" ").map(x => x + " ");
  textArray[textArray.length-1] = textArray[textArray.length-1].substring(0, textArray[textArray.length-1].length-1);

  let totalErrors = 0;
  let correctCharsTyped = 0;
  let wordTyped = true;
  let errorCorrected = true;

  for (var i = 0; i < req.body.replayData.length; i++) {
    let input = req.body.replayData[i].input;
    
    // input & time data validation
    if (wordTyped) {
      if (req.body.replayData[i].time < 0) {
        error = "Corrupt time in replay";
        break;
      }
      if (input.length !== 1) {
        error = "Corrupt replay data - 1";
        break;
      }
    } else {
      if (i > 0) {
        if (req.body.replayData[i-1].time > req.body.replayData[i].time) {
          error = "Corrupt time in replay";
          break;
        }
        if (input.length - req.body.replayData[i-1].input.length > 1) {
          error = "Corrupt replay data - 2";
          break;
        }
      }
    }

    if (input === textArray[0]) {
      textArray.shift();
      correctCharsTyped += 1;
      wordTyped = true;
      if (textArray.length === 0 && i !== req.body.replayData.length-1) {
        error = "Corrupt replay data - 3";
        break;
      }
    } else if (input === textArray[0].substring(0, input.length)) {
        if (wordTyped || (i > 0 && input.length > req.body.replayData[i-1].input.length)) {
          wordTyped = false;
          correctCharsTyped += 1;
          errorCorrected = true;
        }
    } else if (errorCorrected) {
      wordTyped = false;
      totalErrors += 1;
      errorCorrected = false;
    }
  }
  
  let calculatedWPM =
    text.length /
    5 /
    (req.body.replayData[req.body.replayData.length - 1].time / 1000 / 60);
  let calculatedAccuracy =
    (correctCharsTyped / (correctCharsTyped + totalErrors)) * 100;
  
  if (calculatedWPM > 450) {
    error = "Cheated score";
  }

  if (error.length > 0) {
    res.status(400).json(error);
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
});

// TODO
// Update replay information
// ? necessary?

// TODO
// Delete replay

module.exports = router;
