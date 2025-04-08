require("dotenv").config();
const RoomChat = require("../models/roomChat");

const getRoomChatByPhone = async (phone) => {
    try {
        // tìm số điện thoai trong RoomChat
        const roomChat = await RoomChat.findOne({
            phone: phone,
        });

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