require("dotenv").config();
const RoomChat = require("../models/roomChat");

const uploadProfile = async (data) => {
  try {
    console.log('data ',data);
    
    let user = await RoomChat.findOne({ phone: data.phone });
    if (user) {
      user.avatarN = data.avatar;
      user.username = data.username;
      user.dob = data.dob;
      user.gender = data.gender;
      user.save();
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
