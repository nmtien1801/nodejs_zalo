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
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      ],
    },
    message: { type: String, required: true },
    time: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    avatar: { type: String, required: false },
    type: { type: Number, required: true },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
