const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
// const Stats = require("../models/Stats");
("use strict");
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function forgotPassword(resetPasswordLink, emailAddress, username) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER, // generated ethereal user
      pass: process.env.GMAIL_PASS, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter
    .sendMail({
      from: '"Type.GG" <type.gg.test@gmail.com>', // sender address
      to: emailAddress, // list of receivers
      subject: "Type.GG Account Recovery", // Subject line
      text: `Hello ${username},
You recently requested to reset your password for Type.GG. Click the link below to reset it.

${resetPasswordLink}

*If you did not request a password reset, you can safely disregard this email.`, // plain text body
      html: `Hello ${username},<br>
You recently requested to reset your password for Type.GG. Click the link below to reset it.<br>
<br>
<a href="${resetPasswordLink}">${resetPasswordLink}</a><br>
<br>
*If you did not request a password reset, you can safely disregard this email.`, // html body
    })
    .catch((err) => console.log(err));
}

router.get("/:token", (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.FORGOT_PASS_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401).json({ verified: false });
      } else {
        res.status(200).json({ verified: true });
      }
    }
  );
});

router.post("/", (req, res) => {
  let error = "";

  User.findOne({ email: req.body.email })
    .then((existingUser) => {
      if (!existingUser) {
        error = "Email is not registered";
      }
      jwt.sign(
        {
          email: req.body.email,
        },
        process.env.FORGOT_PASS_SECRET,
        {
          expiresIn: "15m",
        },
        (err, emailToken) => {
          if (error.length === 0) {
            forgotPassword(
              `https://typegg.me/forgot-password/${emailToken}`,
              req.body.email,
              existingUser._id
            )
              .then(res.status(200).json({ message: "Email sent" }))
              .catch(console.error);
          } else {
            res.status(400).json(error);
          }
        }
      );
    })
    .catch((err) => console.log(err));
});

router.post("/:token", (req, res) => {
  // Validation
  // Check required fields
  if (!req.body.password || !req.body.confirmPassword) {
    res.status(400).json({ error: "Please fill in all fields" });
  }

  // Check password match
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
  }

  if (req.body.password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  jwt.verify(
    req.params.token,
    process.env.FORGOT_PASS_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401).json();
      } else {
        User.findOne({ email: decoded.email })
          .then((existingUser) => {
            existingUser.password = bcrypt.genSalt(10, (err, salt) =>
              bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (err) throw err;
                existingUser.password = hash;
                existingUser
                  .save()
                  .then((user) => {
                    res.status(200).json(user);
                  })
                  .catch((err) => {
                    res.status(500).json(err);
                  });
              })
            );
          })
          .catch((err) => console.log(err));
      }
    }
  );
});

module.exports = router;
