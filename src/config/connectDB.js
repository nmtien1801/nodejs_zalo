const mongoose = require("mongoose");
require("dotenv").config();
const Conversation = require("../models/conversation");
const Permission = require("../models/permission");

const connectDB = async () => {
  try {
    // Kết nối đến MongoDB với tên cơ sở dữ liệu
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected to database: ${process.env.DATABASE_NAME}`);

    // tạo newConversation
    const conversations = [
      {
        sender: { _id: new mongoose.Types.ObjectId() },
        receiver: {
          _id: new mongoose.Types.ObjectId(),
          username: "Alice",
          phone: "0123456789",
          permission: [1, 2, 3, 4, 5],
        },
        message: "Chào bạn!",
        time: "20/04/2025",
        startTime: new Date(),
        avatar: "/images/alice.jpg",
        members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        type: 1, // person
        role: "leader",
      },
    ];

    // tạo permissions
    const permissions = [
      { code: 1, desc: "Thay đổi tên & ảnh đại diện của nhóm" },
      { code: 2, desc: "Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại" },
      { code: 3, desc: "Tạo mới ghi chú, nhắc hẹn" },
      { code: 4, desc: "Tạo mới bình chọn" },
      { code: 5, desc: "Gửi tin nhắn" },
    ];

    // Conversation.insertMany(conversations);
    // await Permission.insertMany(permissions);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
