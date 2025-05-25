const chatService = require("../services/chatService");
const Message = require("../models/message");
const Conversation = require("../models/conversation");
const { OpenAI } = require("openai");
require("dotenv").config();

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
        members: data.receiver.members
      },
      isRead: false,
      readBy: [data.sender._id],
      isDeleted: false,
      isDeletedBySender: false,
      isDeletedByReceiver: false,
      type: data.type || "text", // 1 - text , 2 - image, 3 - video, 4 - file, 5 - icon
    };

    const saveMsg = new Message(_data);
    await saveMsg.save();

    // update conversation - message, time
    const conversations = await Conversation.find({
      $or: [
        {
          "sender._id": data.sender._id,
          "receiver._id": data.receiver._id,
        },
        {
          "sender._id": data.receiver._id,
          "receiver._id": data.sender._id,
        },
      ],
    });

    if (conversations && conversations.length > 0) {
      for (let conversation of conversations) {
        conversation.message = data.msg;
        conversation.time = Date.now(); // Cập nhật thời gian với giá trị hiện tại
        await conversation.save(); // Lưu lại từng cuộc trò chuyện
      }
    }

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

    // Thêm tham số phân trang
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let skip = (page - 1) * limit;

    if (!sender || !receiver) {
      return res.status(403).json({
        EM: "User id required.", //error message
        EC: 2, //error code
        DT: "", // data
      });
    }

    // Lấy thông tin receiver để có avatar
    let senderInfo = await require('../models/roomChat').findById(receiver);

    const senderAvatar = senderInfo?.avatar || "https://i.imgur.com/l5HXBdTg.jpg";

    let allMsg = [];
    let totalMessages = 0;

    if (+type === 2) {

      // Đếm tổng số tin nhắn nhóm
      totalMessages = await Message.countDocuments({
        "receiver._id": receiver,
        memberDel: { $ne: sender },
      });

      // Tin nhắn nhóm
      allMsg = await Message.find({
        "receiver._id": receiver,
        memberDel: { $ne: sender },
      })
      .sort({ createdAt: -1 })  // Sắp xếp từ mới đến cũ
      .skip(skip)
      .limit(limit);

      // Đảo ngược để tin nhắn cũ hiển thị trước
      allMsg = allMsg.reverse();

      allMsg = allMsg.map((msg) => {

        const updatedMsg = msg.toObject();
        updatedMsg.sender.avatar = senderAvatar;

        if (msg.isDeleted) {
          return {
            _id: msg._id,
            msg: "Tin nhắn đã được thu hồi",
            sender: updatedMsg.sender,
            receiver: msg.receiver,
            isRead: msg.isRead,
            readBy: msg.readBy || [],
            isDeleted: msg.isDeleted,
            isDeletedBySender: msg.isDeletedBySender,
            isDeletedByReceiver: msg.isDeletedByReceiver,
            type: "system",
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          };
        }
        return updatedMsg;
      });
    } else {

      // Đếm tổng số tin nhắn 1-1
      totalMessages = await Message.countDocuments({
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
      })
      .sort({ createdAt: -1 })  // Sắp xếp từ mới đến cũ
      .skip(skip)
      .limit(limit);

      // Đảo ngược để tin nhắn cũ hiển thị trước
      allMsg = allMsg.reverse();

      allMsg = allMsg.map((msg) => {

        // Thêm avatar vào sender
        const updatedMsg = msg.toObject();
        updatedMsg.sender.avatar = senderAvatar;

        if (msg.isDeleted) {
          return {
            _id: msg._id,
            msg: "Tin nhắn đã được thu hồi",
            sender: updatedMsg.sender,
            receiver: msg.receiver,
            isRead: msg.isRead,
            readBy: msg.readBy || [],
            isDeleted: msg.isDeleted,
            isDeletedBySender: msg.isDeletedBySender,
            isDeletedByReceiver: msg.isDeletedByReceiver,
            type: "system",
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          };
        }
        return updatedMsg;
      });
    }

    const pagination = {
      page,
      limit,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: skip + limit < totalMessages
    };

    return res.status(200).json({
      EM: "oke allMSg getMsg", //error message
      EC: 0, //error code
      DT: allMsg, // data
      pagination // thông tin phân trang
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
      if (
        Array.isArray(message.receiver.members) &&
        message.receiver.members.length > 2 &&
        member.memberDel
      ) {
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
    return res.status(result.EC === 0 ? 200 : 400).json({
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const chatGPTResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Bạn là một người trợ lý ảo thân thiện, vui vẻ, nói chuyện tự nhiên như một người bạn trên Facebook Messenger. Hãy trả lời ngắn gọn, dễ hiểu, đôi khi thêm biểu cảm hoặc emoji nếu phù hợp.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Error in chatGPTResponse controller:", err);
    return res.status(500).json({
      EM: "Error chatGPTResponse",
      EC: -1,
      DT: "",
    });
  }
};

// Đánh dấu một tin nhắn là đã đọc
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        EM: "Message ID is required",
        EC: 1,
        DT: "",
      });
    }

    // Tìm tin nhắn theo ID
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        EM: "Message not found",
        EC: 1,
        DT: "",
      });
    }
    
    // Nếu người dùng không phải người gửi và chưa được đánh dấu là đã đọc
    if (message.sender._id.toString() !== userId.toString() && 
        !message.readBy.includes(userId)) {
      
      // Thêm người dùng vào danh sách đã đọc
      message.readBy.push(userId);
      
      // Nếu là chat 1-1, đánh dấu là đã đọc
      if (!message.receiver.members || message.receiver.members.length <= 0) {
        message.isRead = true;
      } 
      // Nếu là chat nhóm, kiểm tra xem tất cả thành viên đã đọc chưa
      else {
        const membersExceptSender = message.receiver.members.filter(
          m => m.toString() !== message.sender._id.toString()
        );
        
        if (message.readBy.length >= membersExceptSender.length) {
          message.isRead = true;
        }
      }
      
      await message.save();
    }
    
    return res.status(200).json({
      EM: "Message marked as read",
      EC: 0,
      DT: message,
    });
  } catch (error) {
    console.error("Error in markMessageAsRead:", error);
    return res.status(500).json({
      EM: "Error marking message as read",
      EC: -1,
      DT: "",
    });
  }
};

