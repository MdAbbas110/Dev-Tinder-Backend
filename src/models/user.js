//User schema what field user will have in database

const mongoose = require("mongoose");

const { Schema } = mongoose();

const userSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  age: { type: Number },
  gender: { type: String },
  password: { type: String },
});

module.exports = mongoose.model("User", userSchema);
