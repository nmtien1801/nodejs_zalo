
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

module.exports = {
    getRoomChatByPhone,
}