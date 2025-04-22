require("dotenv").config();
const mongoose = require("mongoose");
const RoomChat = require("../models/roomChat");
const Conversation = require("../models/conversation");

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

module.exports = {
  getRoomChatByPhone,
  getAllMemberGroup,
  getMemberByPhone,
};
