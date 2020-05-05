const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
// const path = require('path');

const PORT = process.env.PORT || 5000;
// const jwt = require('jsonwebtoken');
// const http = require("http").Server(express);
// const socketio = require("socket.io")(http);
// const User = require('./models/User');

require("dotenv").config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// function auth(req, res, next) {
//   console.log("Log");
//   next();
// }

// Routes
app.use("/users", require("../server/routes/users"));
app.use("/texts", require("../server/routes/texts"));
app.use("/login", require("../server/routes/login"));
app.use("/register", require("../server/routes/register"));
app.use("/confirmation", require("../server/routes/confirmation"));
app.use("/forgot-password", require("../server/routes/forgot-password"));
app.use("/replays", require("../server/routes/replays"));
app.use("/rankings", require("../server/routes/rankings"));
app.use("/stats", require("../server/routes/stats"));

// //grabbing user info -- DELETE LATER
// app.get('/user', (req, res) => {
//   let token = req.headers.token; //token
//   jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
//     if (err) return res.status(401).json({
//       title: 'unauthorized'
//     })
//     //token is valid
//     User.findOne({ username: decoded.username }, (err, user) => {
//       if (err) return console.log(err)
//       return res.status(200).json({
//         title: 'user grabbed',
//         user: {
//           username: user.username
//         }
//       })
//     })
//   })
// })

// Connect to DB
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to DB!")
);

app.listen(PORT, console.log(`Server started on port ${PORT}`));
