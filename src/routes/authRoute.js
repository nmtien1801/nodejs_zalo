const express = require("express");
const authController = require("../controller/authController");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();

/**
 *
 * @param {*} app : express app
 * @returns
 */
const AuthRoutes = (app) => {
  // Middleware
  router.all("*", checkUserJwt);

  router.post("/api/login", authController.handleLogin);
  router.post("/api/register", authController.handleRegister);

  app.post("/api/send-code", authController.sendCode);
  app.post("/api/reset-password", authController.resetPassword);
  app.post("/api/changePassword", authController.changePassword);
  app.post("/api/verifyEmail", authController.verifyEmail);

  // router.post("/api/logout", authController.handleLogout);
  router.get("/api/account", authController.getUserAccount);
  router.post("/api/refreshToken", authController.handleRefreshToken);

  router.get("/user/getUserByPhone/:phone", authController.getUserByPhone);

  router.post("/api/logout", authController.handleLogout);

  return app.use("", router);
};

module.exports = AuthRoutes;
