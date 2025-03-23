const bcrypt = require("bcryptjs");
const {
  createJwt,
  createJwt_refreshToken,
} = require("../middleware/jwtAction");
require("dotenv").config();
const RoomChat = require("../models/roomChat");
const Session = require("../models/session");


const checkPhoneExists = async (userPhone) => {
  let phone = await RoomChat.findOne({ phone: userPhone });
  if (phone) {
    return true;
  }
  return false;
};

// hash password
const salt = bcrypt.genSaltSync(10);
const hashPassWord = (userPassWord) => {
  return bcrypt.hashSync(userPassWord, salt);
};

const checkPassword = (userPassWord, hashPassWord) => {
  return bcrypt.compareSync(userPassWord, hashPassWord); // true or false
};

const handleLogin = async (rawData, ip_device, user_agent) => {
  try {
    // Tìm tài khoản bằng số điện thoại
    let user = await RoomChat.findOne({ phone: rawData.phoneNumber });

    if (user) {
      let isCorrectPassword = checkPassword(rawData.password, user.password);

      // Kiểm tra mật khẩu đúng hay sai
      if (isCorrectPassword) {
        let payload = {
          _id: user._id,
          email: user.email,
          username: user.username,
          phone: user.phone,
          roleID: user.roleID, // chức vụ
        };
        let token = createJwt(payload);
        let tokenRefresh = createJwt_refreshToken(payload);

        // Tạo session với refreshToken
        let newSession = new Session({
          roomChatID: user._id,
          access_Token: token,
          refresh_Token: tokenRefresh,
          ip_device: ip_device,
          user_agent: user_agent,
        });

        await newSession.save();

        return {
          EM: "ok!",
          EC: 0,
          DT: {
            _id: user._id,
            access_Token: token,
            refresh_Token: tokenRefresh,
            email: user.email,
            phone: user.phone,
            username: user.username,
            roleID: user.roleID, // chức vụ
          },
        };
      }
    }
    return {
      EM: "your email | phone or password is incorrect",
      EC: 1,
      DT: "",
    };
  } catch (error) {
    console.log(">>>>check Err Login user: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

const handleRegister = async (rawData) => {
  try {
    let isPhoneExists = await checkPhoneExists(rawData.phoneNumber);
    if (isPhoneExists) {
      return {
        EM: "your phone is already exists",
        EC: 1,
        DT: "",
      };
    }

    let newUser = {
      email: rawData.email,
      username: rawData.username,
      password: hashPassWord(rawData.password),
      phone: rawData.phoneNumber,
    };

    // Tạo tài khoản mới trong MongoDB
    let user = new RoomChat(newUser);
    await user.save();

    return {
      EM: "register success",
      EC: 0,
      DT: {},
    };
  } catch (error) {
    console.log(">>>>check Err Register user: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

module.exports = {
  handleLogin,
  hashPassWord,
  handleRegister,
};
