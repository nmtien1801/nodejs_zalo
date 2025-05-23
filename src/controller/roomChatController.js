const roomChatService = require("../services/roomChatService");

const getRoomChatByPhone = async (req, res) => {
  try {
    const phone = req.params.phone;
    const user = req.user;
    let data = await roomChatService.getRoomChatByPhone(user, phone);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check getRoomChatByPhone server", err);
    return res.status(500).json({
      EM: "error getRoomChatByPhone", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const getAllMemberGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Kiểm tra dữ liệu đầu vào
    if (!groupId) {
      return res.status(400).json({
        EM: "Group ID is required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để lấy danh sách thành viên của nhóm
    const data = await roomChatService.getAllMemberGroup(groupId);

    // Trả về kết quả từ service
    return res.status(200).json({
      EM: data.EM, // success or error message từ service
      EC: data.EC, // success or error code từ service
      DT: data.DT, // dữ liệu trả về từ service
    });
  } catch (err) {
    console.error("Error in getAllMemberGroup controller: ", err);
    return res.status(500).json({
      EM: "Error fetching group members", // error message
      EC: 2, // error code
      DT: "", // no data
    });
  }
};

const getMemberByPhone = async (req, res) => {
  try {
    const phone = req.params.phone;
    const groupId = req.body.groupId;

    // Kiểm tra dữ liệu đầu vào
    if (!phone) {
      return res.status(400).json({
        EM: "Phone number is required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để lấy thông tin thành viên theo số điện thoại
    const data = await roomChatService.getMemberByPhone(phone, groupId);

    // Trả về kết quả từ service
    return res.status(200).json({
      EM: data.EM, // success or error message từ service
      EC: data.EC, // success or error code từ service
      DT: data.DT, // dữ liệu trả về từ service
    });
  } catch (err) {
    console.error("Error in getMemberByPhone controller: ", err);
    return res.status(500).json({
      EM: "Error fetching member by phone", // error message
      EC: 2, // error code
      DT: "", // no data
    });
  }
};

const getRoomChatMembers = async (req, res) => {
  try {
    const roomId = req.params.roomId;

    if (!roomId) {
      return res.status(400).json({
        EM: "Room ID is required",
        EC: 1,
        DT: "",
      });
    }

    const data = await roomChatService.getRoomChatMembers(roomId);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check getRoomChatMembers server", err);
    return res.status(500).json({
      EM: "error getRoomChatMembers",
      EC: 2,
      DT: "",
    });
  }
};

const addMembersToRoomChat = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id; // Lấy userId từ token
    const { members } = req.body;

    if (!roomId || !members || !Array.isArray(members)) {
      return res.status(400).json({
        EM: "Room ID and members array are required",
        EC: 1,
        DT: "",
      });
    }

    const data = await roomChatService.addMembersToRoomChat(
      userId,
      roomId,
      members
    );

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check addMembersToRoomChatAndCreateConversation server", err);
    return res.status(500).json({
      EM: "error addMembersToRoomChatAndCreateConversation",
      EC: 2,
      DT: "",
    });
  }
};

const acceptGroupJoinRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const data = await roomChatService.acceptGroupJoinRequest(requestId);
    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check acceptGroupJoinRequest server", err);
    return res.status(500).json({
      EM: "error acceptGroupJoinRequest", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

// Lấy thông tin tài khoản người dùng bằng username
const getRoomChatByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        EM: "Username is required",
        EC: 1,
        DT: "",
      });
    }

    const user = await roomChatService.findRoomChatByUsername(username);

    if (!user) {
      return res.status(404).json({
        EM: "User not found",
        EC: 1,
        DT: "",
      });
    }

    return res.status(200).json({
      EM: "User found",
      EC: 0,
      DT: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error in getUserAccountByUsername: ", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const getPermissionCurrent = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        EM: "Username is required",
        EC: 1,
        DT: "",
      });
    }

    const user = await roomChatService.getPermissionCurrent(groupId);

    if (!user) {
      return res.status(404).json({
        EM: "User not found",
        EC: 1,
        DT: "",
      });
    }

    return res.status(200).json({
      EM: "User found",
      EC: 0,
      DT: user.DT,
    });
  } catch (error) {
    console.error("Error in getUserAccountByUsername: ", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

module.exports = {
  getRoomChatByPhone,
  getAllMemberGroup,
  getMemberByPhone,
  getRoomChatMembers,
  addMembersToRoomChat,
  acceptGroupJoinRequest,
  getRoomChatByUsername,
  getPermissionCurrent
};
