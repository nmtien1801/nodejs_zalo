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

const getAllFriends = async (userId) => {
    try {
        // Tìm tất cả các mối quan hệ bạn bè liên quan đến userId và populate thông tin user
        const friendships = await FriendShip.find({
            $or: [
                { user1: userId },
                { user2: userId },
            ],
        }).populate("user1", "-password") // Populate thông tin user1, loại bỏ trường password
            .populate("user2", "-password"); // Populate thông tin user2, loại bỏ trường password

        if (!friendships || friendships.length === 0) {
            return {
                EM: "No friends found",
                EC: 1,
                DT: [],
            };
        }

        // Lấy danh sách bạn bè (loại bỏ userId khỏi kết quả)
        const friends = friendships.map((friendship) => {
            return friendship.user1._id.toString() === userId
                ? friendship.user1
                : friendship.user2;
        });
        return {
            EM: "ok! getAllFriends",
            EC: 0,
            DT: friends,
        };
    } catch (error) {
        console.log("check getAllFriends service", error);
        return {
            EM: "error getAllFriends service",
            EC: 2,
            DT: "",
        };
    }
};

module.exports = {
    deleteFriendShip, checkFriendShipExists, getAllFriends,
};

