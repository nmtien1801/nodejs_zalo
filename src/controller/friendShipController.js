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

module.exports = {
    deleteFriendShip,
    checkFriendShipExists,
};

