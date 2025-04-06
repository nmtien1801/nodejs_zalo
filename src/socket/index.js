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
    const signalQueue = {};

    socket.on("register", (userId) => {
      users[userId] = {
        socketId: socket.id,
        lastActivity: Date.now(),
        streams: [], // 👈 Thêm trường để theo dõi stream
        isOnline: true, // Thêm trạng thái online
      };

      console.log("User registered:", users);
      
      // Gửi lại các tín hiệu trong hàng đợi nếu có
      if (signalQueue[userId]) {
        signalQueue[userId].forEach(({ signal, senderSocketId }) => {
          socket.emit("signal", { signal, senderSocketId });
        });
        delete signalQueue[userId];
      }

      // Gửi danh sách user online
      socket.emit(
        "user-list",
        Object.keys(users).filter((id) => users[id].isOnline)
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

    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("USER_ADDED", onlineUsers);
      //
      Object.keys(users).forEach((userId) => {
        if (users[userId].socketId === socket.id) {
          users[userId].isOnline = false; // Đánh dấu offline thay vì xóa
          users[userId].lastDisconnect = Date.now(); // Lưu thời điểm ngắt kết nối
        }
      });
    });
  });
};

module.exports = socketInit;
