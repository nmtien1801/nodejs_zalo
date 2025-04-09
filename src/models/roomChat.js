const mongoose = require("mongoose");

const roomChatSchema = new mongoose.Schema(
  {
    email: { type: String, required: false },
    phone: { type: String, required: false, unique: true },
    username: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    avatar: { type: String, required: true },
    password: { type: String, required: false },
    roleID: { type: String, required: false },
    code: { type: String, required: false },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomChat",
      },
    ],
  },
  { timestamps: true }
);

const RoomChat = mongoose.model("RoomChat", roomChatSchema);

module.exports = RoomChat;
