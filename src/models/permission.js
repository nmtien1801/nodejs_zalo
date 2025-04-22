const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      require: true,
    },
    desc: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Permission = mongoose.model("Permission", permissionSchema);

module.exports = Permission;


// const permissions = [
//     { code: 1, desc: 'Thay đổi tên & ảnh đại diện của nhóm' },
//     { code: 2, desc: 'Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại' },
//     { code: 3, desc: 'Tạo mới ghi chú, nhắc hẹn' },
//     { code: 4, desc: 'Tạo mới bình chọn' },
//     { code: 5, desc: 'Gửi tin nhắn' },
//   ];

//   await Permission.insertMany(permissions);