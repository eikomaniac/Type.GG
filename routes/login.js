const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv");

const User = require("../models/User");

router.post("/", (req, res) => {
  let error = "";

  // Check required fields
  if (!req.body.username || !req.body.password) {
    error = "Please fill in all fields";
  }

  if (error.length > 0) {
    res.status(400).json({ error });
  } else {
    User.findById(req.body.username).then((existingUser) => {
      if (!existingUser) {
        bcrypt.compare(req.body.password, "Hash anyway xd", (err, isMatch) => {
          if (err) throw err;
          error = "Incorrect sign-in";
          res.status(400).json({ error });
        });
      } else {
        bcrypt.compare(
          req.body.password,
          existingUser.password,
          (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
              error = "Incorrect sign-in";
              res.status(400).json({ error });
            } else {
              // Login successful // 182d = 6 months
              jwt.sign(
                { username: existingUser._id },
                process.env.SECRET_KEY + existingUser.password,
                { expiresIn: "182d" },
                (err, token) => {
                  res.status(200).json({ token });
                }
              );
            }
          }
        );
      }
    });
  }
});

module.exports = router;
