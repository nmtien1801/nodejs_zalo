require("dotenv").config();
const mongoose = require("mongoose");
const RoomChat = require("../models/roomChat");
const Conversation = require("../models/conversation");
const FriendShip = require("../models/friendShip");
const FriendRequest = require("../models/friendRequest");

const getRoomChatByPhone = async (user, phone) => {
  try {
    if (user.phone === phone) {
      return {
        EM: "Không thể tìm kiếm chính mình",
        EC: 1,
        DT: "",
      };
    }

    // tìm số điện thoai trong RoomChat
    const roomChat = await RoomChat.findOne({
      phone: phone,
    });

    if (!roomChat) {
      return {
        EM: "Không tìm thấy người nào đăng ký số điện thoại này",
        EC: 1,
        DT: "",
      };
    }
    return {
      EM: "ok! getRoomChatByPhone ",
      EC: 0,
      DT: roomChat,
    };
  } catch (error) {
    console.log("check getRoomChatByPhone service", error);
    return res.status(500).json({
      EM: "error getRoomChatByPhone service", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const getAllMemberGroup = async (groupId) => {
  try {
    // Kiểm tra groupId có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return {
        EM: "Invalid groupId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Tìm nhóm trò chuyện theo groupId
    const conversations = await Conversation.find({
      "receiver._id": groupId,
      role: { $in: ["member", "deputy"] },
    }).select("receiver sender type role avatar");

    // Thêm trường avatar , nameSender vào từng conversation
    const group = await Promise.all(
      conversations.map(async (conversation) => {
        const user = await RoomChat.findById(conversation.sender._id);

        const convo = conversation.toObject(); // Chuyển sang plain object

        convo.avatar = user?.avatar || null;
        convo.nameSender = user?.username || null;
        convo.phoneSender = user?.phone || null;

        return convo;
      })
    );

    if (!group) {
      return {
        EM: "Group not found", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Trả về danh sách thành viên của nhóm
    return {
      EM: "Group members fetched successfully", // success message
      EC: 0, // success code
      DT: group, // Trả về danh sách thành viên
    };
  } catch (error) {
    console.error("Error in getAllMemberGroup service: ", error);
    return {
      EM: "Error fetching group members", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const getMemberByPhone = async (phone, groupId) => {
  try {
    // Kiểm tra dữ liệu đầu vào

    if (!phone) {
      return {
        EM: "Phone number is required", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Tìm thành viên theo số điện thoại trong RoomChat
    const member = await RoomChat.findOne({ phone: phone });
    if (!member) {
      return {
        EM: "Member not found with the given phone number",
        EC: 1,
        DT: "",
      };
    }

    const conversations = await Conversation.find({
      "sender._id": member._id, // Truy vấn nested field
      "receiver._id": groupId,
      role: { $in: ["member", "deputy"] },
    });

    // Thêm trường avatar , nameSender vào từng conversation
    const group = await Promise.all(
      conversations.map(async (conversation) => {
        const convo = conversation.toObject(); // Chuyển sang plain object

        convo.avatar = member?.avatar || null;
        convo.nameSender = member?.username || null;
        convo.phoneSender = member?.phone || null;

        return convo;
      })
    );

    if (!group) {
      return {
        EM: "Member not found with the given phone number", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Trả về thông tin thành viên
    return {
      EM: "Member fetched successfully", // success message
      EC: 0, // success code
      DT: group, // Trả về thông tin thành viên
    };
  } catch (error) {
    console.error("Error in getMemberByPhone service: ", error);
    return {
      EM: "Error fetching member by phone", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const getRoomChatMembers = async (roomId) => {
  try {
    // Tìm RoomChat theo roomId và populate danh sách thành viên
    const roomChat = await RoomChat.findById(roomId).populate(
      "members",
      "-password"
    );

    const conversations = await Conversation.find({
      "receiver._id": roomId,
    }).select("receiver sender type role avatar");

    // 3. Gắn role vào từng member trong danh sách
    const membersWithRole = roomChat.members.map((member) => {
      // Tìm conversation mà member này là sender
      const matchedConversation = conversations.find(
        (conv) => conv.sender?._id.toString() === member._id.toString()
      );

      return {
        ...member.toObject(), // Chuyển mongoose document về object
        role: matchedConversation?.role || "member", // mặc định là "member" nếu không có role
      };
    });

    if (!roomChat) {
      return {
        EM: "RoomChat not found",
        EC: 1,
        DT: "",
      };
    }

    return {
      EM: "ok! getRoomChatMembers",
      EC: 0,
      DT: membersWithRole, // Trả về danh sách thành viên
    };
  } catch (error) {
    console.log("check getRoomChatMembers service", error);
    return {
      EM: "error getRoomChatMembers service",
      EC: 2,
      DT: "",
    };
  }
};

const addMembersToRoomChat = async (userId, roomId, members) => {
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

    // Tạo conversation hai chiều giữa tất cả các thành viên
    for (let i = 0; i < members.length; i++) {
      const sender = roomChat;
      const receiver = members[i];

      const isFriend = await FriendShip.findOne({
        $or: [
          { user1: userId, user2: receiver._id },
          { user2: userId, user1: receiver._id },
        ],
      });

      if (!isFriend) {
        // Kiểm tra xem yêu cầu đã tồn tại hay chưa
        const requestExists = await FriendRequest.findOne({
          fromUser: roomId,
          toUser: receiver._id,
          status: 0, // 0: pending
          type: 1, // 1: group request
        });

        if (requestExists) {
          continue; // Bỏ qua nếu yêu cầu đã tồn tại
        }

        // Tạo yêu cầu tham gia nhóm mới
        const newRequest = new FriendRequest({
          fromUser: roomId,
          toUser: receiver._id,
          status: 0, // 0: pending
          type: 1, // 1: group request
          content: receiver.content || "Request to join group",
          sent_at: Date.now(),
        });

        await newRequest.save();
      } else {
        roomChat.members.push(receiver._id); // Thêm thành viên vào RoomChat

        // Tạo conversation từ sender -> receiver
        const conversation1 = new Conversation({
          sender: {
            _id: sender._id,
          },
          receiver: {
            _id: receiver._id,
            username: receiver.username,
            phone: receiver.phone,
          },
          message: "",
          time: Date.now(),
          startTime: Date.now(),
          members: roomChat.members,
          type: 2, // Loại conversation (ví dụ: nhóm chat)
          role: "member",
        });
        await conversation1.save();

        // Tạo conversation từ receiver -> sender
        const conversation2 = new Conversation({
          sender: {
            _id: receiver._id,
          },
          receiver: {
            _id: sender._id,
            username: sender.username,
            phone: sender.phone,
          },
          message: "",
          time: Date.now(),
          startTime: Date.now(),
          members: roomChat.members,
          type: 2, // Loại conversation (ví dụ: nhóm chat)
          role: "member",
        });
        await conversation2.save();

        // Lưu lại RoomChat
        await roomChat.save();
      }
    }

    return {
      EM: "ok! Members added to RoomChat and Conversations created",
      EC: 0,
      DT: roomChat,
    };
  } catch (error) {
    console.log(
      "check addMembersToRoomChatAndCreateConversation service",
      error
    );
    return {
      EM: "error addMembersToRoomChatAndCreateConversation service",
      EC: 2,
      DT: "",
    };
  }
};

module.exports = {
  getRoomChatByPhone,
  getAllMemberGroup,
  getMemberByPhone,
  getRoomChatMembers,
  addMembersToRoomChat,
};
