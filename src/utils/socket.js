const crypto = require('crypto');
const socket = require('socket.io');
const { Chat } = require('../models/chat');

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash('sha256')
    .update([userId, targetUserId].sort().join('$'))
    .digest('hex');
};

const initializedSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinChat', ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + 'Joined room' + roomId);
      socket.join(roomId);
    });

    socket.on(
      'sendMessage',
      async ({ firstName, userId, targetUserId, text }) => {
        const roomId = getSecretRoomId(userId, targetUserId);
        console.log('sending the message ' + text);

        try {
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          // If this both user are chatting for the first time
          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();

          io.to(roomId).emit('messageReceived', { firstName, text });
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    );
  });
};

module.exports = initializedSocket;
