const config = require("./config");
const AviatorAdminCoin = require("./models/aviatorAdminCoin");
const GameHistory = require("./models/gameHistory");
const LastHistory = require("./models/lastHistory");
const {
  userData,
  percentageUserExistArray,
  percentageFakeExistArray,
} = require("./data");
const User = require("./models/user");
const LoginData = require("./models/login.model");


const Wallet = require("./models/wallet");
const mongoose = require("mongoose");

exports.addUserBets = (diamond, id, image, name) => {
  const index = userBetTotalG.findIndex((element) => {
    if (element?.userId == id) return true;
    return false;
  });
  if (index != -1) {
    userBetTotalG[index].Bet += diamond;
  } else {
    userBetTotalG.push({
      userId: id,
      image: image,
      Bet: diamond,
      name: name,
      win: 0,
      xPercent: 0,
      history: false,
      isFake: false,
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });
  }
  console.log("userBetTotalG", userBetTotalG);
  totalBetG += diamond;
  io.emit("getAllBet", userBetTotalG);
};
exports.addLoginHistory = async (data) => {
  let loginData;
  loginData = new LoginData();
  loginData.userName = data.userName;
  loginData.email = data.email;
  loginData.password = data.password;
  loginData.date = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
  }),
    await loginData.save();
};
exports.cancelUserBets = async (diamond, id) => {
  const index = userBetTotalG.findIndex((element) => {
    if (element?.userId == id) return true;
    return false;
  });
  if (index != -1) {
    userBetTotalG.splice(index, 1);
    const user = await User.updateOne(
      { _id: id },
      { $inc: { diamond: diamond } },
      { $new: true }
    );
    io.emit("getAllBet", userBetTotalG);
    totalBetG = totalBetG <= 0 ? 0 : (totalBetG -= diamond);
    return user;
  }
};

