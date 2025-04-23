
const roomChatService = require('../services/roomChatService');

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
        console.log('check getRoomChatByPhone server', err);
        return res.status(500).json({
            EM: 'error getRoomChatByPhone', //error message 
            EC: 2, //error code
            DT: '', // data
        });
    }
}

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

module.exports = {
    getRoomChatByPhone,
    getRoomChatByUsername,
}