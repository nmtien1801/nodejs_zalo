require("dotenv").config();

/**
 * Cấu hình CORS để hạn chế API bị truy cập trái phép
 * @param {*} app - Express app
 */
const configCORS = (app) => {
  app.use((req, res, next) => {
    const allowedOrigins = [
      process.env.REACT_URL,
      process.env.REACT_NATIVE_URL,
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin); // Cho phép origin của request
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
};

module.exports = configCORS; // ✅ Sửa export
