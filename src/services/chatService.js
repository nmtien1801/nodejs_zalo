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
    console.log("check getConversations service", err);
    return res.status(500).json({
      EM: "error getConversations service", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

module.exports = {
  getConversations,
};
