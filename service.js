const config = require("./config");
const AviatorAdminCoin = require("./models/aviatorAdminCoin");
const GameHistory = require("./models/gameHistory");
const LastHistory = require("./models/lastHistory");

const User = require("./models/user");

const Wallet = require("./models/wallet");

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
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });
  }
  console.log("bet ====== userBetTotalG ", userBetTotalG);

  totalBetG += diamond;
  io.emit("getAllBet", userBetTotalG);
};

exports.cancelUserBets = async (diamond, id) => {
  const index = userBetTotalG.findIndex((element) => {
    if (element?.userId == id) return true;
    return false;
  });
  if (index != -1) {
    userBetTotalG.splice(findBetIndex, 1);
    const user = await User.updateOne(
      { _id: id },
      { $inc: { diamond: 10 } },
      { $new: true }
    );
    io.emit("getAllBet", userBetTotalG);
    totalBetG -= diamond;
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
  let highOrLow = highOrLowWinResultG.shift();
  if (!highOrLow) {
    highOrLow = "low";
    highOrLowWinResultG = this.generateShuffledArray();
    console.log("highOrLowWinResultG", highOrLowWinResultG);
  }

  if (highOrLow == "low") {
    const lowCountArrayGIndex =
      Math.floor(Math.random() * lowCountArrayG.length) + 0;
    const yCrashIndexValue = lowCountArrayG[lowCountArrayGIndex];
    yCrashIndexValue;

    const coin = aviatorAdminCoin.coin * 0.4;
    YCrash = coin / totalBetG;
    YCrash = YCrash < 0 ? 1.01 : YCrash;
    return YCrash;
  }

  const aviatorAdminCoin = await AviatorAdminCoin.findOne();
  const coin = aviatorAdminCoin.coin * 0.4;
  YCrash = coin / totalBetG;
  YCrash = YCrash < 0 ? 1.01 : YCrash;
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

  for (let index = 0; index < forAllUserHistoryArrayG.length; index++) {
    if (forAllUserHistoryArrayG[index].history) return;
    const outGoing = 0 - parseInt(forAllUserHistoryArrayG[index].Bet);
    if (!isNaN(outGoing)) {
      history = {
        userId: forAllUserHistoryArrayG[index]?.userId,
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
  let updatedCoinPlus = totalBetG - totalWinnerCoinG * YCrash;
  console.log("updatedCoinPlus", updatedCoinPlus);
  const [adminCoin, lastHistory] = await Promise.all([
    AviatorAdminCoin.findOne(),
    // AviatorAdminCoin.updateOne(
    //   {},
    //   { $inc: { coin: 10 } },
    //   {
    //     new: true,
    //   }
    // ),
    LastHistory.findOne(),
  ]);

  const totalWinCoin = forAllUserHistoryArrayG.reduce(
    (acc, currentValue) => acc + currentValue.win,
    0
  );
  console.log("forAllUserHistoryArrayG ", forAllUserHistoryArrayG);
  const extractedValues = forAllUserHistoryArrayG.map((item) => ({
    userId: item.userId,
    Bet: item.Bet,
    win: item.win,
    xPercent: item.xPercent,
    history: item.history,
    date: item.date,
  }));

  if (forAllUserHistoryArrayG.length != 0) {
    console.log("forAllUserHistoryArrayG gameHistory add ");
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
  if (lastHistory.number.length > 50) {
    lastHistory.number.pop();
  }
  await lastHistory.save();
  lastHistoryG = lastHistory;
  console.log("lastHistory", lastHistory);
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
