const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17],
    }, // 0:gift, 1:convert, 2:purchase [diamond purchase], 3:call, 4:ad[from watching ad], 5:login bonus, 6:referral bonus, 7: cashOut, 8: admin [admin add or less the rCoin or diamond through admin panel] , 9 :coinSellerHistory, 10 : gameCoin , 11: avatarFrame ,  15 : RouletteGameCoin  , 16 :ferryWheel , 17 : aviator
    diamond: { type: Number, default: null },
    rCoin: { type: Number, default: null },
    date: String,
    isIncome: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Wallet", walletSchema);
