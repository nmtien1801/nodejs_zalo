import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use((req, res) => {
  return res.send("404 not found");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`>>> jwt backend is running on the port ${PORT}`);
});
