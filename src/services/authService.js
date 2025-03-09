const db = require("../sequelize/models/index");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { createJwt } = require("../middleware/jwtAction");
require("dotenv").config();
// SEARCH: sequelize

const checkPhoneExists = async (userPhone) => {
  let phone = await db.Account.findOne({
    where: { phone: userPhone },
  });
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

const handleLogin = async (rawData) => {
  try {
    // search: sequelize Op.or
    let user = await db.Account.findOne({
      where: {
        phone: rawData.phoneNumber,
      },
    });

    if (user) {
      let isCorrectPassword = checkPassword(rawData.password, user.password);

      // không bị lỗi
      if (isCorrectPassword === true) {
        let payload = {
          email: user.email,
          username: user.username,
          phone: user.phone,
          roleID: user.roleID, // chức vụ
        };
        let token = createJwt(payload);
        let tokenRefresh = createJwt(payload);

        return {
          EM: "ok!",
          EC: 0,
          DT: {
            _id: user.id,
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
      roleID: rawData.roleID,
    };

    let user = await db.Account.create(newUser);
    if (user) {
      return {
        EM: "register success",
        EC: 0,
        DT: {},
      };
    }
    return {
      EM: "register failed",
      EC: 1,
      DT: "",
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
