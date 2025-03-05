const http = require("http");
const express = require("express");
const app = express();
const AuthRoutes = require("./routes/authRoute");
const configCORS = require("./config/cors");

// Middleware để phân tích cú pháp JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configCORS(app);

AuthRoutes(app)

app.use((req, res) => {
  return res.send("404 not found");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`>>>backend is running on the port ${PORT}`);
});
