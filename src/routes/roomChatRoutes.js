const express = require("express");
const roomChatController = require("../controller/roomChatController");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();

/**
 *
 * @param {*} app : express app
 * @returns
 */
const RoomChatRoutes = (app) => {

    // Middleware
    router.all("*", checkUserJwt);

    app.get("/api/roomChat/:phone", roomChatController.getRoomChatByPhone);
    app.get("/api/roomChat/:roomId/members", roomChatController.getRoomChatMembers); // Route mới
    app.post("/api/roomChat/:roomId/members", roomChatController.addMembersToRoomChat); // Route mới
    app.get("/api/getAllMemberGroup/:groupId", roomChatController.getAllMemberGroup);
    app.post("/api/getMemberByPhone/:phone", roomChatController.getMemberByPhone);
    app.get("/api/roomChat/:username", roomChatController.getRoomChatByUsername);
    app.get("/api/getPermissionCurrent/:groupId", roomChatController.getPermissionCurrent);

    return app.use("", router);
};

module.exports = RoomChatRoutes;
