const mongoose = require("mongoose");

const friendShipSchema = new mongoose.Schema(
    {
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "RoomChat",
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "RoomChat",
        },
        status: {
            type: Number,
            required: true,
            default: 0, // 0: pending, 1: blocked
        },
        since: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { timestamps: true }
);

friendShipSchema.index({ user1: 1, user2: 1 }, { unique: true });

friendShipSchema.index({ user2: 1, user1: 1 }, { unique: true });

const FriendShip = mongoose.model("FriendShip", friendShipSchema);

module.exports = FriendShip;