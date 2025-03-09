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
  
  // router.post("/api/logout", authController.handleLogout);
  router.get("/api/account", authController.getUserAccount);

  return app.use("", router);
};

module.exports = AuthRoutes;
