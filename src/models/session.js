const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  roomChatID: { type: mongoose.Schema.Types.ObjectId, ref: "RoomChat" },
  access_Token: { type: String, required: true },
  refresh_Token: { type: String, required: true },
  ip_device: { type: String, required: true },
  user_agent: { type: String, required: true },
  // socketID: { type: String, required: true },

}, { timestamps: true }); 

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
