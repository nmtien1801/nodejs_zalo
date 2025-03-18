const express = require("express");
const AuthRoutes = require("./routes/authRoute");
const configCORS = require("./config/cors");
const connectDB = require("./config/connectDB");
const app = express();

// Middleware để phân tích cú pháp JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

configCORS(app);

AuthRoutes(app)

app.use((req, res) => {
  return res.send("404 not found");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`>>>backend is running on the port ${PORT}`);
});
