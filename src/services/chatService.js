require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../models/message");
const Conversation = require("../models/conversation");
const RoomChat = require("../models/roomChat");

const getConversations = async (senderId) => {
  try {
    // Lấy danh sách Conversation
    const conversations = await Conversation.find({
      "sender._id": senderId,
    });

    // Thêm trường avatar vào từng conversation
    const updatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const user = await RoomChat.findById(conversation.receiver._id);
        conversation.avatar = user?.avatar || null; // Gán avatar hoặc null nếu không tìm thấy
        return conversation;
      })
    );

    return {
      EM: "ok! getConversations",
      EC: 0,
      DT: updatedConversations,
    };
  } catch (error) {
    console.log("check getConversations service", error);
    return {
      EM: "error getConversations service", // error message
      EC: 2, // error code
      DT: "", // no data
    };
  }
};
// const getConversationsByMember = async (userId) => {
//   try {
//     // Kiểm tra userId có hợp lệ không
//     if (!mongoose.isValidObjectId(userId)) {
//       throw new Error('ID thành viên không hợp lệ');
//     }

//     // Tìm các conversation mà userId có trong mảng members
//     const conversations = await Conversation.find({
//       members: {
//         $in: [new mongoose.Types.ObjectId(userId)]
//       }
//     })
//       .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước
//     console.log("check getConversationsByMember", conversations);

//     return {
//       EM: "ok! getConversationById",
//       EC: 0,
//       DT: conversations,
//     };
//   } catch (error) {
//     console.log("check getConversationById service", error);
//     return res.status(500).json({
//       EM: "error getConversationById service", //error message
//       EC: 2, //error code
//       DT: "", // data
//     });
//   }
// };

const getConversationsByMember = async (userId) => {
  try {
    // Kiểm tra userId có hợp lệ không
    if (!mongoose.isValidObjectId(userId)) {
      return {
        EM: 'ID thành viên không hợp lệ',
        EC: 1,
        DT: []
      };
    }

    const currentUserId = new mongoose.Types.ObjectId(userId);

    // Tìm các conversation mà userId có trong mảng members
    const conversations = await Conversation.aggregate([
      {
        $match: {
          members: {
            $in: [currentUserId]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      {
        $addFields: {
          // Xác định người nhận (người không phải là current user)
          receiver: {
            $filter: {
              input: '$memberDetails',
              as: 'member',
              cond: { $ne: ['$$member._id', currentUserId] }
            }
          },
          // Giữ thông tin current user
          sender: {
            $filter: {
              input: '$memberDetails',
              as: 'member',
              cond: { $eq: ['$$member._id', currentUserId] }
            }
          },
          // Chuyển mảng receiver thành object (vì mỗi conversation chỉ có 2 người)
          receiverInfo: { $arrayElemAt: ['$receiver', 0] },
          senderInfo: { $arrayElemAt: ['$sender', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          // Thông tin người nhận
          receiverId: '$receiverInfo._id',
          receiverName: '$receiverInfo.username',
          receiverAvatar: '$receiverInfo.avatar',
          receiverPhone: '$receiverInfo.phone',
          // Thông tin người gửi (current user)
          senderId: '$senderInfo._id',
          lastMessage: 1, // Giả sử có trường lastMessage
          unreadCount: 1  // Giả sử có trường unreadCount
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]);

    return {
      EM: 'Lấy danh sách hội thoại thành công',
      EC: 0,
      DT: conversations
    };
  } catch (error) {
    console.error('Lỗi getConversationsByMember:', error);
    return {
      EM: 'Lỗi server khi lấy danh sách hội thoại',
      EC: 2,
      DT: []
    };
  }
};

const createConversationGroup = async (nameGroup, avatarGroup, members) => {
  try {
    const conversation = await Conversation.create({
      sender: {
        _id: members[0]._id,
      },
      receiver: {
        _id: members[1]._id,
      },
      members: members,
      name: nameGroup,
      avatar: avatarGroup,
      message: "Bắt đầu cuộc trò chuyện mới",
      time: Date.now(),
      type: "2"
    });

    return {
      EM: "ok! createConversationGroup",
      EC: 0,
      DT: conversation,
    };
  } catch (error) {
    console.log("check createConversationGroup service", error);
    return {
      EM: "error createConversationGroup service", // error message
      EC: 2, // error code
      DT: "", // no data
    };
  }
}

module.exports = {
  getConversations,
  getConversationsByMember,
  createConversationGroup
};
