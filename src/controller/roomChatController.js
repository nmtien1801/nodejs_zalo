
const roomChatService = require('../services/roomChatService');

const getRoomChatByPhone = async (req, res) => {
    try {
        const phone = req.params.phone;
        const user = req.user;
        let data = await roomChatService.getRoomChatByPhone(user, phone);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check getRoomChatByPhone server', err);
        return res.status(500).json({
            EM: 'error getRoomChatByPhone', //error message 
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const getRoomChatMembers = async (req, res) => {
    try {
        const roomId = req.params.roomId;

        if (!roomId) {
            return res.status(400).json({
                EM: "Room ID is required",
                EC: 1,
                DT: "",
            });
        }

        const data = await roomChatService.getRoomChatMembers(roomId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log("check getRoomChatMembers server", err);
        return res.status(500).json({
            EM: "error getRoomChatMembers",
            EC: 2,
            DT: "",
        });
    }
};

const addMembersToRoomChat = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user._id; // Lấy userId từ token
        const { members } = req.body;

        if (!roomId || !members || !Array.isArray(members)) {
            return res.status(400).json({
                EM: "Room ID and members array are required",
                EC: 1,
                DT: "",
            });
        }

        const data = await roomChatService.addMembersToRoomChat(userId, roomId, members);

        console.log("check addMembersToRoomChat server", data);


        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log("check addMembersToRoomChatAndCreateConversation server", err);
        return res.status(500).json({
            EM: "error addMembersToRoomChatAndCreateConversation",
            EC: 2,
            DT: "",
        });
    }
};

const acceptGroupJoinRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const data = await roomChatService.acceptGroupJoinRequest(requestId);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check acceptGroupJoinRequest server', err);
        return res.status(500).json({
            EM: 'error acceptGroupJoinRequest', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

module.exports = {
    getRoomChatByPhone,
    getRoomChatMembers,
    addMembersToRoomChat,
    acceptGroupJoinRequest,
};
