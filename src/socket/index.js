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
  const USER_TIMEOUT = 10000; // 10 giây

  // Kiểm tra user timeout định kỳ
  setInterval(() => {
    const now = Date.now();
    Object.keys(users).forEach((userId) => {
      if (now - users[userId].lastActivity > USER_TIMEOUT) {
        delete users[userId];
      }
    });
  }, 5000);

  io.on("connection", (socket) => {
    console.log(socket.id);

    // CHAT MESSAGE
    socket.on("SEND_MSG", async (msg) => {
      console.log(msg, "MSG FROM FRONTEND");
      const isSaved = await saveMsg(msg);

      io.to(msg.receiver.socketId)
        .to(msg.sender.socketId)
        .emit("RECEIVED_MSG", isSaved);
    });

    socket.on("DELETE_MSG", (msg) => {
      socket.to(msg.receiver.socketId).emit("DELETED_MSG", msg);
    });

    // CALL
    // Bước 1: Đăng ký user với heartbeat
    socket.on("register", (userId) => {
      users[userId] = {
        socketId: socket.id,
        lastActivity: Date.now(),
        streams: [], // 👈 Thêm trường để theo dõi stream
      };
      console.log("user: ", users);

      // Gửi danh sách user online
      socket.emit("user-list", Object.keys(users));
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
      if (!target) {
        console.error("Người dùng đích không tồn tại:", targetUserId);
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

    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("USER_ADDED", onlineUsers);
      //
      Object.keys(users).forEach((userId) => {
        if (users[userId].socketId === socket.id) {
          delete users[userId];
        }
      });
    });
  });
};

module.exports = socketInit;