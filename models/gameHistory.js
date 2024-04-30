const mongoose = require("mongoose");

const AviatorGameHistorySchema = new mongoose.Schema(
  {
    userBets: [
      {
        userId: String,
        Bet: { type: Number, default: 0 },
        win: { type: Number, default: 0 },
        xPercent: { type: Number, default: 0 },
        history: { type: Boolean, default: false },
        date: { type: String },
      },
    ],
    date: {
      type: String,
      default: "",
    },
    winnerObj: {},
    xPercent: { type: Number, default: 1 },
    updatedAdminCoin: { type: Number, default: 0 },
    winnerCoinMinus: { type: Number, default: 0 },
    totalAddDiamond: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("AviatorGameHistory", AviatorGameHistorySchema);
