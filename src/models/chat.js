const mongoose = require('mongoose');

// separate the message schema from the chat schema
const chatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ],
  messages: [chatMessageSchema],
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Chat };
