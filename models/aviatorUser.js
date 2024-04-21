const mongoose = require("mongoose");

const AviatorUserSchema = new mongoose.Schema(
  {
    AutoCollectCoin: { type: Number, default: 0 },
    AutoCollect: { type: Boolean, default: false },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("AviatorUser", AviatorUserSchema);
