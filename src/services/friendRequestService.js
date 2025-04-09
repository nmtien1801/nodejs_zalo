require("dotenv").config();

const FriendRequest = require("../models/friendRequest");
const FriendShip = require("../models/friendShip");
const Message = require("../models/message");
const Conversation = require("../models/conversation");

const roomChatService = require("./roomChatService");

const sendFriendRequest = async (data) => {

    console.log("check sendFriendRequest service", data);


    try {

        // Kiểm tra xem yêu cầu kết bạn đã tồn tại hay chưa
        const requestExists = await checkFriendRequestExists(data.fromUser, data.toUser);
        if (requestExists) {
            return {
                EM: "request already exists",
                EC: 1,
                DT: "",
            };
        }

        // Tạo một yêu cầu kết bạn mới
        const newRequest = new FriendRequest({
            fromUser: data.fromUser,
            toUser: data.toUser,
            status: 0, // 0: pending, 1: accepted, 2: rejected
            content: data.content,
            sent_at: Date.now(),
        });
        await newRequest.save();

        return {
            EM: "ok! sendFriendRequest",
            EC: 0,
            DT: newRequest,
        };
    } catch (error) {
        console.log("check sendFriendRequest service", error);
        return {
            EM: "error sendFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
}

const checkFriendRequestExists = async (fromUser, toUser) => {
    try {
        // Kiểm tra xem yêu cầu kết bạn đã tồn tại hay chưa
        const request = await FriendRequest.findOne({
            fromUser: fromUser,
            toUser: toUser,
            status: 0, // 0: pending
        });
        return request ? true : false;
    } catch (error) {
        console.log("check checkFriendRequestExists service", error);
        return false;
    }
}

const acceptFriendRequest = async (_id) => {
    try {
        // Cập nhật trạng thái yêu cầu kết bạn thành accepted
        const updatedRequest = await FriendRequest.findByIdAndUpdate(
            _id,
            { status: 1 }, // 1: accepted
            { new: true }
        );

        const user1 = await roomChatService.getRoomChatByPhone(updatedRequest.fromUser);
        const user2 = await roomChatService.getRoomChatByPhone(updatedRequest.toUser);


        // Tạo một mối quan hệ bạn bè mới
        const newFriendShip = new FriendShip({
            user1: user1.DT._id,
            user2: user2.DT._id,
            created_at: Date.now(),
        });
        await newFriendShip.save();

        // Tạo một phòng chat mới cho mối quan hệ bạn bè
        const _data = {
            sender: {
                _id: user1.DT._id,
            },
            receiver: {
                _id: user2.DT._id,
                username: user2.DT.username,
                phone: user2.DT.phone,
            },
            message: "Bạn đã chấp nhận lời mời kết bạn từ " + user1.DT.username,
            time: Date.now(),
            startTime: Date.now(),
            type: 1,
            members: [
                user1.DT._id,
                user2.DT._id,
            ],
        };

        const conversation1 = new Conversation(_data);
        await conversation1.save();

        const conversation2 = new Conversation({

            sender: {
                _id: user2.DT._id,
            },
            receiver: {
                _id: user1.DT._id,
                username: user1.DT.username,
                phone: user1.DT.phone,
            },
            message: user2.DT.username + " đã chấp nhận lời mời kết bạn từ bạn",
            time: Date.now(),
            startTime: Date.now(),
            type: 1,
            members: [
                user1.DT._id,
                user2.DT._id,
            ],

        });
        await conversation2.save();


        return {
            EM: "ok! acceptFriendRequest",
            EC: 0,
            DT: updatedRequest,
        };
    } catch (error) {
        console.log("check acceptFriendRequest service", error);
        return {
            EM: "error acceptFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
}

const rejectFriendRequest = async (requestId) => {
    try {
        // Cập nhật trạng thái yêu cầu kết bạn thành rejected
        const updatedRequest = await FriendRequest.findByIdAndUpdate(
            requestId,
            { status: 2 }, // 2: rejected
            { new: true }
        );
        return {
            EM: "ok! rejectFriendRequest",
            EC: 0,
            DT: updatedRequest,
        };
    } catch (error) {
        console.log("check rejectFriendRequest service", error);
        return {
            EM: "error rejectFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
}

const getFriendRequests = async (phone) => {
    try {
        // Lấy danh sách yêu cầu kết bạn của người dùng
        const requests = await FriendRequest.find({
            toUser: phone,
            status: 0, // 0: pending
        }).populate("fromUser"); // populate thông tin người gửi yêu cầu

        return {
            EM: "ok! getFriendRequestsByUserId",
            EC: 0,
            DT: requests,
        };
    } catch (error) {
        console.log("check getFriendRequestsByUserId service", error);
        return {
            EM: "error getFriendRequestsByUserId service",
            EC: 2,
            DT: "",
        };
    }
}


module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
};

