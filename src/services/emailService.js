require("dotenv").config(); // dùng env
const nodemailer = require("nodemailer");

let getBodyHTMLEmail = (receiverEmail, code) => {
  return `
        <h3> Xin chào ${receiverEmail}!</h3>
        <p> Veryfication code của bạn là </p>
        <h3> ${code} </h3>
  
        <p> Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.Nếu bạn có bất kì vấn đề nào, 
        vui lòng liên hệ với bộ phận hỗ trợ!</p>
  
        <div> <b>Trân trọng!</b> </div>
      `;
};

// search : nodemailer
let sendSimpleEmail = async (receiverEmail) => {
  try {
    // fortmat email chủ -> nơi gửi email đến client
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL_APP,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    let code = Math.floor(100000 + Math.random() * 900000); // random code

    // gửi mail tới đối tượng chủ transporter
    const info = await transporter.sendMail({
      from: `"Công Nghệ Mới👻" <${process.env.SEND_EMAIL}>`, // sender address
      to: receiverEmail, // email của client -> "a@example.com, b@example.com"
      subject: "Verification code", // Subject line
      html: getBodyHTMLEmail(receiverEmail, code), // html body -> lưu theo ngôn ngữ
    });
    return code;
  } catch (error) {
    console.log("check Err send email: ", error);
    return null;
  }
};

module.exports = { sendSimpleEmail};
