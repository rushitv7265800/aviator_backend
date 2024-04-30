const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const app = express();
const http = require("http");
const server = http.createServer(app);
var usersRouter = require("./routes/users");
global.io = require("socket.io")(server);
global.lastHistoryG = [];
const { createAviatorAdminCoin, createLastHistory } = require("./service");

app.use("/user", usersRouter);
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(path.join(__dirname, "storage")));
require("./socket");

createAviatorAdminCoin();
createLastHistory();

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
