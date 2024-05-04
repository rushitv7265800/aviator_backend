const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const app = express();
const http = require("http");
const server = http.createServer(app);
global.io = require("socket.io")(server);
global.lastHistoryG = [];
const { createAviatorAdminCoin, createLastHistory } = require("./service");

app.use(express.json());
app.use(cors());
require("./socket");

createAviatorAdminCoin();
createLastHistory();


app.use(express.static(path.join(__dirname, "public")));

app.get("/*", function (req, res) {
  res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
});

mongoose
  .connect(config.DATABASE)
  .then(() => {
    console.log("MONGO: successfully connected to db....");
  })
  .catch((err) => {
    console.log("mongoose connection error : ", err);
    o;
  });

//start the server
server.listen(config.PORT, () => {
  console.log("Magic happens on port: " + config.PORT);
});
