const mongoose = require("mongoose");
require("dotenv").config();
const Conversation = require("../models/conversation");

const connectDB = async () => {
  try {
    // Kết nối đến MongoDB với tên cơ sở dữ liệu
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected to database: ${process.env.DATABASE_NAME}`);

    // tạo newConversation
    // const newConversation = new Conversation({
    //   sender: { _id: new mongoose.Types.ObjectId() },
    //   receiver: {
    //     _id: new mongoose.Types.ObjectId(),
    //     username: "Cloud",
    //     phone: "0987654321",
    //   },
    //   message: "Xin chào!",
    //   time: "26/07/24",
    //   avatar: "/avatar.jpg",
    //   type: "1",
    // });

    // const newConversation2 = new Conversation({
    //   sender: { _id: new mongoose.Types.ObjectId() },
    //   receiver: {
    //     _id: new mongoose.Types.ObjectId(),
    //     username: "user",
    //     phone: "0987654322",
    //   },
    //   message: "Xin chào!",
    //   time: "26/07/24",
    //   avatar: "/avatar.jpg",
    //   type: "1",
    // });

    // const newConversation3 = new Conversation({
      //   sender: { _id: new mongoose.Types.ObjectId() },
      //   receiver: {
      //     _id: new mongoose.Types.ObjectId(),
      //     username: "Thư",
      //     phone: "0987654321",
      //   },
      //   message: "Xin chào!",
      //   time: "26/07/24",
      //   avatar: "/avatar.jpg",
      //   type: "1",
      // });
    // newConversation.save();
    // newConversation2.save();

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
