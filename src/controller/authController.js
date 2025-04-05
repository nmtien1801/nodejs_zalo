const authService = require("../services/authService");
const jwtUtils = require("../services/jwtUtils");
const {
  createJwt,
  createJwt_refreshToken,
} = require("../middleware/jwtAction");

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
        user
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

module.exports = {
  handleLogin,
  handleRegister,
  getUserAccount,
  handleRefreshToken,
};
