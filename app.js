require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 8001;
const BOT_ID = process.env.BOT_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
app.use(cors());
app.get("/", (req, res) => {
  return res.status(200).send("Works");
});

app.listen(port, () => {
  console.log(`listening on localhost port ${port}`);
});

const timerID = setInterval(() => {
  const district_id = 725;
  let date = new Date();
  date = date.toISOString().slice(0, 10).split("-").reverse().join("-");
  let records = [];
  axios
    .get(
      `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`,
      {
        headers: {
          Host: "cdn-api.co-vin.in",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        },
      }
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
        messages.map((message) => {
          axios
            .get(
              `https://api.telegram.org/bot${BOT_ID}/sendMessage?chat_id=${CHANNEL_ID}&text=${message}`
            )
            .then((response) => {
              console.log("Message Sent");
            })
            .catch((err) => console.log(err));
        });
      } else {
        console.log("No Available Slots");
      }
    })
    .catch((err) => {
      console.log(err);
      clearInterval(timerID);
    });
}, 20 * 1000);
