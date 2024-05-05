const mongoose = require("mongoose");

const LoginDataSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    coin: {
      type: Number,
      default: 100,
    },
    date: {
      type: String,
      default: "",
    },
  },

  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("LoginData", LoginDataSchema);