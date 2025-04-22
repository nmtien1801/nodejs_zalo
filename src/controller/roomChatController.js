
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

const getAllMemberGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // Kiểm tra dữ liệu đầu vào
        if (!groupId) {
            return res.status(400).json({
                EM: "Group ID is required", // error message
                EC: 1, // error code
                DT: "", // no data
            });
        }

        // Gọi service để lấy danh sách thành viên của nhóm
        const data = await roomChatService.getAllMemberGroup(groupId);

        // Trả về kết quả từ service
        return res.status(200).json({
            EM: data.EM, // success or error message từ service
            EC: data.EC, // success or error code từ service
            DT: data.DT, // dữ liệu trả về từ service
        });
    } catch (err) {
        console.error("Error in getAllMemberGroup controller: ", err);
        return res.status(500).json({
            EM: "Error fetching group members", // error message
            EC: 2, // error code
            DT: "", // no data
        });
    }
};

const getMemberByPhone = async (req, res) => {
    try {
        const phone = req.params.phone;
        const groupId = req.body.groupId;
        
        // Kiểm tra dữ liệu đầu vào
        if (!phone) {
            return res.status(400).json({
                EM: "Phone number is required", // error message
                EC: 1, // error code
                DT: "", // no data
            });
        }

        // Gọi service để lấy thông tin thành viên theo số điện thoại
        const data = await roomChatService.getMemberByPhone(phone, groupId);

        // Trả về kết quả từ service
        return res.status(200).json({
            EM: data.EM, // success or error message từ service
            EC: data.EC, // success or error code từ service
            DT: data.DT, // dữ liệu trả về từ service
        });
    } catch (err) {
        console.error("Error in getMemberByPhone controller: ", err);
        return res.status(500).json({
            EM: "Error fetching member by phone", // error message
            EC: 2, // error code
            DT: "", // no data
        });
    }
};

module.exports = {
    getRoomChatByPhone,
    getAllMemberGroup,
    getMemberByPhone
}