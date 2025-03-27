const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://AbbasAbidi:OzrhnzktL9YyAxkz@devtinder.6bqqz.mongodb.net/devTinder"
  );
};

module.exports = connectDB;
