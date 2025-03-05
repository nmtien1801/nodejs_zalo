const authService = require("../services/authService");

const handleLogin = async (req, res) => {
  try {
    let data = await authService.handleLogin(req.body);
    // set cookie chứa refreshToken -> còn access_token lưu trong localStorage(FE)
    // if (data && data.DT.access_token) {
    //   res.cookie("jwt", data.DT.access_token, {
    //     httpOnly: true,
    //     // secure: true,
    //     maxAge: 60 * 60 * 1000,
    //     sameSite: "strict", // ngăn chặn(CSOS) request từ các trang web khác
    //   });
    // }

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

module.exports = {
  handleLogin,
};
