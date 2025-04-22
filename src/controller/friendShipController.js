const friendShipService = require('../services/friendShipService');


const deleteFriendShip = async (req, res) => {
    try {
        console.log("delete friend ship", req.user._id);

        const friendId = req.params.friendId;
        const userId = req.user._id;

        if (!userId || !friendId) {
            return res.status(400).json({
                EM: 'User ID and Friend ID are required',
                EC: 1,
                DT: '',
            });
        }

        const data = await friendShipService.deleteFriendShip(userId, friendId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check deleteFriendShip server', err);
        return res.status(500).json({
            EM: 'error deleteFriendShip', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}


const checkFriendShipExists = async (req, res) => {
    try {
        const userId = req.user._id;
        const friendId = req.params.friendId;

        console.log("checkFriendShipExists", userId, friendId);

        if (!userId || !friendId) {
            return res.status(400).json({
                EM: 'User ID and Friend ID are required',
                EC: 1,
                DT: '',
            });
        }

        const data = await friendShipService.checkFriendShipExists(userId, friendId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check checkFriendShipExists server', err);
        return res.status(500).json({
            EM: 'error checkFriendShipExists', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!userId) {
            return res.status(400).json({
                EM: 'User ID is required',
                EC: 1,
                DT: '',
            });
        }

        const data = await friendShipService.getAllFriends(userId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check getAllFriends server', err);
        return res.status(500).json({
            EM: 'error getAllFriends', // error message
            EC: 2, // error code
            DT: '', // data
        });
    }
};

const getFriends = async (req, res) => {
    try {
        const userId = req.user._id; // Lấy ID người dùng từ token hoặc middleware

        if (!userId) {
            return res.status(400).json({
                EM: "User ID is required", // error message
                EC: 1, // error code
                DT: "", // no data
            });
        }

        // Gọi service để lấy danh sách bạn bè
        const data = await friendShipService.getFriends(userId);

        return res.status(200).json({
            EM: data.EM, // success or error message từ service
            EC: data.EC, // success or error code từ service
            DT: data.DT, // dữ liệu trả về từ service
        });
    } catch (err) {
        console.error("Error in getFriends controller: ", err);
        return res.status(500).json({
            EM: "Error fetching friends", // error message
            EC: 2, // error code
            DT: "", // no data
        });
    }
};

module.exports = {
    deleteFriendShip,
    checkFriendShipExists,
    getAllFriends,
    getFriends
};

