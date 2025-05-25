const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    msg: {
      type: String,
      required: true,
    },
    sender: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: false,
      },
    },
    receiver: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: false,
      },
      avatar: { 
        type: String, 
        required: false 
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          required: false,
        },
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomChat"
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isDeletedBySender: {
      type: Boolean,
      default: false,
    },
    isDeletedByReceiver: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "text", // 1 - text , 2 - image, 3 - video, 4 - file, 5 - icon
    },
    memberDel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
