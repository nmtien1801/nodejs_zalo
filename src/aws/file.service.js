require("dotenv").config();
const { s3 } = require("./aws.helper");

const crypto = require("crypto");

const FILE_TYPE_MATCH = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

// Hàm tải file lên S3
async function uploadFile(file) {

    if (!file || !file.mimetype || FILE_TYPE_MATCH.indexOf(file.mimetype) === -1) {
        console.log("File MIME type:", file.mimetype);
        throw new Error(`File is invalid! Accepted types: ${FILE_TYPE_MATCH.join(", ")}`);
    }

    if (!file.originalname) {
        throw new Error("File must have an original name!");
    }

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME, // Tên bucket của bạn
        Key: `uploads/${Date.now()}_${crypto.randomBytes(25).toString("hex")}.${file.mimetype}`, // Đặt tên file
        //Key: `uploads/${Date.now()}_${crypto.randomBytes(16).toString("hex")}`,
        Body: file.buffer, // Nội dung của file tải lên
        ContentType: file.mimetype, // Kiểu file
        //ACL: 'public-read', // Quyền truy cập file
    };

    try {
        const data = await s3.upload(params).promise();
        console.log("Upload file success: ", data.Location);

        const url = `${data.Location}`
        return url; // Trả về URL file đã tải lên S3
    } catch (error) {
        throw new Error(`Error uploading file to S3: ${error.message}`);
    }
}

module.exports = { uploadFile };