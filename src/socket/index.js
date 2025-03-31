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

      // Cập nhật hoạt động
      users[receiverId].lastActivity = Date.now();

      socket.to(receiver.socketId).emit("incoming-call", {
        senderId,
        offer,
        callerSocketId: socket.id, // Thêm thông tin socket caller
      });

      io.to(receiver.socketId).emit("signal", { signal: offer });
    });

    // Bước 3: Chuyển tiếp tín hiệu WebRTC với buffer -> khi chấp nhận cuộc gọi
    socket.on("relay-signal", ({ targetUserId, signal }) => {
      const target = users[targetUserId];

      if (target) {
        socket.to(target.socketId).emit("signal", {
          ...signal,
          senderSocketId: socket.id, // Thêm thông tin sender
        });
      }
    });

    // Heartbeat
    socket.on("heartbeat", (userId) => {
      if (users[userId]) {
        users[userId].lastActivity = Date.now();
      }
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
