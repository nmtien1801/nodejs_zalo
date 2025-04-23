const friendRequestService = require('../services/friendRequestService');


const sendFriendRequest = async (req, res) => {
    try {
        let data = await friendRequestService.sendFriendRequest(
            {
                fromUser: req.user._id,
                toUser: req.body.toUser,
                content: req.body.content,
            }
        );

        console.log('check sendFriendRequest', data);


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
        let data = await friendRequestService.getFriendRequests(req.user._id);

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

const rejectFriendRequest = async (req, res) => {
    try {
        const _id = req.params.id;
        const data = await friendRequestService.rejectFriendRequest(_id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check rejectFriendRequest server', err);
        return res.status(500).json({
            EM: 'error rejectFriendRequest', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const getFriendRequestByFromUserAndToUser = async (req, res) => {

    try {
        const fromUser = req.user._id;
        const toUser = req.params.fromUserId;



        const data = await friendRequestService.getFriendRequestByFromUserAndToUser(fromUser, toUser);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check getFriendRequestByFromUserAndToUser server', err);
        return res.status(500).json({
            EM: 'error getFriendRequestByFromUserAndToUser', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const cancelFriendRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const data = await friendRequestService.cancelFriendRequest(requestId);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check cancelFriendRequest server', err);
        return res.status(500).json({
            EM: 'error cancelFriendRequest', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const sendGroupJoinRequests = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { members } = req.body;
        const data = await friendRequestService.sendGroupJoinRequests(roomId, members);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check sendGroupJoinRequests server', err);
        return res.status(500).json({
            EM: 'error sendGroupJoinRequests', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const getGroupJoinRequests = async (req, res) => {
    try {
        const roomId = req.user._id;
        const data = await friendRequestService.getGroupJoinRequests(roomId);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (err) {
        console.log('check getGroupJoinRequests server', err);
        return res.status(500).json({
            EM: 'error getGroupJoinRequests', //error message
            EC: 2, //error code
            DT: '', // data
        });
    }
}

const acceptGroupJoinRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const data = await friendRequestService.acceptGroupJoinRequest(requestId);
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
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequestByFromUserAndToUser,
    cancelFriendRequest,
    sendGroupJoinRequests,
    getGroupJoinRequests,
    acceptGroupJoinRequest,
}