require("dotenv").config();
const Session = require("../models/session"); 
const Account = require("../models/account"); 

const getRefreshTokenByAccessToken = async (accessToken) => {
  try {
    let session = await Session.findOne({ access_Token: accessToken });
    
    if (session) {
      return session.refresh_Token;
    }
    return null;
  } catch (error) {
    console.log(">>>> Error in getRefreshTokenByAccessToken: ", error);
    return null;
  }
};




const getUserByRefreshToken = async (refreshToken) => {
  try {
    let user = await Session.findOne({ refresh_Token: refreshToken })
      .populate({
        path: "user", // Đảm bảo rằng bạn đã có trường user là ObjectId tham chiếu đến Account
        select: "email username phone roleID",  // Chỉ lấy những trường cần thiết
      });

    if (user) {
      return {
        email: user.user.email,
        phone: user.user.phone,
        username: user.user.username,
        roleID: user.user.roleID,
      };
    }
    return null;
  } catch (error) {
    console.log(">>>> Error in getUserByRefreshToken: ", error);
    return null;
  }
};


const updateUserRefreshToken = async (refreshToken, newAccessToken, newRefreshToken) => {
  try {
    await Session.updateOne(
      { refresh_Token: refreshToken },
      {
        $set: {
          access_Token: newAccessToken,
          refresh_Token: newRefreshToken,
        },
      }
    );
    return {
      EM: "ok updateUserRefreshToken",
      EC: 0,
      DT: "",
    };
  } catch (error) {
    console.log(">>>> Error in updateUserRefreshToken: ", error);
    return {
      EM: "something wrong in updateUserRefreshToken service ...",
      EC: -2,
      DT: "",
    };
  }
};

module.exports = {
  getRefreshTokenByAccessToken,
  getUserByRefreshToken,
  updateUserRefreshToken,
};
