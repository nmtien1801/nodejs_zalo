const chatService = require("../services/chatService");
const Message = require("../models/message");

const getConversations = async (req, res) => {
  try {
    const { senderId } = req.params;
    let data = await chatService.getConversations(senderId);

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

const createConversationGroup = async (req, res) => {
  try {
    const { nameGroup, avatarGroup, members } = req.body; // Lấy dữ liệu từ body request

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

    let data = await chatService.createConversationGroup(nameGroup, avatarGroup, members);

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
        phone: data.sender.phone,
      },
      receiver: {
        _id: data.receiver._id,
        name: data.receiver.username,
        phone: data.receiver.phone,
      },
      isRead: false,
      isDeleted: false,
      isDeletedBySender: false,
      isDeletedByReceiver: false,
      type: data.type || "1",    // 1 - text , 2 - image, 3 - video, 4 - file, 5 - icon
    };

    const saveMsg = new Message(_data);
    await saveMsg.save();

    return saveMsg;
  } catch (error) {
    console.log(">>>> check saveMsg server", error);
    return res.status(500).json({
      EM: "error saveMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
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
        isDeleted: false,
      });
    } else {
      // Tin nhắn giữa hai người
      allMsg = await Message.find({
        $or: [
          { 
            $and: [
              { "sender._id": sender }, 
              { "receiver._id": receiver },
              { isDeletedBySender: false }
            ] 
          },
          { 
            $and: [
              { "sender._id": receiver },
              { "receiver._id": sender },
              { isDeletedByReceiver: false }
            ] 
          },
        ]
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
  const { userId } = req.body; // Lấy ID người dùng từ body request
  try {
    if (!id || !userId) {
      return res.status(400).json({
        EM: "Message ID and User ID are required", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Tìm tin nhắn
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        EM: "Message not found", // error message
        EC: 1, // error code
        DT: "", // no data
      });
    }

    // Kiểm tra người dùng là người gửi hay người nhận
    if (message.sender._id.toString() === userId) {
      // Người gửi xóa tin nhắn
      message.isDeletedBySender = true;
    } else if (message.receiver._id.toString() === userId) {
      // Người nhận xóa tin nhắn
      message.isDeletedByReceiver = true;
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

module.exports = {
  getConversations,
  saveMsg,
  getMsg,
  delMsg,
  createConversationGroup,
  recallMsg,
  deleteMsgForMe
};
