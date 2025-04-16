const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const s3 = require("../config/s3Config");
const RoomChat = require("../models/roomChat");

const uploadAvatar = async (req, res) => {
  const file = req.file;
  console.log('>>>>> file ', req.file);
  
  if (!file) {
    return res.status(400).json({
      EM: "No file uploaded",
      EC: -1,
      DT: "",
    });
  }

  if (file.size > MAX_SIZE) {
    fs.unlinkSync(file.path); // xóa file tạm ngay nếu không hợp lệ
    return res.status(400).json({
      EM: "File size exceeds 100MB limit",
      EC: -1,
      DT: "",
    });
  }

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
    let { phone, avatar } = req.body;

    let user = await RoomChat.findOne({ phone: phone });
    if (user) {
      user.avatar = avatar;
      user.save();
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

const uploadAvatar2 = async (req, res) => {
  const { avatar, fileName, mimeType } = req.body;
  // console.log("req ", req.body);
  console.log("req.file ", req.file);

  let buffer;
  let type;

  // Trường hợp avatar là base64
  if (typeof avatar === "string" && avatar.startsWith("data:")) {
    const base64Data = avatar.split(",")[1];
    buffer = Buffer.from(base64Data, "base64");
    type = mimeType.split("/")[0]
  }
  // Trường hợp avatar là file (gửi từ FormData)
  else if (req.file) {
    const filePath = req.file.path;
    buffer = fs.readFileSync(filePath);
    type = req.file.mimetype.split("/")[0]
  }
  // Trường hợp không hợp lệ
  else {
    return res.status(400).json({ EM: "Invalid file format", EC: -1, DT: "" });
  }

  if (type === "image" && buffer.length > 100 * 1024 * 1024) {
    return res.status(400).json({ EM: "Image size must be under 100MB", EC: -1, DT: "" });
  }

  if (type === "video" && buffer.length > 100 * 1024 * 1024) {
    return res.status(400).json({ EM: "Video size must be under 100MB", EC: -1, DT: "" });
  }
  if (type === "application" && buffer.length > 100 * 1024 * 1024) {
    return res.status(400).json({ EM: "File size must be under 100MB", EC: -1, DT: "" });
  }

  const key = `media/${Date.now()}_${fileName || req.file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType || req.file.mimetype,
    ACL: "public-read",
  });

  try {
    await s3.send(command);
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

module.exports = { uploadAvatar, uploadAvatarProfile, uploadAvatar2 };
