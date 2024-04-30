const User = require("./models/user");
const AviatorUser = require("./models/aviatorUser");
const AviatorAdminCoin = require("./models/aviatorAdminCoin");

const {
  addUserBets,
  cancelUserBets,
  cashOutUpdateUser,
  addGameHistory,
  allUserHistory,
  getMyBetHistory,
  winLogic,
  addFakeRandom,
  generateUserWinArray,
  generateFakeWinArray,
} = require("./service");

let time = -12;
global.totalBetG = 0;
global.userBetTotalG = [];
global.filteredRealUserG = [];
global.totalWinnerCoinG = 0;
global.timeForUpdateG = 10;
global.date0Now = null;
global.YCrash = 1.02;
global.percentageUserWinExist = [];
global.percentageFakeWinExist = [];

generateUserWinArray();
generateFakeWinArray();
let timeO;

//Game Loop For Timer
setInterval(() => {
  updateTime();
}, 1000);

io.on("connect", async (socket) => {
  console.log("Connection done === ");
  console.log("socket.id : ", socket.id);
  const { globalRoom } = socket.handshake.query;
  console.log("globalRoom connected: ", globalRoom);

  let [user, getMyBetHistoryG] = await Promise.all([
    User.findById(globalRoom),
    getMyBetHistory(globalRoom),
  ]);

  socket.join(globalRoom);

  socket.on("startGame", async (obj) => {
    console.log("------------start game listen---------------", obj);
    if (user) {
      console.log("------------user in game start-----", user?.diamond);
      console.log("------------lastHistoryG-----", lastHistoryG);

      socket.emit("start", user);

      let aviatorUser = await AviatorUser.findOne({
        userId: user?._id,
      });

      if (!aviatorUser) {
        aviatorUser = await AviatorUser({
          userId: user?._id,
          AutoCashOutCoin: 1.1,
          AutoCashOut: false,
        }).save();
      }

      setTimeout(() => {
        if (time >= 0) {
          console.log("refresh");
          socket.emit("refresh", true);
          socket.emit("date0Now", date0Now);
        } else {
          socket.emit("refresh", false);
        }

        socket.emit("getAllBet", userBetTotalG);
        socket.emit("lastHistory", lastHistoryG);
        socket.emit("YCrash", YCrash);
        socket.emit("aviatorUser", aviatorUser);
      }, 100);
    } else {
      socket.emit("start", null);
    }
  });

  socket.on("addBet", async (data) => {
    console.log("bet ======", data, globalRoom);
    const user = await User.findById(data.userId);
    if (user.diamond >= data.diamond) {
      console.log("bet ====== Inner ", data);

      addUserBets(data.diamond, data?.userId, user?.image, user?.name);
      user.diamond -= data.diamond;
      await user.save();
      socket.emit("user", user);

    } else {
      console.log("coinLess ======");
      socket.emit("user", user); // @ todo not enough coin
      socket.emit("coinLess", true); // @ todo not enough coin
    }
  });

  socket.on("cancelBet", async (data) => {
    console.log("cancelBet ======", data, globalRoom);

    const resultUser = await cancelUserBets(data.diamond, data?.userId);

    socket.emit("user", resultUser);
  });

  socket.on("cashOut", async (obj) => {
    console.log("cashOut ====", obj);
    const index = userBetTotalG.findIndex((element) => {
      if (element?.userId == obj?.userId) return true;
      return false;
    });
    if (index != -1) {
      console.log("cashOut Exist====");
      const finalUser = await cashOutUpdateUser(
        obj?.userId,
        index,
        obj?.collectPercent
      );
      socket.emit("start", finalUser);
      getMyBetHistoryG.unshift({
        userId: userBetTotalG[index].userId,
        Bet: userBetTotalG[index].Bet,
        win: userBetTotalG[index].win,
        xPercent: userBetTotalG[index].xPercent,
        history: userBetTotalG[index].history,
        date: userBetTotalG[index].date,
      });
      console.log("getMyBetHistoryG: ", getMyBetHistoryG);
      socket.emit("getMyBet", getMyBetHistoryG);
    }
  });

  socket.on("autoCashOut", async (obj) => {
    console.log("autoCashOut", obj);
    await AviatorUser.updateOne(
      {
        userId: obj.userId,
      },
      {
        AutoCashOutCoin: obj.AutoCashOutCoin,
        AutoCashOut: obj.AutoCashOut,
        AutoBet: obj.AutoBet,
      }
    );
  });

  socket.on("getMyBet", async (data) => {
    console.log("getMyBet: ", data);

    getMyBetHistoryG = await getMyBetHistory(data.userId);
    socket.emit("getMyBet", getMyBetHistoryG);
  });
});

const updateTime = async () => {
  console.log("time", time);
  io.emit("time", time);
  time++;
  if (time == -2) {
    YCrash = await winLogic();

    console.log("result ====================================", YCrash);
    io.emit("YCrash", YCrash);
    timeO = (YCrash - 1).toFixed(2);
    timeO = timeO * 8;
    timeO += 2;
    console.log("timeTo0", timeO);
    if (timeO < 2) {
      timeO = 2;
    }
  }
  if (time == -7) {
    userBetTotalG = [];
    io.emit("getAllBet", userBetTotalG);
  }
  if (time == -6) {
    addFakeRandom();
  }
  if (time == 0) {
    date0Now = Date.now() + 300;
    console.log(date0Now);
  }
  if (time == parseInt(timeO)) {
    addGameHistory();
    allUserHistory();
    time = -13;
    date0Now = null;
    totalBetG = 0;
    totalWinnerCoinG = 0;
  }
};
