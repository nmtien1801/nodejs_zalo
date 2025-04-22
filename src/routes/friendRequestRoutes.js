const express = require("express");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();
const friendRequestController = require("../controller/friendRequestController");

/**
 *
 * @param {*} app : express app
 * @returns
 */
const FriendRequestRoutes = (app) => {
    // Middleware
    router.all("*", checkUserJwt);

    app.post("/api/sendRequestFriend", friendRequestController.sendFriendRequest);
    app.post("/api/acceptFriendRequest/:id", friendRequestController.acceptFriendRequest);
    app.post("/api/rejectFriendRequest/:id", friendRequestController.rejectFriendRequest);
    app.get("/api/getFriendRequests", friendRequestController.getFriendRequests);
    app.get("/api/getFriendRequestByFromUserAndToUser/:fromUserId", friendRequestController.getFriendRequestByFromUserAndToUser);
    app.post("/api/cancelFriendRequest/:id", friendRequestController.cancelFriendRequest);
    app.post("/api/sendGroupJoinRequests/:roomId", friendRequestController.sendGroupJoinRequests);
    app.get("/api/getGroupJoinRequests", friendRequestController.getGroupJoinRequests);
    app.post("/api/acceptGroupJoinRequest/:id", friendRequestController.acceptGroupJoinRequest);

    return app.use("", router);
};

module.exports = FriendRequestRoutes;
