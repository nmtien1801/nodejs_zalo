const express = require("express");
const { checkUserJwt } = require("../middleware/jwtAction");
const router = express.Router();
const friendShipController = require("../controller/friendShipController");

/**
 *
 * @param {*} app : express app
 * @returns
 */
const FriendShipRoutes = (app) => {
    // Middleware
    router.all("*", checkUserJwt);

    app.post("/api/deleteFriend/:friendId", friendShipController.deleteFriendShip);
    app.get("/api/checkFriendShip/:friendId", friendShipController.checkFriendShipExists);

    return app.use("", router);
};

module.exports = FriendShipRoutes;
