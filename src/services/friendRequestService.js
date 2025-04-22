require("dotenv").config();

const FriendRequest = require("../models/friendRequest");
const FriendShip = require("../models/friendShip");
const Message = require("../models/message");
const Conversation = require("../models/conversation");

const roomChatService = require("./roomChatService");
const RoomChat = require("../models/roomChat");

const sendFriendRequest = async (data) => {

    console.log("check sendFriendRequest service", data);

    try {
        // Kiểm tra xem yêu cầu kết bạn đã tồn tại hay chưa
        const requestExists = await checkFriendRequestExists(data.fromUser, data.toUser);
        if (requestExists) {
            return {
                EM: "Yêu cầu kết bạn đã tồn tại",
                EC: 1,
                DT: "",
            };
        }

        // kiểm tra xem người dùng đã là bạn bè hay chưa
        const friendShipExists = await FriendShip.findOne({
            $or: [
                { user1: data.fromUser, user2: data.toUser },
                { user2: data.fromUser, user1: data.toUser },
            ],
        });

        if (friendShipExists) {
            return {
                EM: "Người dùng đã là bạn bè",
                EC: 1,
                DT: "",
            };
        }


        // Tạo một yêu cầu kết bạn mới
        const newRequest = new FriendRequest({
            fromUser: data.fromUser,
            toUser: data.toUser,
            status: 0, // 0: pending, 1: accepted, 2: rejected
            type: 0, // 0: friend request, 1: group request
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
            $or: [
                { fromUser: fromUser, toUser: toUser },
                { fromUser: toUser, toUser: fromUser },
            ],
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
        // Lấy yêu cầu kết bạn theo id và populate các trường cần thiết
        const friendRequest = await FriendRequest.findById(_id)
            .populate("fromUser")
            .populate("toUser");

        console.log("check acceptFriendRequest", friendRequest);

        // Kiểm tra xem yêu cầu kết bạn có tồn tại hay không
        if (!friendRequest) {
            return {
                EM: "Không tìm thấy yêu cầu kết bạn",
                EC: 1,
                DT: "",
            };
        }

        // Kiểm tra các trường bắt buộc
        if (!friendRequest.fromUser || !friendRequest.toUser) {
            return {
                EM: "Yêu cầu kết bạn không hợp lệ",
                EC: 1,
                DT: "",
            };
        }

        // Lấy thông tin người dùng
        const user1 = await RoomChat.findById(friendRequest.fromUser._id);
        const user2 = await RoomChat.findById(friendRequest.toUser._id);

        console.log("check user1", user1);
        console.log("check user2", user2);



        if (!user1 || !user2) {
            return {
                EM: "Không tìm thấy thông tin người dùng",
                EC: 1,
                DT: "",
            };
        }

        // Kiểm tra xem người dùng đã là bạn bè hay chưa
        const friendShipExists = await FriendShip.findOne({
            $or: [
                { user1: user1._id, user2: user2._id },
                { user2: user1._id, user1: user2._id },
            ],
        });

        if (friendShipExists) {
            return {
                EM: "Người dùng đã là bạn bè",
                EC: 1,
                DT: "",
            };
        }

        // Tạo một mối quan hệ bạn bè mới
        const newFriendShip = new FriendShip({
            user1: user1._id,
            user2: user2._id,
            status: 0, // 1: accepted
            since: Date.now(),
        });



        await newFriendShip.save();

        // Tạo một phòng chat mới cho mối quan hệ bạn bè

        const conversation1 = new Conversation({
            sender: {
                _id: user1._id,
            },
            receiver: {
                _id: user2._id,
                username: user2.username,
                phone: user2.phone,
            },
            message: "",
            time: Date.now(),
            startTime: Date.now(),
            type: 1,
            members: [user1._id, user2._id],
        });
        await conversation1.save();

        const conversation2 = new Conversation({
            sender: {
                _id: user2._id,
            },
            receiver: {
                _id: user1._id,
                username: user1.username,
                phone: user1.phone,
            },
            message: "",
            time: Date.now(),
            startTime: Date.now(),
            type: 1,
            members: [user1._id, user2._id],
        });
        await conversation2.save();


        // xoa yêu cầu kết bạn
        await FriendRequest.findByIdAndDelete(_id);


        return {
            EM: "ok! acceptFriendRequest",
            EC: 0,
            DT: newFriendShip,
        };
    } catch (error) {

        console.log("check acceptFriendRequest service", error);

        return {
            EM: "error acceptFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
};

const rejectFriendRequest = async (requestId) => {
    try {
        // Cập nhật trạng thái yêu cầu kết bạn thành rejected
        const friendRequest = await FriendRequest.findByIdAndDelete(
            requestId
        );
        return {
            EM: "ok! rejectFriendRequest",
            EC: 0,
            DT: friendRequest,
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

const getFriendRequests = async (userId) => {
    try {
        // Lấy danh sách yêu cầu kết bạn của người dùng
        const requests = await FriendRequest.find({
            toUser: userId,
            status: 0, // 0: pending  
            type: 0, // 0: friend request
        }).populate("fromUser"); // populate thông tin người gửi yêu cầu

        const response = requests.map(request => ({
            _id: request._id,
            email: request.fromUser?.email,
            phone: request.fromUser?.phone,
            username: request.fromUser?.username,
            gender: request.fromUser?.gender,
            dob: request.fromUser?.dob,
            avatar: request.fromUser?.avatar,
            toUser: request.toUser,
            status: request.status,
            content: request.content,
            sent_at: new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit',
                month: '2-digit',
            }).format(new Date(request.sent_at)),
        }));


        return {
            EM: "ok! getFriendRequestsByUserId",
            EC: 0,
            DT: response,
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

const getFriendRequestByFromUserAndToUser = async (fromUser, toUser) => {
    try {
        // Lấy yêu cầu kết bạn theo id và populate các trường cần thiết
        const friendRequest = await FriendRequest.findOne({
            $or: [
                { fromUser: fromUser, toUser: toUser },
                { fromUser: toUser, toUser: fromUser },
            ],
            status: 0, // 0: pending
        }).populate("fromUser").populate("toUser");

        if (!friendRequest) {
            return {
                EM: "Không tìm thấy yêu cầu kết bạn",
                EC: 1,
                DT: "",
            };
        }

        return {
            EM: "ok! getFriendRequestByFromUserAndToUser",
            EC: 0,
            DT: friendRequest,
        };

    } catch (error) {
        console.log("check getFriendRequestByFromUserAndToUser service", error);
        return null;
    }
}

const cancelFriendRequest = async (requestId) => {
    try {
        // Xóa yêu cầu kết bạn
        const friendRequest = await FriendRequest.findByIdAndDelete(requestId);
        return {
            EM: "ok! cancelFriendRequest",
            EC: 0,
            DT: friendRequest,
        };
    } catch (error) {
        console.log("check cancelFriendRequest service", error);
        return {
            EM: "error cancelFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
}

const sendGroupJoinRequests = async (roomId, members) => {
    try {
        // Tìm RoomChat theo roomId
        const roomChat = await RoomChat.findById(roomId);

        if (!roomChat) {
            return {
                EM: "RoomChat not found",
                EC: 1,
                DT: "",
            };
        }

        const requests = [];

        for (const member of members) {
            // Kiểm tra xem yêu cầu đã tồn tại hay chưa
            const requestExists = await FriendRequest.findOne({
                fromUser: roomId,
                toUser: member._id,
                status: 0, // 0: pending
                type: 1, // 1: group request
            });

            if (requestExists) {
                continue; // Bỏ qua nếu yêu cầu đã tồn tại
            }

            // Tạo yêu cầu tham gia nhóm mới
            const newRequest = new FriendRequest({
                fromUser: roomId,
                toUser: member._id,
                status: 0, // 0: pending
                type: 1, // 1: group request
                content: member.content || "Request to join group",
                sent_at: Date.now(),
            });

            await newRequest.save();
            requests.push(newRequest);
        }

        return {
            EM: "ok! Group join requests sent",
            EC: 0,
            DT: requests,
        };
    } catch (error) {
        console.log("check sendGroupJoinRequests service", error);
        return {
            EM: "error sendGroupJoinRequests service",
            EC: 2,
            DT: "",
        };
    }
};

const getGroupJoinRequests = async (userId) => {
    try {
        // Lấy danh sách yêu cầu tham gia nhóm
        const requests = await FriendRequest.find({
            toUser: userId,
            status: 0, // 0: pending
            type: 1, // 1: group request
        }).populate("fromUser"); // populate thông tin người gửi yêu cầu

        return {
            EM: "ok! getGroupJoinRequests",
            EC: 0,
            DT: requests,
        };
    } catch (error) {
        console.log("check getGroupJoinRequests service", error);
        return {
            EM: "error getGroupJoinRequests service",
            EC: 2,
            DT: "",
        };
    }
};


const acceptGroupJoinRequest = async (_id) => {
    try {
        // Lấy yêu cầu kết bạn theo id và populate các trường cần thiết
        const friendRequest = await FriendRequest.findById(_id)
            .populate("fromUser")
            .populate("toUser");

        // Kiểm tra xem yêu cầu kết bạn có tồn tại hay không
        if (!friendRequest) {
            return {
                EM: "Không tìm thấy yêu cầu vào nhóm",
                EC: 1,
                DT: "",
            };
        }

        // Kiểm tra các trường bắt buộc
        if (!friendRequest.fromUser || !friendRequest.toUser) {
            return {
                EM: "Yêu cầu vào nhóm không hợp lệ",
                EC: 1,
                DT: "",
            };
        }

        // Lấy thông tin người dùng
        const fromUser = await RoomChat.findById(friendRequest.fromUser._id);
        const toUser = await RoomChat.findById(friendRequest.toUser._id);

        if (!fromUser || !toUser) {
            return {
                EM: "Không tìm thấy thông tin người dùng",
                EC: 1,
                DT: "",
            };
        }


        // Tạo một phòng chat mới cho mối quan hệ nhóm

        fromUser.members.push(toUser._id); // Thêm thành viên vào RoomChat

        // Tạo conversation từ sender -> receiver
        const conversation1 = new Conversation({
            sender: {
                _id: fromUser._id,
            },
            receiver: {
                _id: toUser._id,
                username: toUser.username,
                phone: toUser.phone,
            },
            message: "",
            time: Date.now(),
            startTime: Date.now(),
            members: fromUser.members,
            type: 2, // Loại conversation (ví dụ: nhóm chat)
            role: "member",
        });
        await conversation1.save();

        // Tạo conversation từ receiver -> sender
        const conversation2 = new Conversation({
            sender: {
                _id: toUser._id,
            },
            receiver: {
                _id: fromUser._id,
                username: fromUser.username,
                phone: fromUser.phone,
            },
            message: "",
            time: Date.now(),
            startTime: Date.now(),
            members: fromUser.members,
            type: 2, // Loại conversation (ví dụ: nhóm chat)
            role: "member",
        });
        await conversation2.save();

        // Lưu lại RoomChat
        await fromUser.save();


        // xoa yêu cầu kết bạn
        await FriendRequest.findByIdAndDelete(_id);


        return {
            EM: "ok! acceptFriendRequest",
            EC: 0,
            DT: fromUser,
        };
    } catch (error) {

        console.log("check acceptFriendRequest service", error);

        return {
            EM: "error acceptFriendRequest service",
            EC: 2,
            DT: "",
        };
    }
};



module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    getFriendRequestByFromUserAndToUser,
    cancelFriendRequest,
    sendGroupJoinRequests,
    getGroupJoinRequests,
    acceptGroupJoinRequest,
};

