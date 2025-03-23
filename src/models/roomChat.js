const mongoose = require("mongoose");

const roomChatSchema = new mongoose.Schema({
  email: { type: String, required: false },
  phone: { type: String, required: false, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  roleID: { type: String, required: false },

}, { timestamps: true }); 

const RoomChat = mongoose.model("RoomChat", roomChatSchema);

module.exports = RoomChat;
