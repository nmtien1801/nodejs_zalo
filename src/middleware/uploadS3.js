const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // nhớ tạo folder 'uploads' nếu chưa có
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "video/mpeg",
    "application/pdf", // PDF
    "application/msword", // Word .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word .docx
    "text/plain", // Text file .txt
    "application/vnd.ms-excel", // cho định dạng .xls (Excel cũ)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // cho định dạng .xlsx (Excel mới)
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and videos are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 100 }, // 100MB
});

module.exports = upload;
