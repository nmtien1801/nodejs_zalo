const mongoose = require("mongoose");
require("dotenv").config();
const Conversation = require("../models/conversation");

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
          phone: "0912345678",
        },
        message: "Chào bạn!",
        time: "20/04/2025",
        startTime: new Date(),
        avatar: "/images/alice.jpg",
        type: 1, // person
        role: "leader",
      },
      // {
      //   sender: { _id: new mongoose.Types.ObjectId() },
      //   receiver: {
      //     _id: new mongoose.Types.ObjectId(),
      //     username: "Group Support",
      //     phone: "0000000000",
      //   },
      //   message: "Chào nhóm!",
      //   time: "20/04/2025",
      //   type: 2, // group
      //   members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      //   avatar: "/images/group.png",
      //   role: "member",
      // },
      // {
      //   sender: { _id: new mongoose.Types.ObjectId() },
      //   receiver: {
      //     _id: new mongoose.Types.ObjectId(),
      //     username: "Cloud Bot",
      //     phone: "0999999999",
      //   },
      //   message: "Lưu trữ xong",
      //   time: "20/04/2025",
      //   type: 3, // cloud
      //   avatar: "/images/cloud.jpg",
      //   role: "member",
      // },
    ];

    // Conversation.insertMany(conversations);

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
