const authService = require("../services/authService");
const jwtUtils = require("../services/jwtUtils");
const {
  createJwt,
  createJwt_refreshToken,
} = require("../middleware/jwtAction");
const emailService = require("../services/emailService");

const handleLogin = async (req, res) => {
  try {
    let ip_device =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    let user_agent = req.headers["user-agent"];

    let data = await authService.handleLogin(req.body, ip_device, user_agent);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (error) {
    console.log("check control login", error);
    return res.status(500).json({
      EM: "error from sever", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const handleRegister = async (req, res) => {
  try {
    console.log("check control register", req.body.formData);
    
    if (!req.body.formData.avatar) {
      req.body.formData.avatar = "https://i.imgur.com/cIRFqAL.png";
    }
    let data = await authService.handleRegister(req.body.formData);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (error) {
    console.log("check control register", error);
    return res.status(500).json({
      EM: "error from sever", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const handleLogout = async (req, res) => {
  try {
    
    let refreshToken = req.body.refresh_Token; // Lấy access token từ middleware

    const result = await jwtUtils.handledLogout(refreshToken);

    return res.status(200).json({
      EM: "OK Logout", // success or error message từ service
      EC: 2, 
      DT: {}, // dữ liệu trả về từ service
    });
  } catch (error) {
    console.error("Error in handleLogout: ", error);
    return res.status(500).json({
      EM: "Something went wrong", // error message
      EC: -2, // error code
      DT: "", // no data
    });
  }
};

const getUserAccount = async (req, res) => {
  // setTimeout(() => {
  try {
    // req lấy từ jwtAction.js
    return res.status(200).json({
      EM: "ok fetch context",
      EC: 0,
      DT: {
        _id: req.user._id,
        access_Token: req.access_Token,
        email: req.user.email,
        username: req.user.username,
        phone: req.user.phone,
        roleID: req.user.roleID,
        gender: req.user.gender,
        dob: req.user.dob,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.log("err get user account: ", error);
    return res.status(500).json({
      EM: "error from sever", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
  // }, 1000);
};

  // get user by phone number
  // @route GET /api/user/:phone
  const getUserByPhone = async (req, res) => {
    try {
      const { phone } = req.params;

      if (!phone) {
        return res.status(400).json({
          EM: "Phone number is required", // error message
          EC: 1, // error code
          DT: "", // data
        });
      }

      const user = await authService.findUserByPhone(phone);

      if (!user) {
        return res.status(404).json({
          EM: "User not found", // error message
          EC: 1, // error code
          DT: "", // data
        });
      }

      return res.status(200).json({
        EM: "User found", // success message
        EC: 0, // success code
        DT: user, // user data
      });
    } catch (error) {
      console.error("Error in getUserByPhone: ", error);
      return res.status(500).json({
        EM: "Error from server", // error message
        EC: -1, // error code
        DT: "", // data
      });
    }
  };

  

const handleRefreshToken = async (req, res) => {
  try {
    let refreshToken = req.body.refresh_Token;
    let newAccessToken = "";
    let newRefreshToken = "";

    // tìm db user có refreshToken
    let user = await jwtUtils.getUserByRefreshToken(refreshToken);

    if (user) {
      // create access_Token -> sửa res.DT(service) trong lần check thứ 1
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
      newAccessToken = createJwt(payload);

      newRefreshToken = createJwt_refreshToken(payload);
      await jwtUtils.updateUserRefreshToken(
        refreshToken,
        newAccessToken,
        newRefreshToken
      );
    }

    return res.status(200).json({
      EM: "ok handleRefreshToken", //error message
      EC: 2, //error code
      DT: {
        newAccessToken,
        newRefreshToken,
        user,
      },
    });
  } catch (error) {
    console.log("check control handleRefreshToken", error);
    return res.status(500).json({
      EM: "error from sever handleRefreshToken", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const sendCode = async (req, res) => {
  try {
    let email = req.body.email;

    let checkEmailLocal = await authService.checkEmailLocal(req.body.email);

    if (checkEmailLocal.EC !== 0) {
      return res.status(400).json({
        EM: checkEmailLocal.EM,
        EC: checkEmailLocal.EC,
        DT: "",
      });
    }

    let code = await emailService.sendSimpleEmail(email); // gửi mail -> lấy code
    await authService.updateCode(email, code); // khi nhận đc mail lập tức update code vào DB

    return res.status(200).json({
      EM: "ok",
      EC: 0,
      DT: { email: email },
    });
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({
      EM: "error from server",
      EC: -1,
      DT: "",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    let email = req.body.email;
    let code = req.body.code;
    let password = req.body.password;

    let user = await authService.updatePassword(email, password, code);
    if (user.EC !== 0) {
      return res.status(401).json({
        EM: user.EM,
        EC: user.EC,
        DT: "",
      });
    }

    return res.status(200).json({
      EM: "ok",
      EC: 0,
      DT: "",
    });
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({
      EM: "error from server",
      EC: -1,
      DT: "",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    let phone = req.body.phone;
    let currentPassword = req.body.currentPassword;
    let newPassword = req.body.newPassword;

    let user = await authService.changePassword(
      phone,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      EM: user.EM,
      EC: user.EC,
      DT: "",
    });
  } catch (error) {
    console.error("Error changePassword: ", error);
    return res.status(500).json({
      EM: "error from server",
      EC: -1,
      DT: "",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    let email = req.body.email;

    let code = await emailService.sendSimpleEmail(email); // gửi mail -> lấy code, time

    return res.status(200).json({
      EM: "ok",
      EC: 0,
      DT: code,
    });
  } catch (error) {
    console.error("Error verifyEmail: ", error);
    return res.status(500).json({
      EM: "error verifyEmail from server",
      EC: -1,
      DT: "",
    });
  }
};


module.exports = {
  handleLogin,
  handleRegister,
  handleLogout,
  getUserAccount,
  handleRefreshToken,
  sendCode,
  resetPassword,
  changePassword,
  verifyEmail,
  getUserByPhone,
};
