"use strict";

require("dotenv").config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const morgan = require("morgan");
const superagent = require("superagent");
var nodemailer = require("nodemailer");

console.log(process.env.SHEET_ID);
console.log(process.env.MAIL);

`https://any:627561950e7fec543e10fe91ffa5e0b6-us20@us20.api.mailchimp.com/3.0/lists/e7d3644021/members`;

const app = express();

app.use(cors());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);
// middleware to use for all requests
router.use(function(req, res, next) {
  // do logging
  console.log("Something is happening.");
  next(); // make sure we go to the next routes and don't stop here
});


function testWrite () {
  superagent.post(`https://sheets.googleapis.com/v4/spreadsheets/spreadsheetId/values:batchUpdate`)
 .send({
  "valueInputOption": "USER_ENTERED",
  "data": [
    {
      "range": "Sheet1!A1:A4",
      "majorDimension": "COLUMNS",
      "values": [
        ["Item", "Wheel", "Door", "Engine"]
      ]
    },
    {
      "range": "Sheet1!B1:D2",
      "majorDimension": "ROWS",
      "values": [
        ["Cost", "Stocked", "Ship Date"],
        ["$20.50", "4", "3/1/2016"]
      ]
    }
  ]
})
.then(results=>{
  console.log('check you spead sheet', results)
})
.catch(err =>{
  console.error(err);
})
}

testWrite();



router.post("/sheets", (req, res, next)=>{
  let url = `https://script.google.com/macros/s/AKfycbyNLPGNDB-bO5kxpYf3CnsYQLCHANjhVVRn_AsnX0YO-MZ9n-k/exec`;

  superagent.post(url)
  .send(req.body)
  .then(results =>{
    console.log('results', results)
  })
  .catch(err => console.error(err));
  
})

const root = `https://us20.api.mailchimp.com/3.0/lists/`;
const mailchimpApiKey = process.env.MAIL;
console.log(mailchimpApiKey);
const listUniqueId = `e7d3644021`;

router.get("/", (req, res, next) => {
  console.log("home route");
  res.status(200).send("ok");
});

router.get("/list", getAllSubscribers);
function getAllSubscribers (req, res, next) {
  superagent
    .get(
      `https://any:${mailchimpApiKey}@us20.api.mailchimp.com/3.0/lists/e7d3644021/members`
    )
    .end((err, result) => {
      if (err) {
        res.status(500).json(err);
      } else {
        res.json(result.body.lists);
        console.log("the lists", result.body);
      }
    });
};

router.post("/sub", postNewSubscriber);
function postNewSubscriber (req, res, next){
  //check that the user was able to answer the questions
  if (req.body.message === "white") {
    superagent
      .post(
        `https://any:${mailchimpApiKey}@us20.api.mailchimp.com/3.0/lists/e7d3644021/members`
      )
      .set("Content-Type", "application/json;charset=utf-8")
      // .set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
      .send({
        email_address: req.body.email,
        status: "subscribed",
        merge_fields: {
          FNAME: req.body.fName,
          LNAME: req.body.lName,
          ZIP: req.body.zip,
          message: req.body.message
        }
      })
      .end(function(err, response) {
        console.log("response", err, response);
        if (
          response.status < 300 ||
          (response.status === 400 && response.body.title === "Member Exists")
        ) {
          res.send("Signed Up!");
        } else {
          res.send("Sign Up Failed :(");
        }
      });
  }
};



router.post("/sightings", postNewSighting);

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hannah.c.ingham@gmail.com",
    pass: process.env.PASSWORD
  }
});

function postNewSighting (req, res, next) {
  var name = req.body.name;
  var from = req.body.from;
  var message = req.body.message;
  var to = "hannah.c.ingham@gmail.com";

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: "user@example.com",
      serviceClient: "113600000000000000000",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...",
      accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
      expires: 1484314697598
    }
  });

  var mailOptions = {
    from: from,
    to: to,
    subject: name + " | new message !",
    text: message
  };

  transporter.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.log(error);
    } else {
      res.redirect("/");
    }
  });
};

let isRunning = false;

module.exports = {
  server: app,
  start: port => {
    if (!isRunning) {
      app.listen(port, () => {
        isRunning = true;
        console.log(`Server Up on ${port}`);
      });
    } else {
      console.log("Server is already running");
    }
  }
};
