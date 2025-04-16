const express = require("express");
const profileController = require("../controller/profileController");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();

/**
 *
 * @param {*} app : express app
 * @returns
 */

const ProfileRoutes = (app) => {
  // Middleware
  router.all("*", checkUserJwt);

  app.post("/api/uploadProfile", profileController.uploadProfile);

  return app.use("", router);
};

module.exports = ProfileRoutes;
