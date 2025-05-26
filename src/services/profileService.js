require("dotenv").config();
const RoomChat = require("../models/roomChat");
const Conversation = require("../models/conversation");

const uploadProfile = async (data) => {
  try {
    console.log("data ", data);

    let user = await RoomChat.findOne({ phone: data.phone });
    if (user) {
      user.avatar = data.avatar;
      user.username = data.username;
      user.dob = data.dob;
      user.gender = data.gender;
      user.save();
    }

    let conversation = await Conversation.find({
      "receiver._id": data.userId,
    });
    
    if (conversation && conversation.length > 0) {
      for (let item of conversation) {
        item.receiver.username = data.username;

        await item.save();
      }
    }

    return {
      EM: "Avatar uploaded successfully",
      EC: 0,
      DT: user,
    };
  } catch (err) {
    console.error("uploadProfile error:", err);
    return {
      EM: "Error uploadProfile",
      EC: -1,
      DT: "",
    };
  }
};

module.exports = {
  uploadProfile,
};
