const mongoose = require("mongoose");

const AviatorAdminCoinSchema = new mongoose.Schema(
  {
    coin: { type: Number, default: 0 },
    totalCoin: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AviatorAdminCoin", AviatorAdminCoinSchema);
