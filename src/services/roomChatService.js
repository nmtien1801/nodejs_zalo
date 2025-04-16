require("dotenv").config();
const RoomChat = require("../models/roomChat");

const getRoomChatByPhone = async (user, phone) => {
    try {
        if (user.phone === phone) {
            return {
                EM: "Không thể tìm kiếm chính mình",
                EC: 1,
                DT: "",
            };
        }

        // tìm số điện thoai trong RoomChat
        const roomChat = await RoomChat.findOne({
            phone: phone,
        });

        if (!roomChat) {
            return {
                EM: "Không tìm thấy người nào đăng ký số điện thoại này",
                EC: 1,
                DT: "",
            };
        }

        return {
            EM: "ok! getRoomChatByPhone ",
            EC: 0,
            DT: roomChat,
        };
    } catch (error) {
        console.log("check getRoomChatByPhone service", error);
        return res.status(500).json({
            EM: "error getRoomChatByPhone service", //error message
            EC: 2, //error code
            DT: "", // data
        });
    }
}

module.exports = {
    getRoomChatByPhone,
};