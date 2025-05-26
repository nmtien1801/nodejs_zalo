const express = require("express");
const AuthRoutes = require("./routes/authRoute");
const UploadRoutes = require("./routes/uploadRoutes");
const configCORS = require("./config/cors");
const connectDB = require("./config/connectDB");
const http = require("http");
const socketInit = require("./socket/index");
const path = require("path");
const ChatRoute = require("./routes/chatRoutes");
const RoomChatRoutes = require("./routes/roomChatRoutes");
const FriendRequestRoutes = require("./routes/friendRequestRoutes");
const ProfileRoutes = require("./routes/profileRoutes");
const FriendShipRoutes = require("./routes/friendShipRoute");
const { monitorRedisConnection } = require("./utils/redisMonitor");

const app = express();
const server = http.createServer(app);


configCORS(app);

// Middleware để phân tích cú pháp JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Kết nối MongoDB
connectDB();

AuthRoutes(app);
ChatRoute(app);
RoomChatRoutes(app);
FriendRequestRoutes(app);
UploadRoutes(app)
ProfileRoutes(app)
FriendShipRoutes(app);

// =========================== Socket

socketInit(server);

// =================================================================
app.get("/api/ping", (req, res) => {
  res.send("PONG từ backend 🎯");
});

app.use((req, res) => {
  return res.send("404 not found");
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`>>>backend is running on the port ${PORT}`);

  //Giám sát trạng thái kết nối Redis
  monitorRedisConnection();
  console.log('Redis Cloud monitoring started');
});
