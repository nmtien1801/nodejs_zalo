const express = require("express");
const chatController = require("../controller/chatController");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();

/**
 *
 * @param {*} app : express app
 * @returns
 */
const ChatRoutes = (app) => {
  // Middleware
  router.all("*", checkUserJwt);

  // API lấy tin nhắn giữa 2 người
  app.get("/messages/:sender/:receiver/:type", chatController.getMsg);
  app.get("/api/getConversations/:senderId", chatController.getConversations);
  app.delete("/api/delMsg/:id", chatController.delMsg);

  return app.use("", router);
};

module.exports = ChatRoutes;
