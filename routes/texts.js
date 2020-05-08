const express = require("express");
const router = express.Router();
const Text = require("../models/Text");
// const Replay = require('../models/Replay');
// const jwt = require('jsonwebtoken');

// TODO: add pagination
// Get all texts
router.get("/", async (req, res) => {
  try {
    const texts = await Text.find();
    res.status(200).json(texts);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

// Get specific text
router.get("/:textId", async (req, res) => {
  try {
    const text = await Text.findById(req.params.textId);
    res.status(200).json(text);
  } catch (err) {
    console.log(err);
    res.status(404).json({ err });
  }
});

// TODO: add authorisation
// ? Necessary to add validation?
// Create new text
router.post("/", async (req, res) => {
  let errors = [];
  
  const newText = new Text({
    text: req.body.text,
    // pp: calculatedPP,
  });

  if (req.body.submittedBy) {
    newText.submittedBy = req.body.submittedBy;
  }

  newText
    .save()
    .then((text) => {
      res.status(201).json(text);
    })
    .catch((err) => {
      res.status(500).json({ err });
    });
});

// TODO: router.PUT

// TODO: router.DELETE

// router.post('/:textId', (req, res) => {
// let token = req.body.token; //token
// jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
//     if (err) {
//         console.log(err);
//         return res.status(401).json({
//             title: 'unauthorized'
//         })
//     }
//token is valid
//     Text.findById(req.params.textId, (err, text) => {
//         if (err) return console.log(err)
//         const newReplay = new Replay({
//             username: req.body.newReplay.username,
//             text: req.body.newReplay.text,
//             wpm: req.body.newReplay.wpm,
//             accuracy: req.body.newReplay.accuracy,
//             pp: req.body.newReplay.pp,
//             replayData: req.body.newReplay.replayData
//         });
//         newReplay.save().then(replay => console.log(replay)).catch(err => console.log(err));
//         Replay.findOne({
//             _id: newReplay._id,
//             username: newReplay.username,
//             text: newReplay.text,
//         }, (err, previousReplay) => {
//             if (!previousReplay) {
//                 text.leaderboard.push(newReplay);
//             } else {
//                 text.leaderboard.id(previousReplay._id).remove();
//                 text.leaderboard.push(newReplay);
//             }
//             text.save().catch(err => console.log(err));
//         });
//         return res.status(200).json(); // CLEAR LATER ?
//     })
// });
//   })

module.exports = router;
