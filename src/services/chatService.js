require("dotenv").config();
const Message = require("../models/message");
const Conversation = require("../models/conversation");

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

module.exports = {
  getConversations,
  createConversationGroup
};
