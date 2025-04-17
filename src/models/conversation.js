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
    },
    message: { type: String, required: false },
    time: { type: String, required: false },
    startTime: { type: Date, required: false },
    endTime: { type: Date },
    avatar: { type: String, required: false },
    type: { type: Number, required: false },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "RoomChat",
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
