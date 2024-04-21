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
} = require("./service");

let time = -12;
global.totalBetG = 0;
global.userBetTotalG = [];
global.highOrLowWinResultG = [];
global.lowCountArrayG = [
  1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1, 1,
];
global.totalWinnerCoinG = 0;
global.adminStartingCoin = { add: false, coin: 0 };
global.timeForUpdateG = 10;
global.date0Now = null;
global.YCrash = 1.56;
global.forAllUserHistoryArrayG = [];

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
          AutoCollectCoin: 1.1,
          AutoCollect: false,
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
        console.log("userBetTotalG", userBetTotalG);
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
      if (!adminStartingCoin.add) {
        const adminCoin = await AviatorAdminCoin.findOne();
        adminStartingCoin.add = true;
        adminStartingCoin.coin = adminCoin;
        adminCoin.coin += data.diamond;
        await adminCoin.save();
      } else {
        await AviatorAdminCoin.updateOne({}, { $inc: { coin: data.diamond } });
      }
    } else {
      socket.emit("user", user); // @ todo not enough coin
    }
  });

  socket.on("cancelBet", async (data) => {
    console.log("cancelBet ======", data, globalRoom);

    const resultUser = await cancelUserBets(data.diamond, data?.userId);

    socket.emit("user", resultUser);

    if (!adminStartingCoin.add) {
      const adminCoin = await AviatorAdminCoin.findOne();
      adminStartingCoin.add = true;
      adminStartingCoin.coin = adminCoin;
      adminCoin.coin += data.diamond;
      await adminCoin.save();
    } else {
      await AviatorAdminCoin.updateOne({}, { $inc: { coin: data.diamond } });
    }
  });

  socket.on("cashOut", async (obj) => {
    console.log("cashOut ", obj, " globalRoom : ", globalRoom);
    console.log("userBetTotalG", userBetTotalG);
    const index = userBetTotalG.findIndex((element) => {
      if (element?.userId == obj?.userId) return true;
      return false;
    });
    if (index != -1) {
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

  socket.on("autoCollect", async (obj) => {
    console.log("autoCollect", obj);
    await AviatorUser.updateOne(
      {
        userId: globalRoom,
      },
      {
        AutoCollectCoin: obj.AutoCollectCoin,
        AutoCollect: obj.AutoCollect,
      }
    );
  });

  socket.on("getMyBet", async (data) => {
    console.log("getMyBet: ", data);

    getMyBetHistoryG = await getMyBetHistory(data.userId);
    socket.emit("getMyBet", getMyBetHistoryG);
  });
});

let timeO = (YCrash - 1).toFixed(2);
timeO = timeO * 8;
timeO += 2;
console.log("timeTo0", timeO);
if (timeO < 2) {
  timeO = 2;
}

const updateTime = async () => {
  console.log("time", time);
  io.emit("time", time);
  time++;
  if (time == -3) {
    io.emit("YCrash", YCrash);
  }

  if (time == 0) {
    date0Now = Date.now() + 100;
    console.log(date0Now);
  }
  if (time == parseInt(timeO)) {
    forAllUserHistoryArrayG = userBetTotalG;
    addGameHistory();
    allUserHistory();
    time = -13;
    userBetTotalG = [];
    date0Now = null;
    totalBetG = 0;
    
  }
};
