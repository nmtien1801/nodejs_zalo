const express = require("express");
const AuthRoutes = require("./routes/authRoute");
const UploadRoutes = require("./routes/uploadRoutes");
const configCORS = require("./config/cors");
const connectDB = require("./config/connectDB");
const http = require("http");
const socketInit = require("./socket/index");

const ChatRoute = require("./routes/chatRoutes");
const RoomChatRoutes = require("./routes/roomChatRoutes");
const FriendRequestRoutes = require("./routes/friendRequestRoutes");

const app = express();
const server = http.createServer(app);



configCORS(app);

// Middleware để phân tích cú pháp JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
connectDB();

AuthRoutes(app);
ChatRoute(app);
RoomChatRoutes(app);
FriendRequestRoutes(app);
UploadRoutes(app)

// =========================== Socket

socketInit(server);



// =================================================================
app.use((req, res) => {
  return res.send("404 not found");
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`>>>backend is running on the port ${PORT}`);
});
