const bcrypt = require("bcryptjs");
const {
  createJwt,
  createJwt_refreshToken,
} = require("../middleware/jwtAction");
require("dotenv").config();
const RoomChat = require("../models/roomChat");
const Session = require("../models/session");
const Conversation = require("../models/conversation");

//Thư viện cho khởi tạo QR code
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

//Object temp lưu trữ QR cần xác thực
const pendingQRSessions = {};

//Tạo QR Login
const generateQRLoginToken = async () => {
  try {
    // Tạo một mã QR session duy nhất
    const qrSessionId = uuidv4();
    
    // Tạo token cho QR code với thời gian hết hạn ngắn (2 phút)
    const qrToken = jwt.sign(
      { sessionId: qrSessionId, type: 'qr_login' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '120s' }
    );
    
    // Lưu session vào bộ nhớ tạm với trạng thái chờ
    pendingQRSessions[qrSessionId] = {
      status: 'pending', // pending, confirmed, expired
      createdAt: new Date(),
      user: null,
      deviceInfo: null
    };

    // Thiết lập thời gian hết hạn cho session (2 phút)
    setTimeout(() => {
      if (pendingQRSessions[qrSessionId] && 
          pendingQRSessions[qrSessionId].status === 'pending') {
        pendingQRSessions[qrSessionId].status = 'expired';
      }
    }, 120000);

    return {
      EM: "QR login token generated successfully",
      EC: 0,
      DT: {
        qrToken,
        sessionId: qrSessionId
      }
    };
  } catch (error) {
    console.log("Error generating QR login token:", error);
    return {
      EM: "Error generating QR login token",
      EC: -2,
      DT: ""
    };
  }
};

//Xác thực QR Code
const verifyQRLogin = async (qrToken, userId, deviceInfo) => {
  try {
    // Xác thực token QR
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.sessionId || decoded.type !== 'qr_login') {
      return {
        EM: "Invalid QR token",
        EC: 1,
        DT: ""
      };
    }

    const qrSessionId = decoded.sessionId;
    const session = pendingQRSessions[qrSessionId];

    // Kiểm tra xem session có tồn tại và còn hiệu lực không
    if (!session) {
      return {
        EM: "QR session not found",
        EC: 1,
        DT: ""
      };
    }

    if (session.status === 'expired') {
      return {
        EM: "QR session has expired",
        EC: 1,
        DT: ""
      };
    }

    if (session.status === 'confirmed') {
      return {
        EM: "QR session already used",
        EC: 1,
        DT: ""
      };
    }

    // Tìm user từ userId
    const user = await RoomChat.findById(userId);
    if (!user) {
      return {
        EM: "User not found",
        EC: 1,
        DT: ""
      };
    }

    // Lưu thông tin user và thiết bị vào session
    pendingQRSessions[qrSessionId].status = 'confirmed';
    pendingQRSessions[qrSessionId].user = user;
    pendingQRSessions[qrSessionId].deviceInfo = deviceInfo || {
      device: "Unknown", 
      ip: "Unknown"
    };

    console.log("QR Sessions:", pendingQRSessions);

    console.log("Data:",{
      EM: "QR login verified successfully",
      EC: 0,
      DT: {
        sessionId: qrSessionId
      }
    });

    return {
      EM: "QR login verified successfully",
      EC: 0,
      DT: {
        sessionId: qrSessionId
      }
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        EM: "QR token has expired",
        EC: 1,
        DT: ""
      };
    }
    
    console.log("Error verifying QR login:", error);
    return {
      EM: "Error verifying QR login",
      EC: -2,
      DT: ""
    };
  }
};

//Xác thực QR
const checkQRSessionStatus = async (sessionId) => {
  try {
    const session = pendingQRSessions[sessionId];
    
    if (!session) {
      return {
        EM: "QR session not found",
        EC: 1,
        DT: ""
      };
    }

    // Nếu session đã được xác nhận, tạo token đăng nhập
    if (session.status === 'confirmed' && session.user) {
      const user = session.user;
      const deviceInfo = session.deviceInfo || {};

      // Tạo payload và token như đăng nhập thông thường
      let payload = {
        _id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        roleID: user.roleID,
        gender: user.gender,
        dob: user.dob,
        avatar: user.avatar,
      };
      
      let token = createJwt(payload);
      let tokenRefresh = createJwt_refreshToken(payload);

      // Tạo session với refreshToken
      let newSession = new Session({
        roomChatID: user._id,
        access_Token: token,
        refresh_Token: tokenRefresh,
        ip_device: deviceInfo.ip || "QR Login",
        user_agent: deviceInfo.device || "QR Login Device",
      });

      await newSession.save();

      // Xóa khỏi pendingQRSessions sau khi đã xử lý
      delete pendingQRSessions[sessionId];

      return {
        EM: "QR login successful",
        EC: 0,
        DT: {
          _id: user._id,
          access_Token: token,
          refresh_Token: tokenRefresh,
          email: user.email,
          phone: user.phone,
          username: user.username,
          roleID: user.roleID,
          gender: user.gender,
          dob: user.dob,
          avatar: user.avatar,
          status: session.status
        }
      };
    }

    // Nếu chưa được xác nhận, trả về trạng thái hiện tại
    return {
      EM: `QR session status: ${session.status}`,
      EC: 0,
      DT: {
        status: session.status
      }
    };
  } catch (error) {
    console.log("Error checking QR session status:", error);
    return {
      EM: "Error checking QR session status",
      EC: -2,
      DT: ""
    };
  }
};

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
          avatar: user.avatar,
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
            avatar: user.avatar,
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
      code: rawData.code,
    };

    // Tạo tài khoản mới trong MongoDB
    let user = new RoomChat(newUser);
    await user.save();

    // ✅ Tạo cloud
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    const formattedTime = `${day}/${month}/${year}`;

    const newConversation = new Conversation({
      sender: {
        _id: user._id,
      },
      receiver: {
        _id: user._id,
        username: "Cloud của tôi",
        phone: user.phone,
        permission: [1, 2, 3, 4, 5], // hoặc bạn lấy từ user nếu có
      },
      message: "Chào mừng bạn đến với Zata", // bạn có thể thay đổi nội dung
      time: Date.now(),
      startTime: Date.now(),
      avatar: user.avatar,
      members: [user._id, user._id],
      type: 3, // cloud
      role: "leader",
    });
    await newConversation.save();

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
  updateAvatar,
  generateQRLoginToken,
  verifyQRLogin,
  checkQRSessionStatus
};
