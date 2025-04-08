const friendRequestService = require('../services/friendRequestService');


const sendFriendRequest = async (req, res) => {
    try {
        let data = await friendRequestService.sendFriendRequest(
            {
                fromUser: req.user.phone,
                toUser: req.body.toUser,
                content: req.body.content,
            }
        );

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check sendFriendRequest server', err);
        return res.status(500).json({
            EM: 'error sendFriendRequest', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const acceptFriendRequest = async (req, res) => {
    try {

        const _id = req.params.id;

        // Kiểm tra xem yêu cầu kết bạn có tồn tại hay không
        // const request = await friendRequestService.checkFriendRequestExists(_id);

        // if (!request) {
        //     return res.status(404).json({
        //         EM: 'Friend request not found',
        //         EC: 1,
        //         DT: '',
        //     });
        // }

        // Kiểm tra xem yêu cầu kết bạn đã được chấp nhận hay chưa
        // if (request.status === 1) {
        //     return res.status(400).json({
        //         EM: 'Friend request already accepted',
        //         EC: 1,
        //         DT: '',
        //     });
        // }

        // Cập nhật trạng thái yêu cầu kết bạn thành accepted
        const data = await friendRequestService.acceptFriendRequest(_id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check acceptFriendRequest server', err);
        return res.status(500).json({
            EM: 'error acceptFriendRequest', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const getFriendRequests = async (req, res) => {
    try {
        let data = await friendRequestService.getFriendRequests(req.user.phone);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check getFriendRequestsByUserId server', err);
        return res.status(500).json({
            EM: 'error getFriendRequestsByUserId', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

module.exports = {
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
}