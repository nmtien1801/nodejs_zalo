const jwt = require("jsonwebtoken");
const jwtUtils = require("../services/jwtUtils");
require("dotenv").config();

const createJwt = (payload) => {
  //   let token = jwt.sign({ name: "Tien", address: "HCM" }, process.env.JWT_SECRET);
  let key = process.env.JWT_SECRET;
  let token = null;

  try {
    token = jwt.sign(payload, key, { expiresIn: process.env.JWT_EXPIRES_IN });
  } catch (error) {
    console.log(">>>>>check err token: ", error);
  }
  return token;
};

const createJwt_refreshToken = (payload) => {
  let key = process.env.JWT_SECRET;
  let token = null;

  try {
    token = jwt.sign(payload, key, {
      expiresIn: process.env.JWT_EXPIRES_REFRESH_TOKEN,
    });
  } catch (error) {
    console.log(">>>>>check err refresh token: ", error);
  }
  return token;
};

const verifyToken = (token) => {
  let key = process.env.JWT_SECRET;
  let decoded = null;
  try {
    decoded = jwt.verify(token, key);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return "TokenExpiredError"; // jwt hết hạn
    }
    console.log(">>>check err verify token: ", error);
  }
  return decoded;
};

const nonSecurePaths = ["/", "/api/login", "/api/logout", "/api/register", "/api/refreshToken", "/api/send-code", "/api/reset-password"]; // kh check middleware url (1)

// token từ BE sẽ lưu vào header bên FE
const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// middleware jwt check user đã đăng nhập chưa
const checkUserJwt = async (req, res, next) => {
  if (nonSecurePaths.includes(req.path)) return next(); // kh check middleware url (2)
  let tokenFromHeader = extractToken(req);

  if (tokenFromHeader) {
    // bug vừa vào đã check quyền xác thực khi chưa login của Context
    let access_Token = tokenFromHeader;
    let decoded = verifyToken(access_Token);

    if (decoded && decoded !== "TokenExpiredError") {
      
      req.user = decoded; // gán thêm .user(data cookie) vào req BE nhận từ FE
      req.access_Token = access_Token; // gán thêm .token(data cookie) vào req BE nhận từ FE
      next();
    } else if (decoded === "TokenExpiredError") {
      let refresh_Token = await jwtUtils.getRefreshTokenByAccessToken(
        access_Token
      );

      if (refresh_Token) {
        // Retry(FE) nếu lỗi là 400 -> vì token refresh chưa kịp /api/account -> retry để lấy token mới
        return res.status(401).json({
          EM: "need to retry with new token",
          EC: -1,
          DT: {},
        });
      } else {
        return res.status(401).json({
          EC: -1,
          DT: "",
          EM: "Not authenticated the user(token access_Token)",
        });
      }
    } else {
      return res.status(401).json({
        EC: -1,
        DT: "",
        EM: "Not authenticated the user(token access_Token)",
      });
    }
  }
  // ngược lại khi không có cookies or header thì trả ra lỗi không xác thực
  else {
    return res.status(401).json({
      EC: -1,
      DT: "",
      EM: "Not authenticated the user(access_Token | JWT)",
    });
  }
};

//middleware check user có quyền không(lấy role -> ss URL)
const checkUserPermission = (req, res, next) => {
  if (nonSecurePaths.includes(req.path) || req.path === "/api/account")
    return next(); // kh check middleware url (2)
  if (req.user) {
    // let email = req.user.email; // (chắc chắn hơn)-> dùng query xuống db để xem quyền -> ss paths lấy từ token
    // let paths = req.user.pathOfRole.Paths;

    // let currentUrl = req.originalUrl;

    // if (!paths && paths.length === 0) {
    //   return res.status(401).json({
    //     EC: -1,
    //     DT: "",
    //     EM: `you don't permission to access this resource`,
    //   });
    // }

    // // vòng lặp some từng phần tử ss token vs path(router)
    // // bug role/:id từ req là động -> thêm include  /:id
    // let canAccess = paths.some(
    //   (item) => item.url === currentUrl || currentUrl.includes(item.url)
    // );
    // if (canAccess) {
    next();
    // } else {
    //   console.log(">>>>check canAccess: ", canAccess);
    //   return res.status(401).json({
    //     EC: -1,
    //     DT: "",
    //     EM: `you don't permission to access this resource`,
    //   });
    // }
  } else {
    return res.status(401).json({
      EC: -1,
      DT: "",
      EM: "Not authenticated the user",
    });
  }
};

module.exports = {
  createJwt,
  verifyToken,
  checkUserJwt,
  checkUserPermission,
  createJwt_refreshToken,
};