// Đánh dấu tất cả tin nhắn trong cuộc trò chuyện là đã đọc
const markAllMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Tìm và cập nhật tất cả tin nhắn chưa đọc
    const result = await Message.updateMany(
      {
        "receiver._id": conversationId,
        "sender._id": { $ne: userId.toString() }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    // Cũng đánh dấu isRead = true cho các tin nhắn 1-1
    await Message.updateMany(
      {
        "receiver._id": conversationId,
        "sender._id": { $ne: userId.toString() },
        "receiver.members": { $exists: false }
      },
      {
        isRead: true
      }
    );

    return res.status(200).json({
      EM: "All messages marked as read",
      EC: 0,
      DT: { updatedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error in markAllMessagesAsRead:", error);
    return res.status(500).json({
      EM: "Error marking all messages as read",
      EC: -1,
      DT: "",
    });
  }
};

// Xuất tin nhắn cũ hơn
const getOlderMessages = async (req, res) => {
  try {
    let sender = req.params.sender;
    let receiver = req.params.receiver;
    let type = req.params.type;
    let lastMessageId = req.query.lastMessageId;
    let limit = parseInt(req.query.limit) || 20;

    if (!sender || !receiver || !lastMessageId) {
      return res.status(400).json({
        EM: "Missing required parameters", 
        EC: 1,
        DT: "",
      });
    }

    // Lấy thông tin thời gian của tin nhắn cuối cùng
    const lastMessage = await Message.findById(lastMessageId);
    if (!lastMessage) {
      return res.status(404).json({
        EM: "Last message not found", 
        EC: 1,
        DT: "",
      });
    }

    // Lấy thông tin receiver để có avatar
    let senderInfo = await require('../models/roomChat').findById(receiver);
    const senderAvatar = senderInfo?.avatar || "https://i.imgur.com/l5HXBdTg.jpg";

    let query = {};
    if (+type === 2) {
      // Tin nhắn nhóm
      query = {
        "receiver._id": receiver,
        memberDel: { $ne: sender },
        createdAt: { $lt: lastMessage.createdAt }
      };
    } else {
      // Tin nhắn giữa hai người
      query = {
        $or: [
          {
            $and: [
              { "sender._id": sender },
              { "receiver._id": receiver },
              { isDeletedBySender: false },
              { createdAt: { $lt: lastMessage.createdAt } }
            ],
          },
          {
            $and: [
              { "sender._id": receiver },
              { "receiver._id": sender },
              { isDeletedByReceiver: false },
              { createdAt: { $lt: lastMessage.createdAt } }
            ],
          },
        ],
      };
    }

    // Lấy tin nhắn cũ hơn và giới hạn số lượng
    let olderMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Xử lý dữ liệu
    olderMessages = olderMessages.map((msg) => {
      const updatedMsg = msg.toObject();
      updatedMsg.sender.avatar = senderAvatar;

      if (msg.isDeleted) {
        return {
          _id: msg._id,
          msg: "Tin nhắn đã được thu hồi",
          sender: updatedMsg.sender,
          receiver: msg.receiver,
          isRead: msg.isRead,
          readBy: msg.readBy || [],
          isDeleted: msg.isDeleted,
          isDeletedBySender: msg.isDeletedBySender,
          isDeletedByReceiver: msg.isDeletedByReceiver,
          type: "system",
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        };
      }
      return updatedMsg;
    });

    // Đảo ngược lại để đúng thứ tự thời gian
    olderMessages = olderMessages.reverse();

    return res.status(200).json({
      EM: "Older messages fetched successfully", 
      EC: 0,
      DT: olderMessages,
      hasMore: olderMessages.length === limit // Kiểm tra còn tin nhắn để tải không
    });

  } catch (error) {
    console.log("Error in getOlderMessages:", error);
    return res.status(500).json({
      EM: "Server error", 
      EC: 2,
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
  chatGPTResponse,
  markMessageAsRead,
  markAllMessagesAsRead,
  getOlderMessages
};
