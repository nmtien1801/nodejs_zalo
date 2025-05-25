const socket = require("socket.io");
const { saveMsg } = require("../controller/chatController");
const chatService = require("../services/chatService");
const { setTypingStatus, removeTypingStatus, getTypingUsers } = require("../utils/typingUtils");
const { keysAsync } = require("../config/redisConfig");
const Message = require("../models/message");

const onlineUsers = [];

const addUser = (user, socketId) => {
  const isExist = onlineUsers.findIndex((item) => item._id === user._id);
  if (isExist !== -1) {
    onlineUsers.splice(isExist, 1);
  }
  user.socketId = socketId;
  onlineUsers.push(user);
};

const removeUser = (socketId) => {
  const isExist = onlineUsers.findIndex((item) => item.socketId === socketId);
  if (isExist !== -1) {
    onlineUsers.splice(isExist, 1);
  }
};

const socketInit = (server) => {
  const io = socket(server, {
    cors: {
      origin: "*",
    },
  });

  let users = {}; // Lưu danh sách người dùng tham gia
  let groups = {}; // Lưu danh sách nhóm gọi
  const USER_TIMEOUT = 30000; // 10 giây

  // Kiểm tra user timeout định kỳ
  setInterval(() => {
    const now = Date.now();
    Object.keys(users).forEach((userId) => {
      if (
        !users[userId].isOnline &&
        now - users[userId].lastDisconnect > USER_TIMEOUT
      ) {
        delete users[userId]; // Xóa sau khi hết thời gian chờ
      }
    });
  }, 5000);

  io.on("connection", (socket) => {
    console.log(socket.id);

    // CHAT MESSAGE
    socket.on("SEND_MSG", async (msg) => {
      console.log("MSG FROM FRONTEND", msg);
      const isSaved = await saveMsg(msg);

      // Dừng typing sau khi tin nhắn đc gửi
      const userId = msg.sender._id;
      const conversationId = msg.receiver._id;
      await removeTypingStatus(userId, conversationId);

      if (msg.receiver.type === 1) {
        // chat đơn
        io.to(msg.receiver.socketId)
          .to(msg.sender.socketId)
          .emit("RECEIVED_MSG", isSaved);
      } else if (msg.receiver.type === 2) {
        // chat nhóm
        const groupMembers = msg.receiver.members || [];
        groupMembers.forEach((memberId) => {
          const member = users[memberId];
          if (member && member.socketId) {
            io.to(member.socketId).emit("RECEIVED_MSG", isSaved);
          }
        });
      }
    });

    socket.on("RECALL", (msg) => {
      let senderId = msg.sender._id;
      let receiverId = msg.receiver._id;

      if (users[receiverId]?.socketId && msg.receiver?.members.length === 0) {
        io.to(users[senderId].socketId)
          .to(users[receiverId].socketId)
          .emit("RECALL_MSG", msg);
      } else {
        const groupMembers = msg.receiver.members || [];
        groupMembers.forEach((memberId) => {
          const member = users[memberId];
          if (member && member.socketId) {
            io.to(member.socketId).emit("RECALL_MSG", msg);
          }
        });
      }
    });

    // CALL
    // Bước 1: Đăng ký user với heartbeat
    const signalQueue = {};

    socket.on("register", (userId) => {
      users[userId] = {
        socketId: socket.id,
        lastActivity: Date.now(),
        streams: [], // 👈 Thêm trường để theo dõi stream
        isOnline: true, // Thêm trạng thái online
      };

      console.log("User registered:", users);

      // Gửi lại các tín hiệu trong hàng đợi nếu có -> chờ refresh token
      if (signalQueue[userId]) {
        signalQueue[userId].forEach(({ signal, senderSocketId }) => {
          socket.emit("signal", { signal, senderSocketId });
        });
        delete signalQueue[userId];
      }

      // Gửi danh sách user online cho tất cả client
      io.emit(
        "user-list",
        Object.keys(users)
          .filter((id) => users[id].isOnline)
          .map((id) => ({
            userId: id,
            socketId: users[id].socketId,
          }))
      );
    });

    // Bước 2: Xử lý gọi điện với kiểm tra online
    socket.on("call-user", ({ senderId, receiverId, offer }) => {
      // Thêm validate offer
      if (!offer || !offer.type || !offer.sdp) {
        return socket.emit("call-error", {
          to: senderId,
          message: "Invalid offer format",
        });
      }

      const receiver = users[receiverId];
      if (!receiver) {
        return socket.emit("call-error", {
          to: senderId,
          message: "User not found or offline",
        });
      }

      // Kiểm tra timeout
      if (Date.now() - receiver.lastActivity > USER_TIMEOUT) {
        delete users[receiverId];
        return socket.emit("call-error", {
          to: senderId,
          message: "User is offline",
        });
      }

      users[receiverId].lastActivity = Date.now();

      // Gửi đúng cấu trúc dữ liệu
      socket.to(receiver.socketId).emit("incoming-call", {
        senderId,
        offer,
        callerSocketId: socket.id,
      });

      // Gửi signal riêng biệt
      socket.to(receiver.socketId).emit("signal", {
        signal: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    });

    // Bước 3: Chuyển tiếp tín hiệu WebRTC với buffer -> khi chấp nhận cuộc gọi
    socket.on("relay-signal", ({ targetUserId, signal }) => {
      if (!targetUserId || !signal || !signal.type) {
        console.error("Thiếu thông tin bắt buộc:", { targetUserId, signal });
        return socket.emit("call-error", {
          message: "Thiếu thông tin tín hiệu hoặc người dùng đích",
        });
      }

      const target = users[targetUserId];
      if (!target || !target.isOnline) {
        console.error(
          "Người dùng đích không tồn tại:",
          targetUserId,
          "answer id: ",
          socket.id
        );

        if (!signalQueue[targetUserId]) signalQueue[targetUserId] = [];
        signalQueue[targetUserId].push({ signal, senderSocketId: socket.id });
        return socket.emit("call-error", {
          message: "Người dùng đích không online",
        });
      }

      const normalizedSignal = {
        type: signal.type,
        sdp: signal.sdp,
        candidate: signal.candidate,
        sdpMid: signal.sdpMid || "0",
        sdpMLineIndex: signal.sdpMLineIndex || 0,
      };

      socket.to(target.socketId).emit("signal", {
        signal: normalizedSignal,
        senderSocketId: socket.id,
      });
    });

    // Heartbeat giữ kết nối
    socket.on("heartbeat", (userId) => {
      if (users[userId]) {
        users[userId].lastActivity = Date.now();
      }
    });

    socket.on("check-user", ({ userId }, callback) => {
      const isOnline = !!users[userId];
      callback({ isOnline });
    });

    // Bước 4: Xử lý từ chối cuộc gọi
    socket.on("end-call", ({ targetUserId }) => {
      console.log("Received end-call for target:", targetUserId);
      const target = users[targetUserId];
      if (target && target.isOnline) {
        socket.to(target.socketId).emit("call-ended");
        console.log("Sent call-ended to:", targetUserId);
      } else {
        console.log("Target user not online:", targetUserId);
      }
    });

    // thêm bạn
    socket.on("REQ_ADD_fRIEND", async (response) => {
      let user1 = users[response.fromUser];
      let user2 = users[response.toUser];
      if (user1 && !user2) {
        io.to(user1.socketId).emit("RES_ADD_FRIEND");
      } else if (user2 && !user1) {
        io.to(user2.socketId).emit("RES_ADD_FRIEND");
      } else {
        io.to(user1.socketId).to(user2.socketId).emit("RES_ADD_FRIEND");
      }
    });

    // hủy lời mời
    socket.on("REQ_CANCEL_fRIEND", async (response) => {
      let user1 = users[response.fromUser];
      let user2 = users[response.toUser];
      if (user1 && !user2) {
        io.to(user1.socketId).emit("RES_CANCEL_FRIEND");
      } else if (user2 && !user1) {
        io.to(user2.socketId).emit("RES_CANCEL_FRIEND");
      } else {
        io.to(user1.socketId).to(user2.socketId).emit("RES_CANCEL_FRIEND");
      }
    });

    // từ chối lời mời
    socket.on("REQ_REJECT_fRIEND", async (response) => {
      let user1 = users[response.fromUser];
      let user2 = users[response.toUser];
      if (user1 && !user2) {
        io.to(user1.socketId).emit("RES_REJECT_FRIEND");
      } else if (user2 && !user1) {
        io.to(user2.socketId).emit("RES_REJECT_FRIEND");
      } else {
        io.to(user1.socketId).to(user2.socketId).emit("RES_REJECT_FRIEND");
      }
    });

    // chấp nhận lời mời
    socket.on("REQ_ACCEPT_FRIEND", async (response) => {
      let user1 = users[response.user1];
      let user2 = users[response.user2];
      if (user1 && !user2) {
        io.to(user1.socketId).emit("RES_ACCEPT_FRIEND");
      } else if (user2 && !user1) {
        io.to(user2.socketId).emit("RES_ACCEPT_FRIEND");
      } else {
        io.to(user1.socketId).to(user2.socketId).emit("RES_ACCEPT_FRIEND");
      }
    });

    // chấp nhận lời mời nhóm
    socket.on("REQ_ACCEPT_GROUP", async (response) => {
      const groupMembers = response.members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_ACCEPT_GROUP", response);
        }
      });
    });

    // xóa bạn
    socket.on("REQ_DELETE_FRIEND", async (response) => {
      let user1 = users[response.user1];
      let user2 = users[response.user2];
      if (user1 && !user2) {
        io.to(users[response.user1].socketId).emit("RES_DELETE_FRIEND");
      } else if (user2 && !user1) {
        io.to(users[response.user2].socketId).emit("RES_DELETE_FRIEND");
      } else {
        io.to(users[response.user1].socketId)
          .to(users[response.user2].socketId)
          .emit("RES_DELETE_FRIEND");
      }
    });

    // manage permissions member group
    socket.on("REQ_MEMBER_PERMISSION", async (response) => {
      const groupMembers = response[0].members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_MEMBER_PERMISSION", response);
        }
      });
    });

    // update deputy
    socket.on("REQ_UPDATE_DEPUTY", async (response) => {
      const groupMembers = response[0]?.members || Object.keys(users);
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_UPDATE_DEPUTY", response);
        }
      });
    });

    // trans leader
    socket.on("REQ_TRANS_LEADER", async (response) => {
      console.log('newLeader ',users[response.newLeader.sender._id]);
      console.log('oldLeader ',users[response.oldLeader.sender._id]);
      
      io.to(users[response.newLeader.sender._id].socketId)
        .to(users[response.oldLeader.sender._id].socketId)
        .emit("RES_TRANS_LEADER", response);
    });

    // create group
    socket.on("REQ_CREATE_GROUP", async (response) => {
      const groupMembers = response[0].members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_CREATE_GROUP", response);
        }
      });
    });

    // remove member
    socket.on("REQ_REMOVE_MEMBER", async (response) => {
      const groupMembers = response.all || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId._id];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_REMOVE_MEMBER", response);
        }
      });
    });

    // DissolveGroup
    socket.on("REQ_DISSOLVE_GROUP", async (response) => {
      const groupMembers = response.members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_DISSOLVE_GROUP");
        }
      });
    });

    // add member group
    socket.on("REQ_ADD_GROUP", async (response) => {
      const groupMembers = response.members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_ADD_GROUP", response);
        }
      });
    });

    // call
    socket.on("REQ_CALL", async (from, to) => {
      const groupMembers = to.members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_CALL", from, to);
        }
      });
    });

    socket.on("REQ_END_CALL", (from, to) => {
      const groupMembers = to.members || [];
      groupMembers.forEach((memberId) => {
        const member = users[memberId];
        if (member && member.socketId) {
          io.to(member.socketId).emit("RES_END_CALL", from, to);
        }
      });
    });

    // update avatar
    socket.on("REQ_UPDATE_AVATAR", async (response) => {
      if (!response) {
        io.emit("RES_UPDATE_AVATAR");
      } else {
        const groupMembers = response.receiver.members || [];
        groupMembers.forEach((memberId) => {
          const member = users[memberId];
          if (member && member.socketId) {
            io.to(member.socketId).emit("RES_UPDATE_AVATAR", response);
          }
        });
      }
    });

    socket.on("disconnect", async () => {
      removeUser(socket.id);
      io.emit("USER_ADDED", onlineUsers);
      //
      Object.keys(users).forEach(async (userId) => {
        if (users[userId].socketId === socket.id) {

        // Xử lý Redis Cloud - tìm và xóa các key typing của user này
        try {
          const keys = await keysAsync(`typing:*:${userId}`);
          
          if (keys && keys.length > 0) {
            for (const key of keys) {
              await delAsync(key);
              console.log(`Redis Cloud - Removed typing key: ${key}`);
            }
          }
        } catch (redisError) {
          console.error("Redis Cloud Error during disconnect:", redisError);
        }

          users[userId].isOnline = false; // Đánh dấu offline thay vì xóa
          users[userId].lastDisconnect = Date.now(); // Lưu thời điểm ngắt kết nối

          // Thông báo kết thúc cuộc gọi cho các user khác nếu đang trong cuộc gọi
          Object.keys(users).forEach((otherUserId) => {
            if (otherUserId !== userId && users[otherUserId].isOnline) {
              socket.to(users[otherUserId].socketId).emit("call-ended");
            }
          });

          // Cập nhật danh sách user online cho tất cả client
          io.emit(
            "user-list",
            Object.keys(users)
              .filter((id) => users[id].isOnline)
              .map((id) => ({
                userId: id,
                socketId: users[id].socketId,
              }))
          );
        }
      });
    });

    socket.on("REACTION", async (data) => {
      console.log("Received reaction event:", data);
      
      // Lấy thông tin cần thiết
      const { messageId, userId, username, emoji, receiver } = data;
      
      // Lưu reaction vào database
      const result = await chatService.handleReaction(messageId, userId, emoji);
      
      if (result.EC === 0) {
        // Thêm result vào data để gửi dữ liệu nhất quán về clients
        data.success = true;
        
        // Broadcast tới tất cả người dùng trong cuộc trò chuyện
        if (receiver.type === 1) { // Chat cá nhân
          // Tìm socketId của người nhận
          const receiverUser = users[receiver._id];
          const senderUser = users[userId];
          
          // Gửi đến người gửi (để cập nhật trên các thiết bị khác)
          if (senderUser) {
            io.to(senderUser.socketId).emit("RECEIVED_REACTION", data);
          }
          
          // Gửi đến người nhận
          if (receiverUser) {
            io.to(receiverUser.socketId).emit("RECEIVED_REACTION", data);
          }
        } else if (receiver.type === 2) { // Chat nhóm
          // Gửi đến tất cả thành viên trong nhóm
          if (receiver.members && receiver.members.length > 0) {
            receiver.members.forEach(memberId => {
              const memberUser = users[memberId];
              if (memberUser) {
                io.to(memberUser.socketId).emit("RECEIVED_REACTION", data);
              }
            });
          }
        }
      } else {
        console.error("Failed to save reaction:", result.EM);
        // Thông báo lỗi chỉ cho người gửi
        const senderUser = users[userId];
        if (senderUser) {
          io.to(senderUser.socketId).emit("REACTION_ERROR", {
            messageId,
            error: result.EM
          });
        }
      }
    });

    //Xử lý typing
    socket.on("TYPING", async (data) => {
      try {
        const { userId, username, receiver } = data;
        const conversationId = receiver._id;

        // Lưu trạng thái typing vào Redis Cloud với TTL
        const saved = await setTypingStatus(userId, conversationId, username);
        if (!saved) {
          console.error("Failed to save typing status to Redis Cloud");
        }

        // Broadcast trạng thái typing
        if (receiver.type === 1) { // Chat cá nhân
          const receiverUser = users[receiver._id];
          if (receiverUser && receiverUser.isOnline) {
            io.to(receiverUser.socketId).emit("USER_TYPING", { 
              userId, 
              username, 
              conversationId 
            });
          }
        } else if (receiver.type === 2) { // Chat nhóm
          if (receiver.members && receiver.members.length > 0) {
            receiver.members
              .filter(memberId => memberId !== userId)
              .forEach(memberId => {
                const memberUser = users[memberId];
                if (memberUser && memberUser.isOnline) {
                  io.to(memberUser.socketId).emit("USER_TYPING", { 
                    userId, 
                    username, 
                    conversationId 
                  });
                }
              });
          }
        }
      } catch (error) {
        console.error("Error processing typing event:", error);
      }
    });

    //Dừng typing
    socket.on("STOP_TYPING", async (data) => {
      try {
        const { userId, receiver } = data;

        // Kiểm tra cả userId và receiver trước khi xử lý
        if (!userId || !receiver || !receiver._id) {
          console.warn("Invalid STOP_TYPING data received:", data);
          return; 
        }

        const conversationId = receiver._id;

        // Xóa trạng thái typing từ Redis Cloud
        const removed = await removeTypingStatus(userId, conversationId);
        if (!removed) {
          console.error("Failed to remove typing status from Redis Cloud");
        }

        // Broadcast sự kiện dừng typing
        if (receiver.type === 1) { // Chat cá nhân
          const receiverUser = users[receiver._id];
          if (receiverUser && receiverUser.isOnline) {
            io.to(receiverUser.socketId).emit("USER_STOP_TYPING", { 
              userId, 
              conversationId 
            });
          }
        } else if (receiver.type === 2) { // Chat nhóm
          if (receiver.members && receiver.members.length > 0) {
            receiver.members
              .filter(memberId => memberId !== userId)
              .forEach(memberId => {
                const memberUser = users[memberId];
                if (memberUser && memberUser.isOnline) {
                  io.to(memberUser.socketId).emit("USER_STOP_TYPING", { 
                    userId, 
                    conversationId 
                  });
                }
              });
          }
        }
      } catch (error) {
        console.error("Error processing stop typing event:", error);
      }
    });

    //Đánh dấu một tin nhắn đã đọc
    socket.on("MARK_READ", async (data) => {
      const { messageId, userId, conversationId } = data;
      
      try {
        // Tìm tin nhắn đó
        const message = await Message.findById(messageId);
        if (!message) return;

        // Gửi thông báo cho người gửi tin nhắn
        const senderSocketId = users[message.sender._id]?.socketId;
        
        if (senderSocketId) {
          io.to(senderSocketId).emit("MESSAGE_READ", {
            messageId,
            userId,
            conversationId
          });
        }
        
        // Nếu là chat nhóm, thông báo cho tất cả thành viên
        if (message.receiver.members && message.receiver.members.length > 0) {
          message.receiver.members.forEach(memberId => {
            if (memberId.toString() !== userId) {
              const memberSocketId = users[memberId]?.socketId;
              if (memberSocketId) {
                io.to(memberSocketId).emit("MESSAGE_READ", {
                  messageId,
                  userId,
                  conversationId
                });
              }
            }
          });
        }
      } catch (error) {
        console.error("Error in MARK_READ socket event:", error);
      }
    });

    // Đánh dấu tất cả tin nhắn là đã đọc
    socket.on("MARK_ALL_READ", async (data) => {
      const { userId, conversationId } = data;
      
      try {
        // Tìm người có tin nhắn chưa đọc trong cuộc hội thoại
        const unreadMessages = await Message.find({
          "receiver._id": conversationId,
          "sender._id": { $ne: userId },
          readBy: { $ne: userId }
        });
        
        // Gửi thông báo đến người gửi các tin nhắn
        const senderIds = [...new Set(unreadMessages.map(msg => msg.sender._id.toString()))];
        
        senderIds.forEach(senderId => {
          const senderSocketId = users[senderId]?.socketId;
          if (senderSocketId) {
            io.to(senderSocketId).emit("ALL_MESSAGES_READ", {
              userId,
              conversationId
            });
          }
        });
        
      } catch (error) {
        console.error("Error in MARK_ALL_READ socket event:", error);
      }
    });

  });
};

module.exports = socketInit;
