require("dotenv").config();

const FriendShip = require("../models/friendShip");
const FriendRequest = require("../models/friendRequest");
const Conversation = require("../models/conversation");

const ObjectId = require("mongoose").Types.ObjectId;

const deleteFriendShip = async (userId, friendId) => {
    try {
        const friendShip = await FriendShip.findOneAndDelete({
            $or: [
                { user1: userId, user2: new ObjectId(friendId) },
                { user2: userId, user1: new ObjectId(friendId) },
            ],
        });

        if (!friendShip) {
            return {
                EM: "Friendship not found",
                EC: 1,
                DT: "",
            };
        }


        // Xóa tất cả các conversation có members chứa userId và friendId
        const conversations = await Conversation.deleteMany({
            type: 1,
            members: { $all: [userId, friendId] },
        });


        return {
            EM: "ok! deleteFriendShip",
            EC: 0,
            DT: friendShip,
        };
    } catch (error) {
        console.log("check deleteFriendShip service", error);
        return {
            EM: "error deleteFriendShip service",
            EC: 2,
            DT: "",
        };
    }
};

const checkFriendShipExists = async (userId, friendId) => {
    try {

        // Kiểm tra xem người dùng có phải là bạn bè hay không


        const friendShip = await FriendShip.findOne({
            $or: [
                { user1: userId, user2: new ObjectId(friendId) },
                { user2: userId, user1: new ObjectId(friendId) },
            ],
        });

        if (!friendShip) {
            return {
                EM: "Friendship not found",
                EC: 1,
                DT: "",
            };
        }
        return {
            EM: "ok! checkFriendShipExists",
            EC: 0,
            DT: friendShip,
        };
    } catch (error) {
        console.log("check checkFriendShipExists service", error);
        return {
            EM: "error checkFriendShipExists service",
            EC: 2,
            DT: "",
        };
    }
}

module.exports = {
    deleteFriendShip, checkFriendShipExists,
};

