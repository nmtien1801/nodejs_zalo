const authService = require("../services/authService");

const handleLogin = async (req, res) => {
  try {
    let data = await authService.handleLogin(req.body);

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
          access_Token: req.access_Token,
          // refresh_Token: req.refresh_Token,
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
}

module.exports = {
  handleLogin,
  handleRegister,
  getUserAccount
};
