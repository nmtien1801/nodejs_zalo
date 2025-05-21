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

const getFriends = async (userId) => {
    try {
        // Tìm tất cả các mối quan hệ bạn bè của userId
        const friendships = await FriendShip.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 0,
        }).populate({
            path: "user1 user2",
            select: "_id username avatar phone",
        });

        // Lọc danh sách bạn bè
        const friends = friendships.map((friendship) => {
            const friend =
                friendship.user1._id.toString() === userId.toString()
                    ? friendship.user2
                    : friendship.user1;

            return {
                _id: friend._id,
                username: friend.username,
                avatar: friend.avatar,
                phone: friend.phone,
                since: friendship.since,
            };
        });

        return {
            EM: "Friends fetched successfully", // success message
            EC: 0, // success code
            DT: friends, // danh sách bạn bè
        };
    } catch (error) {
        console.error("Error in getFriends service: ", error);
        return {
            EM: "Error fetching friends", // error message
            EC: -1, // error code
            DT: "", // no data
        };
    }
};
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
            const friend =
                friendship.user1._id.toString() === userId.toString()
                    ? friendship.user2
                    : friendship.user1;

            return {
                _id: friend._id,
                username: friend.username,
                avatar: friend.avatar,
                phone: friend.phone,
                since: friendship.since,
            };
        });

        console.log("friends", friends);

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
    deleteFriendShip, checkFriendShipExists,
    getAllFriends, getFriends
};

