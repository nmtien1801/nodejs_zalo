const socket = require("socket.io");
const { saveMsg } = require("../controller/chatController");

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

      if (msg.receiver.type === 1 || msg.receiver.type === 3) {
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
        console.log("groupMembers", groupMembers);

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
      //người dùng onl
      if (users[response.toUser].socketId) {
        io.to(users[response.fromUser].socketId)
          .to(users[response.toUser].socketId)
          .emit("RES_ADD_FRIEND", response);
      }
      // người dùng off
      else {
        io.to(users[response.fromUser].socketId).emit("RES_ADD_FRIEND");
      }
    });

    // hủy lời mời
    socket.on("REQ_CANCEL_fRIEND", async (response) => {
      io.to(users[response.fromUser].socketId)
        .to(users[response.toUser].socketId)
        .emit("RES_CANCEL_FRIEND");
    });

    // từ chối lời mời
    socket.on("REQ_REJECT_FRIEND", async (response) => {
      io.to(users[response.fromUser].socketId)
        .to(users[response.toUser].socketId)
        .emit("RES_REJECT_FRIEND");
    });

    // chấp nhận lời mời
    socket.on("REQ_ACCEPT_FRIEND", async (response) => {



      io.emit("RES_ACCEPT_FRIEND");
    });

    // xóa bạn
    socket.on("REQ_DELETE_FRIEND", async (response) => {
      io.to(users[response.user1].socketId)
        .to(users[response.user2].socketId)
        .emit("RES_DELETE_FRIEND");
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

    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("USER_ADDED", onlineUsers);
      //
      Object.keys(users).forEach((userId) => {
        if (users[userId].socketId === socket.id) {
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
  });
};

module.exports = socketInit;