exports.generateShuffledArray = () => {
  const lowCount = config.loweWinAmount;
  const highCount = 100 - lowCount;

  let result = [];
  for (let i = 0; i < lowCount; i++) {
    result.push("low");
  }
  for (let i = 0; i < highCount; i++) {
    result.push("random");
  }
  const iterations = 100;
  for (let k = 0; k < iterations; k++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
};

exports.winLogic = async () => {
  filteredRealUserG = userBetTotalG
    .filter((item) => item.isFake === false)
    .map((item) => {
      return item;
    });

  console.log("filteredRealUser :", filteredRealUserG.length);

  if (filteredRealUserG.length == 0) {
    YCrash = percentageFakeWinExist.shift();
    if (percentageFakeWinExist.length == 0) {
      percentageFakeWinExist = this.generateFakeWinArray();
    }
    console.log("YCrash return ============ ", YCrash);
    return YCrash;
  }

  data = percentageUserWinExist.shift();
  if (percentageUserWinExist.length == 0) {
    percentageUserWinExist = this.generateUserWinArray();
  }
  const aviatorAdminCoin = await AviatorAdminCoin.findOne();

  let coinResult = parseInt(totalBetG * data);

  if (aviatorAdminCoin.coin * 0.6 <= coinResult) {
    data = parseFloat((Math.random() * (1.25 - 1.0) + 1.0).toFixed(2));
    coinResult = parseInt(totalBetG * data);
  }
  if (aviatorAdminCoin.coin * 0.6 <= coinResult) {
    data = 1.0;
  }
  YCrash = data;
  return 1.50;
};

exports.updateUser = async (obj) => {
  try {
    console.log("obj.User._id  : ", obj.User._id);

    const updateUserResult = await User.findByIdAndUpdate(
      { _id: obj.User._id },
      {
        $inc: { diamond: -parseInt(obj.Bet) },
      },
      { new: true }
    );
    return updateUserResult;
  } catch (err) {
    console.log(err);
  }
};

exports.cashOutUpdateUser = async (userId, index, collectPercent) => {
  console.log("cashOutUpdateUser : ================ ", userId);

  let win = userBetTotalG[index].Bet * collectPercent;
  win = Math.round(win + 0.5);

  console.log("win : ================ ", win);
  userBetTotalG[index].win = win;
  userBetTotalG[index].xPercent = collectPercent;
  userBetTotalG[index].history = true;
  const userDb = await User.findById(userId);
  userDb.diamond += win;
  await userDb.save();
  totalWinnerCoinG += win;
  this.addHistory(userId, userBetTotalG[index].Bet, win);
  io.emit("getAllBet", userBetTotalG);
  return userDb;
};

exports.addHistory = async (userId, totalCoin, win) => {
  const income = win - parseInt(totalCoin);
  let history;
  if (!isNaN(income)) {
    if (income <= 0) {
      history = {
        userId: userId,
        isIncome: false,
        type: 17,
        diamond: Math.abs(income),
        date: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      };
      await Wallet(history).save();
    } else {
      history = {
        userId: userId,
        isIncome: true,
        type: 17,
        diamond: Math.floor(income),
        date: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      };
      await Wallet(history).save();
    }
  }
};

exports.allUserHistory = async () => {
  console.log("allUserHistory==================================");

  for (let index = 0; index < filteredRealUserG.length; index++) {
    if (filteredRealUserG[index].history || filteredRealUserG[index].isFake)
      return;
    const outGoing = 0 - parseInt(filteredRealUserG[index].Bet);
    if (!isNaN(outGoing)) {
      history = {
        userId: filteredRealUserG[index]?.userId,
        isIncome: false,
        type: 17,
        diamond: Math.abs(outGoing),
        date: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      };

      await new Wallet(history).save();
      console.log(
        "MAIN HISTORY ++++++++++++++++++++++++++++++++++++++ income",
        outGoing,
        "+++++++++++++"
      );
    }
  }
};

exports.addGameHistory = async (data) => {
  let updatedCoin = totalBetG - totalWinnerCoinG;
  console.log("updatedCoinPlus", updatedCoin);
  const [adminCoin, lastHistory] = await Promise.all([
    AviatorAdminCoin.findOneAndUpdate(
      {},
      { $inc: { coin: updatedCoin } },
      { new: true }
    ),
    LastHistory.findOne(),
  ]);

  const totalWinCoin = filteredRealUserG.reduce(
    (acc, currentValue) => acc + currentValue.win,
    0
  );
  const extractedValues = filteredRealUserG.map((item) => ({
    userId: item.userId,
    Bet: item.Bet,
    win: item.win,
    xPercent: item.xPercent,
    history: item.history,
    date: item.date,
  }));

  if (filteredRealUserG.length != 0) {
    await GameHistory({
      totalAddDiamond: totalBetG, // total add coin in game
      winnerCoinMinus: -parseInt(totalWinCoin),
      updatedAdminCoin: adminCoin.coin,
      userBets: extractedValues,
      xPercent: YCrash,
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    }).save();
  }
  lastHistory.number.unshift(YCrash);
  if (lastHistory.number.length > 20) {
    lastHistory.number.pop();
  }
  await lastHistory.save();
  lastHistoryG = lastHistory;
  io.emit("lastHistory", lastHistoryG);
};

exports.createLastHistory = async () => {
  let lastHistory = await LastHistory.findOne();
  if (!lastHistory) {
    await LastHistory({
      number: [],
    }).save();
  }
  return lastHistory;
};

exports.createAviatorAdminCoin = async () => {
  const aviatorAdminCoin = await AviatorAdminCoin.findOne();
  if (!aviatorAdminCoin) {
    await AviatorAdminCoin().save();
  }
};

exports.getMyBetHistory = async (_id) => {
  let getMyBet = await GameHistory.aggregate([
    {
      $match: {
        "userBets.userId": _id,
      },
    },
    {
      $unwind: "$userBets",
    },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
    {
      $project: {
        Bet: "$userBets.Bet",
        win: "$userBets.win",
        xPercent: "$userBets.xPercent",
        history: "$userBets.history",
        createdAt: "$userBets.createdAt",
        date: "$userBets.date",
      },
    },
  ]);
  return getMyBet;
};

exports.addFakeRandom = async () => {
  let counter = parseInt(Math.random() * (20 - 5) + 5);

  let id = new mongoose.Types.ObjectId("65e17cb928093b3c022218ba");
  let countStart = 0;
  let setTimeOutTime = 50;
  const intervalFunction = () => {
    let diamond = parseInt(Math.random() * (8000 - 100) + 100);
    let xPercent = parseFloat((Math.random() * (4.51 - 1.0) + 1.0).toFixed(2));
    let setTimeOutTime = parseFloat(Math.random() * (100 - 10) + 10);

    let win = diamond * xPercent;
    win = Math.round(win + 0.5);

    const element = userData[countStart];
    userBetTotalG.push({
      userId: id,
      image: element.image,
      Bet: diamond,
      name: element.name,
      win: win,
      xPercent: xPercent,
      history: false,
      isFake: true,
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });
    io.emit("getAllBet", userBetTotalG);
    countStart++;
    if (countStart === counter) {
      clearInterval(intervalId);
    } else {
      intervalId = setTimeout(intervalFunction, setTimeOutTime);
    }
  };
  intervalId = setTimeout(intervalFunction, setTimeOutTime);
};

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

exports.generateUserWinArray = () => {
  percentageUserExistArray.forEach(({ percentage, yDataStart, yDataLimit }) => {
    const itemCount = Math.round((percentage / 100) * 100);
    for (let i = 0; i < itemCount; i++) {
      percentageUserWinExist.push(
        Number(getRandomNumber(yDataStart, yDataLimit).toFixed(2))
      );
    }
  });
  for (let i = percentageUserWinExist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [percentageUserWinExist[i], percentageUserWinExist[j]] = [
      percentageUserWinExist[j],
      percentageUserWinExist[i],
    ];
  }
  console.log("percentageUserWinExist: ", percentageUserWinExist);
  return percentageUserWinExist;
};

exports.generateFakeWinArray = () => {
  percentageFakeExistArray.forEach(({ percentage, yDataStart, yDataLimit }) => {
    const itemCount = Math.round((percentage / 100) * 100);
    for (let i = 0; i < itemCount; i++) {
      percentageFakeWinExist.push(
        Number(getRandomNumber(yDataStart, yDataLimit).toFixed(2))
      );
    }
  });
  for (let i = percentageFakeWinExist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [percentageFakeWinExist[i], percentageFakeWinExist[j]] = [
      percentageFakeWinExist[j],
      percentageFakeWinExist[i],
    ];
  }
  console.log("percentageFakeWinExist: ", percentageFakeWinExist);
  return percentageFakeWinExist;
};
