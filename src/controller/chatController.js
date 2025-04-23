const chatService = require("../services/chatService");
const Message = require("../models/message");

const getConversations = async (req, res) => {
  try {
    const senderId = req.user._id;
    let data = await chatService.getConversations(senderId);

    // console.log("check getConversations", data);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check getConversations server", err);
    return res.status(500).json({
      EM: "error getConversations", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const getConversationsByMember = async (req, res) => {
  try {
    const { senderId } = req.params;
    let data = await chatService.getConversationsByMember(senderId);
  } catch (err) {
    console.log("check getConversationsByMember server", err);
    return res.status(500).json({
      EM: "error getConversationsByMember", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const createConversationGroup = async (req, res) => {
  try {
    const { avatarGroup, members, nameGroup } = req.body; // Lấy dữ liệu từ body request

    console.log("Tên nhóm:", nameGroup);
    console.log("Avatar nhóm:", avatarGroup);
    console.log("Danh sách thành viên:", members);

    if (!nameGroup || !members || members.length === 0) {
      return res.status(400).json({
        EM: "Missing required fields (nameGroup or members)", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    let data = await chatService.createConversationGroup(
      nameGroup,
      avatarGroup,
      members
    );

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check createConversationGroup server", err);
    return res.status(500).json({
      EM: "Error creating conversation group", // error message
      EC: 2, // error code
      DT: "", // no data
    });
  }
};

const saveMsg = async (data) => {
  try {
    const _data = {
      msg: data.msg,
      sender: {
        _id: data.sender._id,
        name: data.sender.username,
        phone: data.sender?.phone || null,
      },
      receiver: {
        _id: data.receiver._id,
        name: data.receiver.username,
        phone: data.receiver?.phone || null,
        members: data.receiver.members,
      },
      isRead: false,
      isDeleted: false,
      isDeletedBySender: false,
      isDeletedByReceiver: false,
      type: data.type || "text", // 1 - text , 2 - image, 3 - video, 4 - file, 5 - icon
    };

    const saveMsg = new Message(_data);
    await saveMsg.save();

    return saveMsg;
  } catch (error) {
    console.log(">>>> check saveMsg server", error);
    return {
      EM: "error saveMsg", //error message
      EC: 2, //error code
      DT: "", // data
    };
  }
};

const getMsg = async (req, res) => {
  try {
    let sender = req.params.sender;
    let receiver = req.params.receiver;
    let type = req.params.type;

    if (!sender || !receiver) {
      return res.status(403).json({
        EM: "User id required.", //error message
        EC: 2, //error code
        DT: "", // data
      });
    }

    let allMsg = [];
    if (+type === 2) {
      // Tin nhắn nhóm
      allMsg = await Message.find({
        "receiver._id": receiver,
        memberDel: { $ne: sender },
      });

      allMsg = allMsg.map((msg) => {
        if (msg.isDeleted) {
          return {
            _id: msg._id,
            msg: "Tin nhắn đã được thu hồi",
            sender: msg.sender,
            receiver: msg.receiver,
            isRead: msg.isRead,
            isDeleted: msg.isDeleted,
            isDeletedBySender: msg.isDeletedBySender,
            isDeletedByReceiver: msg.isDeletedByReceiver,
            type: "system",
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          };
        }
        return msg;
      });
    } else {
      // Tin nhắn giữa hai người
      allMsg = await Message.find({
        $or: [
          {
            $and: [
              { "sender._id": sender },
              { "receiver._id": receiver },
              { isDeletedBySender: false },
            ],
          },
          {
            $and: [
              { "sender._id": receiver },
              { "receiver._id": sender },
              { isDeletedByReceiver: false },
            ],
          },
        ],
      });

      allMsg = allMsg.map((msg) => {
        if (msg.isDeleted) {
          return {
            _id: msg._id,
            msg: "Tin nhắn đã được thu hồi",
            sender: msg.sender,
            receiver: msg.receiver,
            isRead: msg.isRead,
            isDeleted: msg.isDeleted,
            isDeletedBySender: msg.isDeletedBySender,
            isDeletedByReceiver: msg.isDeletedByReceiver,
            type: "system",
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          };
        }
        return msg;
      });
    }

    return res.status(200).json({
      EM: "oke allMSg getMsg", //error message
      EC: 0, //error code
      DT: allMsg, // data
    });
  } catch (error) {
    console.log("check getMsg server", error);
    return res.status(500).json({
      EM: "error getMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const recallMsg = async (req, res) => {
  const { id } = req.params; // Lấy ID tin nhắn từ params
  try {
    if (!id) {
      return res.status(400).json({
        EM: "Message ID is required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Cập nhật tin nhắn: đánh dấu là đã bị thu hồi
    const updatedMsg = await Message.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!updatedMsg) {
      return res.status(404).json({
        EM: "Message not found", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    return res.status(200).json({
      EM: "Message recalled successfully", // success message
      EC: 0, // success code
      DT: updatedMsg, // Dữ liệu tin nhắn đã cập nhật
    });
  } catch (error) {
    console.error("Error in recallMsg: ", error);
    return res.status(500).json({
      EM: "Error recalling message", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const deleteMsgForMe = async (req, res) => {
  const { id } = req.params; // Lấy ID tin nhắn từ params
  const member = req.body; // Lấy ID người dùng từ body request

  try {
    if (!id || !member) {
      return res.status(400).json({
        EM: "Message ID and User ID are required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Tìm tin nhắn
    let message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        EM: "Message not found", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Kiểm tra người dùng là người gửi hay người nhận
    if (message.sender._id.toString() === member._id) {
      // Người gửi xóa tin nhắn
      message.isDeletedBySender = true;
    } else if (message.receiver._id.toString() === member._id) {
      // Người nhận xóa tin nhắn

      console.log(message.receiver.members);
      if (Array.isArray(message.receiver.members) && message.receiver.members.length > 2 && member.memberDel) {

        if (!member.memberDel) {
          return res.status(400).json({
            EM: "Invalid member data", // error message
            EC: 1, // error code
            DT: "", // no data
          });
        }

        await Message.updateOne(
          { _id: id },
          { $addToSet: { memberDel: member.memberDel } } 
        );

        message = await Message.findById(id);

      } else {
        // xóa 1 - 1
        message.isDeletedByReceiver = true;
      }
    } else {
      return res.status(403).json({
        EM: "You are not authorized to delete this message", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Lưu thay đổi
    await message.save();

    return res.status(200).json({
      EM: "Message deleted for you successfully", // success message
      EC: 0, // success code
      DT: message, // Dữ liệu tin nhắn đã cập nhật
    });
  } catch (error) {
    console.error("Error in deleteMsgForMe: ", error);
    return res.status(500).json({
      EM: "Error deleting message for you", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const delMsg = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) {
      return res.status(403).json({
        EM: "User id required.", //error message
        EC: 2, //error code
        DT: "", // data
      });
    }
    const delMsg = await Message.findByIdAndDelete(id);

    return res.status(200).json({
      EM: "oke delMsg delMsg", //error message
      EC: 0, //error code
      DT: delMsg, // data
    });
  } catch (error) {
    console.log("check delMsg server", error);
    return res.status(500).json({
      EM: "error delMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const handleReaction = async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!messageId || !userId || !emoji) {
      return res.status(400).json({
        EM: "Missing required fields (messageId, userId, emoji)", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để xử lý logic reaction
    const result = await chatService.handleReaction(messageId, userId, emoji);

    // Trả về kết quả từ service
    return res.status(200).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in handleReaction controller: ", error);
    return res.status(500).json({
      EM: "Error handling reaction", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const getReactionsByMessageId = async (req, res) => {
  try {
    const messageId = req.params.id;

    // Kiểm tra dữ liệu đầu vào
    if (!messageId) {
      return res.status(400).json({
        EM: "Message ID is required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để lấy dữ liệu
    const result = await chatService.getReactionsByMessageId(messageId);

    // Trả về kết quả từ service
    return res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in getReactionsByMessageId controller: ", error);
    return res.status(500).json({
      EM: "Error fetching reactions", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const updatePermission = async (req, res) => {
  try {
    const { groupId, newPermission } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!groupId || !newPermission) {
      return res.status(400).json({
        EM: "Missing required fields (groupId, memberId, newPermission)", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để cập nhật quyền
    const result = await chatService.updatePermission(groupId, newPermission);

    // Trả về kết quả từ service
    return res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in updatePermission controller: ", error);
    return res.status(500).json({
      EM: "Error updating permission", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};
const dissolveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    if (!groupId) {
      return res.status(400).json({
        EM: "Thiếu thông tin nhóm",
        EC: 1,
        DT: "",
      });
    }

    const result = await chatService.dissolveGroup(groupId, userId);
    return  res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.log("check dissolveGroup controller", error);
    return res.status(500).json({
      EM: "Lỗi server khi giải tán nhóm",
      EC: -1,
      DT: "",
    });
  }
};

const getAllPermission = async (req, res) => {
  try {
    // Gọi service để lấy danh sách quyền
    const result = await chatService.getAllPermission();

    // Trả về kết quả từ service
    return res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in getAllPermission controller: ", error);
    return res.status(500).json({
      EM: "Error fetching permissions", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const updateDeputy = async (req, res) => {
  try {
    const { members } = req.body;

    // Gọi service để cập nhật quyền
    const result = await chatService.updateDeputy(members);

    // Trả về kết quả từ service
    return res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in updateDeputy controller: ", error);
    return res.status(500).json({
      EM: "Error updating deputy", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const transLeader = async (req, res) => {
  try {
    const { groupId, newLeaderId } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!groupId || !newLeaderId) {
      return res.status(400).json({
        EM: "Missing required fields (groupId, newLeaderId)", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Gọi service để chuyển quyền trưởng nhóm
    const result = await chatService.transLeader(groupId, newLeaderId);

    // Trả về kết quả từ service
    return res.status(result.EC === 0 ? 200 : 400).json({
      EM: result.EM, // success or error message từ service
      EC: result.EC, // success or error code từ service
      DT: result.DT, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in transLeader controller: ", error);
    return res.status(500).json({
      EM: "Error transferring leader", // error message
      EC: -1, // error code
      DT: "", // no data
    });
  }
};

const removeMemberFromGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const memberId = req.params.memberId;

        const data = await chatService.removeMemberFromGroup(groupId, memberId);

        if (!data || typeof data.EC === "undefined") {
            return res.status(500).json({
                EM: "Unexpected error occurred",
                EC: -1,
                DT: "",
            });
        }

        return res.status(data.EC === 0 ? 200 : 400).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.error("Error in removeMemberFromGroup controller:", err);
        return res.status(500).json({
            EM: "Error removing member from group",
            EC: -1,
            DT: "",
        });
    }
};

module.exports = {
  getConversations,
  getConversationsByMember,
  saveMsg,
  getMsg,
  delMsg,
  createConversationGroup,
  recallMsg,
  deleteMsgForMe,
  handleReaction,
  getReactionsByMessageId,
  updatePermission,
  getAllPermission,
  updateDeputy,
  transLeader,
  removeMemberFromGroup,
  dissolveGroup,
};
