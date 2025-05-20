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
//     { code: 2, desc: 'thêm thành viên' },
//     { code: 3, desc: 'Gửi tin nhắn' },
//   ];

//   await Permission.insertMany(permissions);