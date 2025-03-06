const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const { v4: uuidv4 } = require("uuid");
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

const nonSecurePaths = [
  "/",
  "/api/login",
  "/api/logout",
  "/api/register",
  "/api/account",
]; // kh check middleware url (1)

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
      // req.refresh_Token = cookies.refresh_Token; // gán thêm .token(data cookie) vào req BE nhận từ FE
      next();
    } else if (decoded === "TokenExpiredError") {
      // if (cookies && cookies.refresh_Token) {
      //   let data = await handleRefreshToken(cookies.refresh_Token);
      //   let newAccessToken = data.newAccessToken;
      //   let newRefreshToken = data.newRefreshToken;
      //   // set cookie
      //   if (data && newAccessToken && newRefreshToken) {
      //     res.cookie("access_Token", newAccessToken, {
      //       httpOnly: true, // chỉ cho phép server đọc cookie, không cho client
      //       secure: false,
      //       maxAge: +process.env.MAX_AGE_ACCESS_TOKEN, // 15P
      //     });
      //     res.cookie("refresh_Token", newRefreshToken, {
      //       httpOnly: true, // chỉ cho phép server đọc cookie, không cho client
      //       secure: false,
      //       maxAge: +process.env.MAX_AGE_REFRESH_TOKEN, // 1 days
      //     });
      //   }
      //   // Retry(FE) nếu lỗi là 400 -> vì token refresh chưa kịp /api/account -> retry để lấy token mới
      //   return res.status(400).json({
      //     EC: -1,
      //     DT: "",
      //     EM: "need to retry with new token",
      //   });
      // } else {
      //   return res.status(401).json({
      //     EC: -1,
      //     DT: "",
      //     EM: "Not authenticated the user(token access_Token)",
      //   });
      // }
    } else {
      return res.status(401).json({
        EC: -1,
        DT: "",
        EM: "Not authenticated the user(token access_Token)",
      });
    }
    // console.log(">>> my cookies 401: ", cookies.access_Token);
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

const handleRefreshToken = async (refreshToken) => {
  let newAccessToken = "";
  let newRefreshToken = "";

  // tìm db user có refreshToken
  let user = await authService.getUserByRefreshToken(refreshToken);

  if (user) {
    // create access_Token -> sửa res.DT(service) trong lần check thứ 1
    let payload = {
      email: user.email,
      userName: user.userName,
      pathOfRole: user.pathOfRole,
      roleID: user.roleID, // chức vụ
    };
    newAccessToken = createJwt(payload);

    newRefreshToken = uuidv4();
    await authService.updateUserRefreshToken(user.email, newRefreshToken);
  }

  return {
    newAccessToken,
    newRefreshToken,
  };
};

module.exports = {
  createJwt,
  verifyToken,
  checkUserJwt,
  checkUserPermission,
};
