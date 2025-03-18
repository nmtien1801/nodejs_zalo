const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Kết nối đến MongoDB với tên cơ sở dữ liệu
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected to database: ${process.env.DATABASE_NAME}`);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
