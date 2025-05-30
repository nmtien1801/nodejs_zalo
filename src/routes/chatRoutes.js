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
  app.get("/api/messages/:sender/:receiver/:type", chatController.getMsg);
  app.get("/api/getConversations/:senderId", chatController.getConversations);
  app.get(
    "/api/getConversationsByMember/:senderId",
    chatController.getConversationsByMember
  );
  app.delete("/api/delMsg/:id", chatController.delMsg);
  app.post(
    "/api/createConversationGroup",
    chatController.createConversationGroup
  );
  app.put("/api/messages/recall/:id", chatController.recallMsg); // Thu hồi tin nhắn
  app.put("/api/messages/deleteForMe/:id", chatController.deleteMsgForMe); // Xóa chỉ ở phía tôi
  app.post("/api/messages/handleReaction", chatController.handleReaction); // Xử lý phản ứng
  app.get(
    "/api/messages/:id/reactions",
    chatController.getReactionsByMessageId
  );
  app.post("/api/updatePermission", chatController.updatePermission);
  app.get("/api/getAllPermission", chatController.getAllPermission);
  app.post("/api/updateDeputy", chatController.updateDeputy);
  app.post("/api/transLeader", chatController.transLeader);

  // Giải tán nhóm (chỉ leader)
  app.delete("/api/group/:groupId/dissolve", chatController.dissolveGroup);

  app.delete(
    "/api/roomChat/:groupId/members/:memberId",
    chatController.removeMemberFromGroup
  );

  // chatbot AI chatGPT
  app.post("/api/chatgpt", chatController.chatGPTResponse);

  // Đã đọc
  router.post("/api/mark-read/:messageId", chatController.markMessageAsRead);
  router.post("/api/mark-all-read/:conversationId", chatController.markAllMessagesAsRead);

  // Lấy tin nhắn cũ hơn
  app.get("/api/messages/:sender/:receiver/:type/older", chatController.getOlderMessages);

  return app.use("", router);
};

module.exports = ChatRoutes;
