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

  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

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
    socket.on("join-call", (roomId, userId, user, receiver) => {
      socket.join(roomId);
      users[socket.id] = receiver;
      console.log(">>>>>>>userId: ", userId);
      
      socket.to(roomId).emit("user-connected", userId, user, receiver);      
    });

    socket.on("offer", (roomId, offer) => {
      
      socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", (roomId, answer) => {
      console.log(">>>>>>>>>>>>answer: ",  answer);

      socket.to(roomId).emit("answer", answer);
    });

    socket.on("candidate", (roomId, candidate) => {
      socket.to(roomId).emit("candidate", candidate);
    });

    socket.on("end-call", (roomId) => {
      socket.to(roomId).emit("call-ended");
      console.log(`Call in room ${roomId} ended`);
    });

    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("USER_ADDED", onlineUsers);
    });
  });
};

module.exports = socketInit;
