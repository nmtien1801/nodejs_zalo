const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  accountID: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  access_Token: { type: String, required: true },
  refresh_Token: { type: String, required: true },
  ip_device: { type: String, required: true },
  user_agent: { type: String, required: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
