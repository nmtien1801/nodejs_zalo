require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../models/message");
const Conversation = require("../models/conversation");
const ReactionMessage = require("../models/reactionMessage");
const RoomChat = require("../models/roomChat");
const Permission = require("../models/permission");

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

const getConversationsByMember = async (userId) => {
  try {
    // Kiểm tra userId có hợp lệ không
    if (!mongoose.isValidObjectId(userId)) {
      return {
        EM: "ID thành viên không hợp lệ",
        EC: 1,
        DT: [],
      };
    }

    const currentUserId = new mongoose.Types.ObjectId(userId);

    // Tìm các conversation mà userId có trong mảng members
    const conversations = await Conversation.aggregate([
      {
        $match: {
          members: {
            $in: [currentUserId],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "memberDetails",
        },
      },
      {
        $addFields: {
          // Xác định người nhận (người không phải là current user)
          receiver: {
            $filter: {
              input: "$memberDetails",
              as: "member",
              cond: { $ne: ["$$member._id", currentUserId] },
            },
          },
          // Giữ thông tin current user
          sender: {
            $filter: {
              input: "$memberDetails",
              as: "member",
              cond: { $eq: ["$$member._id", currentUserId] },
            },
          },
          // Chuyển mảng receiver thành object (vì mỗi conversation chỉ có 2 người)
          receiverInfo: { $arrayElemAt: ["$receiver", 0] },
          senderInfo: { $arrayElemAt: ["$sender", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          // Thông tin người nhận
          receiverId: "$receiverInfo._id",
          receiverName: "$receiverInfo.username",
          receiverAvatar: "$receiverInfo.avatar",
          receiverPhone: "$receiverInfo.phone",
          // Thông tin người gửi (current user)
          senderId: "$senderInfo._id",
          lastMessage: 1, // Giả sử có trường lastMessage
          unreadCount: 1, // Giả sử có trường unreadCount
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]);

    return {
      EM: "Lấy danh sách hội thoại thành công",
      EC: 0,
      DT: conversations,
    };
  } catch (error) {
    console.error("Lỗi getConversationsByMember:", error);
    return {
      EM: "Lỗi server khi lấy danh sách hội thoại",
      EC: 2,
      DT: [],
    };
  }
};

const createConversationGroup = async (nameGroup, avatarGroup, members) => {
  try {
    const roomChat = await RoomChat.create({
      username: nameGroup,
      avatar: avatarGroup,
      members: members,
      phone: "1",
      permission: [1, 2, 3, 4, 5, 6, 7],
    });

    const conversations = [];

    for (let i = 0; i < members.length; i++) {
      const role = i === 0 ? "leader" : "member";

      const conversation = await Conversation.create({
        sender: {
          _id: members[i],
        },
        receiver: {
          _id: roomChat._id,
          username: roomChat.username,
        },
        members: members,
        name: nameGroup,
        avatar: avatarGroup,
        message: "Bắt đầu cuộc trò chuyện mới",
        time: Date.now(),
        type: "2",
        role: role,
      });

      conversations.push(conversation);
    }

    return {
      EM: "ok! createConversationGroup",
      EC: 0,
      DT: conversations,
    };
  } catch (error) {
    console.log("check createConversationGroup service", error);
    return {
      EM: "error createConversationGroup service", // error message
      EC: 2, // error code
      DT: "", // no data
    };
  }
};

const getReactionsByMessageId = async (messageId) => {
  try {
    if (!messageId) {
      return {
        EM: "Message ID is required", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return {
        EM: "Invalid messageId getReactionsByMessageId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Lấy tất cả reaction của messageId
    const reactions = await ReactionMessage.find({ messageId }).populate({
      path: "userId",
      select: "_id username avatar", // Chỉ lấy các trường cần thiết của user
    });

    return {
      EM: "Reactions fetched successfully", // success message
      EC: 0, // success code
      DT: reactions, // Dữ liệu các reaction
    };
  } catch (error) {
    console.error("Error in getReactionsByMessageId: ", error);
    return {
      EM: "Error fetching reactions", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const handleReaction = async (messageId, userId, emoji) => {
  try {
    if (!messageId || !userId || !emoji) {
      return {
        EM: "Missing required fields (messageId, userId, emoji)", // error message
        EC: 1, // error code
        DT: messageId + ", " + userId + ", " + emoji, // no data
      };
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return {
        EM: "Invalid messageId handleReaction", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Kiểm tra xem người dùng đã reaction cho tin nhắn này chưa
    const existingReaction = await ReactionMessage.findOne({
      messageId,
      userId,
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Nếu emoji giống nhau, xóa reaction
        try {
          await ReactionMessage.findByIdAndDelete(existingReaction._id);
          return {
            EM: "Reaction removed successfully", // success message
            EC: 0, // success code
            DT: null, // Không trả về dữ liệu
          };
        } catch (error) {
          console.error("Error deleting reaction: ", error);
          return {
            EM: "Error deleting reaction", // error message
            EC: -1, // error code
            DT: "", // no data
          };
        }
      } else {
        // Nếu emoji khác nhau, cập nhật reaction
        existingReaction.emoji = emoji;
        await existingReaction.save();
        return {
          EM: "Reaction updated successfully", // success message
          EC: 0, // success code
          DT: existingReaction, // Trả về reaction đã cập nhật
        };
      }
    } else {
      // Nếu chưa có reaction, thêm mới
      const newReaction = await ReactionMessage.create({
        messageId,
        userId,
        emoji,
      });
      return {
        EM: "Reaction added successfully", // success message
        EC: 0, // success code
        DT: newReaction, // Trả về reaction vừa thêm
      };
    }
  } catch (error) {
    console.error("Error in handleReaction: ", error);
    return {
      EM: "Error handling reaction", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const updatePermission = async (groupId, newPermission) => {
  try {
    // Kiểm tra groupId có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return {
        EM: "Invalid groupId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Tìm tất cả các conversation có receiver._id = groupId
    const conversations = await Conversation.find({
      "receiver._id": groupId,
    });

    if (!conversations || conversations.length === 0) {
      return {
        EM: "No conversations found for the given groupId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Cập nhật quyền cho tất cả các conversation
    const updatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        conversation.receiver.permission = newPermission;
        // Thêm trường avatar vào từng conversation
        const user = await RoomChat.findById(conversation.receiver._id);
        conversation.avatar = user?.avatar || null;
        return await conversation.save();
      })
    );

    return {
      EM: "Permissions updated successfully", // success message
      EC: 0, // success code
      DT: updatedConversations, // Trả về danh sách conversation đã cập nhật
    };
  } catch (error) {
    console.error("Error in updatePermission service: ", error);
    return {
      EM: "Error updating permissions", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const getAllPermission = async () => {
  try {
    const permission = await Permission.find();

    return {
      EM: "Permissions fetched successfully", // success message
      EC: 0, // success code
      DT: permission, // Trả về danh sách quyền
    };
  } catch (error) {
    console.error("Error in getAllPermissionByGroup service: ", error);
    return {
      EM: "Error fetching permissions", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const updateDeputy = async (members) => {
  try {
    // Bước 1: Reset toàn bộ role về "member", trừ "leader"
    await Conversation.updateMany(
      { role: { $ne: "leader" } },
      { $set: { role: "member" } }
    );

    // Nếu không có danh sách cụ thể => chỉ reset và kết thúc
    if (!Array.isArray(members) || members.length === 0) {
      return {
        EM: "Đã reset tất cả deputy về member (trừ leader)",
        EC: 0,
        DT: [],
      };
    }

    // Bước 2: Update role thành "deputy" cho những member đủ điều kiện
    const updateResults = await Promise.all(
      members.map(async (member) => {
        if (member.sender?._id && member.receiver?._id) {
          const updated = await Conversation.findOneAndUpdate(
            {
              "sender._id": member.sender._id,
              "receiver._id": member.receiver._id,
              role: { $ne: "leader" },
            },
            {
              $set: { role: "deputy" },
            },
            { new: true }
          );
          return updated ?? member; // nếu không update được thì trả về member gốc
        }
        return member; // không đủ điều kiện, vẫn trả lại
      })
    );

    return {
      EM: "Đã cập nhật deputy thành công sau khi reset",
      EC: 0,
      DT: updateResults,
    };
  } catch (error) {
    console.error("Lỗi trong updateDeputy: ", error);
    return {
      EM: "Lỗi khi cập nhật deputy",
      EC: -1,
      DT: null,
    };
  }
};

const transLeader = async (groupId, newLeaderId) => {
  try {
    // Kiểm tra groupId và newLeaderId có hợp lệ không
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(newLeaderId)
    ) {
      return {
        EM: "Invalid groupId or newLeaderId", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Tìm conversation hiện tại của trưởng nhóm
    const currentLeaderConversation = await Conversation.findOne({
      "receiver._id": groupId,
      role: "leader",
    });

    if (!currentLeaderConversation) {
      return {
        EM: "Current leader not found", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Hạ cấp trưởng nhóm hiện tại thành thành viên
    currentLeaderConversation.role = "member";
    await currentLeaderConversation.save();

    // Tìm conversation của thành viên mới sẽ trở thành trưởng nhóm
    const newLeaderConversation = await Conversation.findOne({
      "receiver._id": groupId,
      "sender._id": newLeaderId,
    });

    if (!newLeaderConversation) {
      return {
        EM: "New leader not found in the group", // error message
        EC: 1, // error code
        DT: "", // no data
      };
    }

    // Nâng cấp thành viên mới thành trưởng nhóm
    newLeaderConversation.role = "leader";
    await newLeaderConversation.save();

    return {
      EM: "Leader transferred successfully", // success message
      EC: 0, // success code
      DT: {
        oldLeader: currentLeaderConversation,
        newLeader: newLeaderConversation,
      },
    };
  } catch (error) {
    console.error("Error in transLeader service: ", error);
    return {
      EM: "Error transferring leader", // error message
      EC: -1, // error code
      DT: "", // no data
    };
  }
};

const dissolveGroup = async (groupId, userId) => {
  try {
    // Kiểm tra xem group có tồn tại không
    const roomChat = await RoomChat.findById(groupId);
    if (!roomChat) {
      return {
        EM: "Nhóm không tồn tại",
        EC: 1,
        DT: "",
      };
    }

    // Kiểm tra xem người dùng có phải là leader của nhóm không
    const conversation = await Conversation.findOne({
      "receiver._id": groupId,
      "sender._id": userId,
      role: "leader",
    });

    if (!conversation) {
      return {
        EM: "Bạn không có quyền giải tán nhóm này",
        EC: 1,
        DT: "",
      };
    }

    // Xóa tất cả các conversation liên quan đến nhóm
    await Conversation.deleteMany({
      "receiver._id": groupId,
    });

    // Xóa tất cả các tin nhắn trong nhóm
    await Message.deleteMany({
      "receiver._id": groupId,
    });

    // Xóa nhóm
    await RoomChat.findByIdAndDelete(groupId);

    return {
      EM: "Giải tán nhóm thành công",
      EC: 0,
      DT: "",
    };
  } catch (error) {
    console.log("Check dissolveGroup service", error);
    return {
      EM: "Lỗi khi giải tán nhóm",
      EC: 2,
      DT: "",
    };
  }
};

const removeMemberFromGroup = async (groupId, memberId) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return {
        EM: "Invalid Group ID or Member ID",
        EC: 1,
        DT: "",
      };
    }

    const deletedConversations = await Conversation.deleteMany({
      $or: [
        { "sender._id": groupId, "receiver._id": memberId },
        { "sender._id": memberId, "receiver._id": groupId },
      ],
    });

    const group = await RoomChat.findById(groupId);

    if (!group) {
      return {
        EM: "Group not found",
        EC: 1,
        DT: "",
      };
    }

    const memberIndex = group.members.findIndex(
      (member) => member.toString() === memberId
    );
    if (memberIndex === -1) {
      return {
        EM: "Member not found in group",
        EC: 1,
        DT: "",
      };
    }

    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );
    await group.save();

    return {
      EM: "Member removed successfully and related conversations deleted",
      EC: 0,
      DT: group,
    };
  } catch (error) {
    console.error("Error in removeMemberFromGroup service:", error);
    return {
      EM: "Error removing member from group",
      EC: 2,
      DT: "",
    };
  }
};

module.exports = {
  getConversations,
  createConversationGroup,
  handleReaction,
  getReactionsByMessageId,
  getConversationsByMember,
  updatePermission,
  getAllPermission,
  updateDeputy,
  transLeader,
  removeMemberFromGroup,
  dissolveGroup,
};
