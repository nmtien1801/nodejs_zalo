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

const checkEmailExists = async (emailUser) => {
  let email = await RoomChat.findOne({ email: emailUser });
  if (email) {
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
          gender: user.gender,
          dob: user.dob,
          avatar: user.avatar
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
            gender: user.gender,
            dob: user.dob,
            avatar: user.avatar
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
    let isEmailExists = await checkEmailExists(rawData.email);
    if (isEmailExists) {
      return {
        EM: "your email is already exists",
        EC: 1,
        DT: "",
      };
    }

    let isPhoneExists = await checkPhoneExists(rawData.phoneNumber);
    if (isPhoneExists) {
      return {
        EM: "STK is already exists",
        EC: 1,
        DT: "",
      };
    }

    let newUser = {
      email: rawData.email,
      username: rawData.username,
      password: hashPassWord(rawData.password),
      phone: rawData.phoneNumber,
      gender: rawData.gender,
      dob: rawData.dob,
      avatar: rawData.avatar,
      code: rawData.code
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

const updateCode = async (email, code) => {
  try {
    await RoomChat.updateOne({ email: email }, { $set: { code: code } });

    return {
      EM: "ok",
      EC: 0,
      DT: "",
    };
  } catch (error) {
    console.log(">>>>check Err update code send email: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

const checkEmailLocal = async (email) => {
  try {
    const user = await RoomChat.findOne({ email: email });
    if (user) {
      return {
        EM: "ok",
        EC: 0,
        DT: user,
      };
    }
    return {
      EM: `Email ${email} is not exist in system`,
      EC: 1,
      DT: "",
    };
  } catch (error) {
    console.log(">>>>check Err check email: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

const updatePassword = async (email, password, code) => {
  try {
    const user = await RoomChat.findOne({ email: email, code: code });

    if (user) {
      // update password
      user.password = hashPassWord(password);
      await user.save();

      return {
        EM: "ok",
        EC: 0,
        DT: user,
      };
    }

    return {
      EM: `Code ${code} is incorrect`,
      EC: 1,
      DT: "",
    };
  } catch (error) {
    console.log(">>>>check Err check code: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

const changePassword = async (phone, currentPassword, newPassword) => {
  try {
    const user = await RoomChat.findOne({ phone });

    if (user) {
      let isCorrectPassword = checkPassword(currentPassword, user.password);
      if (isCorrectPassword) {
        // update password
        user.password = hashPassWord(newPassword);
        await user.save();

        return {
          EM: "ok",
          EC: 0,
          DT: user,
        };
      }
      return {
        EM: `currentPassword ${currentPassword} is incorrect`,
        EC: 1,
        DT: "",
      };
    }
  } catch (error) {
    console.log(">>>>check Err changePassword: ", error);
    return {
      EM: "something wrong in service ...",
      EC: -2,
      DT: "",
    };
  }
};

const updateAvatar = async (userId, avatarUrl) => {
  try {
    // Tìm user theo ID
    const user = await RoomChat.findById(userId);

    if (!user) {
      return {
        EM: "User not found", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Cập nhật avatar
    user.avatar = avatarUrl;
    await user.save();

    return {
      EM: "Avatar updated successfully", // success message
      EC: 0, // success code
      DT: user, // trả về thông tin user sau khi cập nhật
    };
  } catch (error) {
    console.log(">>>> Error in updateAvatar: ", error);
    return {
      EM: "Something went wrong in the service", // error message
      EC: -2, // error code
      DT: "", // no data
    };
  }
};

const findUserByPhone = async (phone) => {
  try {
    const user = await RoomChat.findOne({ phone: phone });
    if (user) {
      return {
        EM: "User found", // success message
        EC: 0, // success code
        DT: user, // user data
      };
    }
    return {
      EM: `Phone number ${phone} is not found in the system`, // error message
      EC: 1, // error code
      DT: "", // no data
    };
  } catch (error) {
    console.log(">>>> Error in findUserByPhone: ", error);
    return {
      EM: "Something went wrong in the service", // error message
      EC: -2, // error code
      DT: "", // no data
    };
  }
};



module.exports = {
  handleLogin,
  hashPassWord,
  handleRegister,
  checkEmailLocal,
  updatePassword,
  updateCode,
  changePassword,
  findUserByPhone,
  updateAvatar
};
