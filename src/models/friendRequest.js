const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
    {
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "RoomChat",
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "RoomChat",
        },
        status: {
            type: Number,
            required: true,
            default: 0, // 0: pending, 1: accepted, 2: rejected
        },
        content: {
            type: String,
            required: false,
        },
        sent_at: {
            type: Date,
            default: Date.now,
        },
        type: {
            type: Number,
            required: true,
            default: 0, // 0: friend request, 1: group request
        },
    },
    { timestamps: true }
);

friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
friendRequestSchema.index({ toUser: 1, fromUser: 1 }, { unique: true });


const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

module.exports = FriendRequest;