const express = require("express");
const { uploadAvatar, uploadAvatarProfile } = require("../controller/uploadController");
const { checkUserJwt } = require("../middleware/jwtAction");
const upload = require("../middleware/uploadS3"); // hoặc uploadLocal.js
const router = express.Router();

const UploadRoutes = (app) => {
    // Middleware
    router.all("*", checkUserJwt);
  
    router.post("/api/upload-avatar", upload.single("avatar"), uploadAvatar);
    router.post("/api/uploadAvatarProfile", uploadAvatarProfile);
    return app.use("", router);
  };

module.exports = UploadRoutes;
