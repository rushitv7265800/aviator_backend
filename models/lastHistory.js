const mongoose = require("mongoose");

const AviatorLastHistorySchema = new mongoose.Schema(
  {
    number: [],
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model("AviatorLastHistory", AviatorLastHistorySchema);
