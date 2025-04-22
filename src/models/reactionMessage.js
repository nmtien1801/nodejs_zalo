const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    emoji: {
      type: String,
      enum: ["Like", "Love", "Haha", "Wow", "Sad", "Angry"],
      required: true,
    },
  },
  { timestamps: true } 
);

const ReactionMessage = mongoose.model("ReactionMessage", reactionSchema);

module.exports = ReactionMessage;
