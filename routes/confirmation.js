const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Stats = require("../models/Stats");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

require("dotenv");

router.get("/:token", (req, res) => {
  jwt.verify(req.params.token, process.env.EMAIL_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ verified: false });
    } else {
      res.status(200).json({ verified: true });
    }
  });
});

// Create new user
router.post("/", (req, res) => {
  // Validation
  // Check required fields
  if (
    !req.body.username ||
    !req.body.emailToken ||
    !req.body.password ||
    !req.body.confirmPassword
  ) {
    res.status(400).json({ error: "Please fill in all fields" });
  }

  // Check username validity
  let usernamePattern = new RegExp("^[0-9A-Za-z]+$");
  if (!usernamePattern.test(req.body.username)) {
    res.status(400).json({ error: "Please fill in all fields" });
  }
  // Check password match
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
  }

  if (req.body.password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  let decodedEmail = "";

  // Check username taken
  User.findById(req.body.username).then((existingUser) => {
    if (existingUser) {
      res.status(400).json({ error: "Username is already taken" });
    }
  });

  // Check email taken
  jwt.verify(req.body.emailToken, process.env.EMAIL_SECRET, (err, decoded) => {
    User.findOne({ email: decoded.email }).then((existingEmail) => {
      if (existingEmail) {
        res.status(400).json({ error: "You are already registered!" });
      }
    });
    decodedEmail = decoded.email;
  });

  // If no errors, make new user and return user json.
  const newStats = new Stats({
    _id: req.body.username,
  });
  newStats
    .save()
    .then(() => {
      const newUser = new User({
        _id: req.body.username,
        ip: req.ip,
        email: decodedEmail,
        password: bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                res.status(201).json(user);
              })
              .catch((err) => {
                res.status(500).json(err);
              });
          })
        ),
      });
    })
    .catch((err) => console.log(err));
});

module.exports = router;
