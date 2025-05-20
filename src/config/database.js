const mongoose = require('mongoose');
const { MONGODB_DB_URL } = require('../../constants');

const connectDB = async () => {
  await mongoose.connect(MONGODB_DB_URL);
};

module.exports = connectDB;
