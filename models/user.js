const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    gender: { type: String, default: "" },
    age: { type: Number, default: 0 },
    email: String,
    image: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    link: { type: String, default: null },
    country: String,
    uniqueId: Number,
    ip: String,
    gameBlock: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    diamond: { type: Number, default: 0 },
    rCoin: { type: Number, default: 0 },
    spentCoin: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("User", userSchema);
