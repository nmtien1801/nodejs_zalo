const mongoose = require("mongoose");

const roomChatSchema = new mongoose.Schema(
  {
    email: { type: String, required: false },
    phone: { type: String, required: false },
    username: { type: String, required: true },
    gender: { type: String, required: false },
    dob: { type: String, required: false },
    avatar: { type: String, required: false },
    password: { type: String, required: false },
    code: { type: String, required: false },
    avatar: { type: String, required: false },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomChat",
      },
    ],
    permission: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7] },
  },
  { timestamps: true }
);

const RoomChat = mongoose.model("RoomChat", roomChatSchema);

module.exports = RoomChat;
