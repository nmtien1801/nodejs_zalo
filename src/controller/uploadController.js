const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const s3 = require("../config/s3Config");
const RoomChat = require("../models/roomChat");

const uploadAvatar = async (req, res) => {
  const file = req.file;

  const fileStream = fs.createReadStream(file.path);
  const key = `media/${Date.now()}_${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
    ACL: "public-read",
  });

  try {
    await s3.send(command);
    fs.unlinkSync(file.path); // xoá file tạm sau khi upload

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return res.status(200).json({
      EM: "Avatar uploaded successfully",
      EC: 0,
      DT: fileUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      EM: "Error uploading avatar",
      EC: -1,
      DT: "",
    });
  }
};

const uploadAvatarProfile = async (req, res) => {
  try {
    let {phone, avatar} = req.body;
    
    let user = await RoomChat.findOne({ phone: phone });
    if(user){
      user.avatar = avatar
      user.save()
    }

    return res.status(200).json({
      EM: "Avatar uploaded successfully",
      EC: 0,
      DT: user.avatar,
    });
  } catch (err) {
    console.error("uploadAvatarProfile error:", err);
    return res.status(500).json({
      EM: "Error uploadAvatarProfile",
      EC: -1,
      DT: "",
    });
  }
};

module.exports = { uploadAvatar , uploadAvatarProfile};
