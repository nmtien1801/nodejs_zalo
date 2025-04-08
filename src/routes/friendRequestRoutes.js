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
    // app.post("/api/rejectFriendRequest", friendRequestController.rejectFriendRequest);
    app.get("/api/getFriendRequests", friendRequestController.getFriendRequests);

    return app.use("", router);
};

module.exports = FriendRequestRoutes;
