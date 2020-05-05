const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();
// const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
// const Stats = require("../models/Stats");
("use strict");
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function confirmation(confirmationLink, emailAddress) {
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
      from: '"Type.GG" <type.gg@gmail.com>', // sender address
      to: emailAddress, // list of receivers
      subject: "New Type.GG Account Email Verification", // Subject line
      text: `Hello,
You're almost done!
Verify your email address to complete creating your Type.GG account.

${confirmationLink}

*If you didn't recently attempt to create a new account with this email address, you can safely disregard this email.`, // plain text body
      html: `Hello,<br>
You're almost done!<br>
Verify your email address to complete creating your Type.GG account.<br>
<br>
<a href="${confirmationLink}">${confirmationLink}</a><br>
<br>
*If you didn't recently attempt to create a new account with this email address, you can safely disregard this email.`, // html body
    })
    .catch((err) => console.log(err));
}

router.post("/", (req, res) => {
  let error = "";

  if (
    req.body.captcha === undefined ||
    req.body.captcha === "" ||
    req.body.captcha === null
  ) {
    error = "Please select captcha";
  }

  if (req.body.email !== req.body.confirmEmail) {
    error = "Emails do not match";
  }

  // Secret key
  const secretKey = "6Lf2QO4UAAAAAOER_mbkw1-NFBMnvPy1ayE0VF0m";

  // Verify URL
  const verifyURL = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

  axios
    .get(verifyURL)
    .then((response) => {
      if (response.data.success !== undefined && !response.data.success) {
        error = "Failed captcha verification";
      }
      User.findOne({ email: req.body.email })
        .then((existingEmail) => {
          if (existingEmail) {
            error = "Email is already registered";
          }
          jwt.sign(
            {
              email: req.body.email,
            },
            process.env.EMAIL_SECRET,
            {
              expiresIn: "1d",
            },
            (err, emailToken) => {
              if (error.length === 0) {
                confirmation(
                  `http://localhost:8080/confirmation/${emailToken}`,
                  req.body.email
                )
                  .then(res.json({ success: true, message: "Email sent" }))
                  .catch(console.error);
              } else {
                res.json({ success: false, error });
              }
            }
          );
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
});

module.exports = router;
