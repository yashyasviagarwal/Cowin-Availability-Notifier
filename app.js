require("dotenv").config();
const express = require("express");
const axios = require("axios");
const client = require("twilio")();
const app = express();
console.log("Server Started");

app.get("/", (req, res) => {
  return res.status(200).send("Works");
});

const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`listening on localhost port ${port}`);
});

const timerID = setInterval(() => {
  const district_id = 730;
  let date = new Date();
  if (date < new Date(2021, 4, 26)) {
    date = new Date(2021, 4, 26);
  }
  date = date.toISOString().slice(0, 10).split("-").reverse().join("-");
  let records = [];
  axios
    .get(
      `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`
    )
    .then((response) => {
      response.data.centers.map((center) => {
        center.sessions.map((session) => {
          if (session.available_capacity >= 0) {
            records.push("Center: " + center.name);
            records.push("Date: " + session.date);
            records.push("Available Seats: " + session.available_capacity);
            records.push("Min_Age: " + session.min_age_limit);
            records.push("");
          }
        });
      });
      if (records.length > 0) {
        records = records.join("\n");
        const messages = records.match(/(.|[\r\n]){1,1600}/g);
        const numbers = ["+918335022832", "+918334825245"];
        numbers.map((number) => {
          messages.map((message) => {
            client.messages
              .create({
                from: "whatsapp:+14155238886",
                body: message,
                to: `whatsapp:${number}`,
              })
              .then((message) => console.log("Message Sent: " + message.sid))
              .catch((err) => {
                console.log(err);
                clearInterval(timerID);
              });
          });
        });
      } else {
        console.log("No Available Slots");
      }
    })
    .catch((err) => {
      console.log(err);
      clearInterval(timerID);
    });
}, 60 * 1000);
