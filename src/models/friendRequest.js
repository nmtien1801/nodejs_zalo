const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
    {
        // _id: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true,
        // },
        fromUser: {
            type: String,
            required: true,
        },
        toUser: {
            type: String,
            required: true,
        },
        status: {
            type: Number,
            required: true,
            default: 0, // 0: pending, 1: accepted, 2: rejected
        },
        content: {
            type: String,
            required: true,
        },
        sent_at: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
friendRequestSchema.index({ toUser: 1, fromUser: 1 }, { unique: true });


const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

module.exports = FriendRequest;