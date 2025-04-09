const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../aws/file.service");
const authService = require("../services/authService");
const { checkUserJwt } = require("../middleware/jwtAction");

const router = express.Router();

// Cấu hình multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn dung lượng file tối đa là 5MB
});

const UploadRoutes = (app) => {

    router.all("*", checkUserJwt);

    // API cập nhật avatar
    router.put('/api/user/avatar', checkUserJwt, upload.single('avatar'), async (req, res) => {
        try {
            const userId = req.user._id; // Lấy user ID từ token
            const file = req.file; // File ảnh được upload

            if (!file) {
                return res.status(400).json({
                    EM: "No file uploaded!", // error message
                    EC: 1, // error code
                    DT: "", // no data
                });
            }

            // Upload file lên S3
            const avatarUrl = await uploadFile(file);

            // Cập nhật avatar trong cơ sở dữ liệu
            const result = await authService.updateAvatar(userId, avatarUrl);

            return res.status(200).json({
                EM: result.EM, // success or error message từ service
                EC: result.EC, // success or error code từ service
                DT: result.DT, // dữ liệu trả về từ service
            });
        } catch (error) {
            console.error("Error in updateAvatar API: ", error);
            return res.status(500).json({
                EM: "Something went wrong", // error message
                EC: -2, // error code
                DT: "", // no data
            });
        }
    });

    return app.use("", router);
};

module.exports = UploadRoutes;
