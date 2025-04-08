const express = require("express");
const { uploadAvatar } = require("../controller/uploadController");
const upload = require("../middleware/uploadS3"); // hoặc uploadLocal.js
const router = express.Router();

router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);

module.exports = router;
