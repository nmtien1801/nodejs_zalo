const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  roleID: { type: String, required: false },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
