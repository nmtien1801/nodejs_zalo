const db = require("../sequelize/models/index");
const { Op } = require("sequelize");
require("dotenv").config();
// SEARCH: sequelize

const getRefreshTokenByAccessToken = async (accessToken) => {
  let session = await db.Session.findOne({
    where: {
      access_Token: accessToken,
    },
  });

  if (session) {
    return session.refresh_Token;
  }
  return null;
};

const getUserByRefreshToken = async (refreshToken) => {
  try {
    let user = await db.Session.findOne({
      where: {
        refresh_Token: refreshToken,
      },
      include: [
        {
          model: db.Account,
          attributes: ["email", "username", "phone", "roleID"],
        },
      ],
    });
    if (user) {
      return {
        email: user.Account.email,
        phone: user.Account.phone,
        username: user.Account.username,
        roleID: user.Account.roleID,
      };
    }
    return null;
  } catch (error) {
    console.log(">>>>check Err getUserByRefreshToken: ", error);
    return null;
  }
};

const updateUserRefreshToken = async (
  refreshToken,
  newAccessToken,
  newRefreshToken
) => {
  try {
    await db.Session.update(
      {
        refresh_Token: newRefreshToken,
        access_Token: newAccessToken,
      },
      {
        where: {
          refresh_Token: refreshToken,
        },
      }
    );
    return {
      EM: "ok updateUserRefreshToken",
      EC: 0,
      DT: "",
    };
  } catch (error) {
    console.log(">>>>check Err updateUserRefreshToken: ", error);
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
