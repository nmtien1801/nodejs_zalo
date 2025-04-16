require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../models/message");
const Conversation = require("../models/conversation");
const ReactionMessage = require("../models/reactionMessage");

const getConversations = async (senderId) => {
  try {
    // lấy ds Conversation
    const conversations = await Conversation.find({
      "sender._id": senderId,
    });

    return {
      EM: "ok! getConversations",
      EC: 0,
      DT: conversations,
    };
  } catch (error) {
    console.log("check getConversations service", error);
    return res.status(500).json({
      EM: "error getConversations service", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const createConversationGroup = async (nameGroup, avatarGroup, members) => {
  try {
    const conversation = await Conversation.create({
      sender: {
        _id: members[0]._id,
      },
      receiver: {
        _id: members[1]._id,
      },
      members: members,
      name: nameGroup,
      avatar: avatarGroup,
      message: "Bắt đầu cuộc trò chuyện mới",
      time: Date.now(),
      type: "2"
    });

    return {
      EM: "ok! createConversationGroup",
      EC: 0,
      DT: conversation,
    };
  } catch (error) {
    console.log("check createConversationGroup service", error);
    return {
      EM: "error createConversationGroup service", // error message
      EC: 2, // error code
      DT: "", // no data
    };
  }
}

const getReactionsByMessageId = async (messageId) => {
  try {
    if (!messageId) {
      return {
        EM: "Message ID is required", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return {
        EM: "Invalid messageId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Lấy tất cả reaction của messageId
    const reactions = await ReactionMessage.find({ messageId }).populate({
      path: "userId",
      select: "_id username avatar", // Chỉ lấy các trường cần thiết của user
    });

    return {
      EM: "Reactions fetched successfully", // success message
      EC: 0, // success code
      DT: reactions, // Dữ liệu các reaction
    };
  } catch (error) {
    console.error("Error in getReactionsByMessageId: ", error);
    return {
      EM: "Error fetching reactions", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const handleReaction = async (messageId, userId, emoji) => {
  try {
    if (!messageId || !userId || !emoji) {
      return {
        EM: "Missing required fields (messageId, userId, emoji)", // error message
        EC: 1, // error code
        DT: messageId + ", " + userId + ", " + emoji, // no data
      };
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return {
        EM: "Invalid messageId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Kiểm tra xem người dùng đã reaction cho tin nhắn này chưa
    const existingReaction = await ReactionMessage.findOne({ messageId, userId });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Nếu emoji giống nhau, xóa reaction
        try {
          await ReactionMessage.findByIdAndDelete(existingReaction._id);
          return {
            EM: "Reaction removed successfully", // success message
            EC: 0, // success code
            DT: null, // Không trả về dữ liệu
          };
        } catch (error) {
          console.error("Error deleting reaction: ", error);
          return {
            EM: "Error deleting reaction", // error message
            EC: -1, // error code
            DT: "", // no data
          };
        }
      } else {
        // Nếu emoji khác nhau, cập nhật reaction
        existingReaction.emoji = emoji;
        await existingReaction.save();
        return {
          EM: "Reaction updated successfully", // success message
          EC: 0, // success code
          DT: existingReaction, // Trả về reaction đã cập nhật
        };
      }
    } else {
      // Nếu chưa có reaction, thêm mới
      const newReaction = await ReactionMessage.create({ messageId, userId, emoji });
      return {
        EM: "Reaction added successfully", // success message
        EC: 0, // success code
        DT: newReaction, // Trả về reaction vừa thêm
      };
    }
  } catch (error) {
    console.error("Error in handleReaction: ", error);
    return {
      EM: "Error handling reaction", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

module.exports = {
  getConversations,
  createConversationGroup,
  handleReaction,
  getReactionsByMessageId
};
