const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    sender: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
    receiver: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      permission: { type: [Number], required: false },
    },
    message: { type: String, required: false },
    time: { type: String, required: false },
    startTime: { type: Date, required: false },
    endTime: { type: Date },
    avatar: { type: String, required: false },
    type: { type: Number, required: false }, // 1 - person, 2 - group, 3 - cloud
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "RoomChat",
      },
    ],
    role: { type: String, default: "member" }, // leader - deputy - member
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
