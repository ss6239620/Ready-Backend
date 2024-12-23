const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`New connection`);

    socket.on('setup', (userData) => {
      socket.join(userData._id);
      socket.emit('connected');
    });

    socket.on('join_chat', (room) => {
      socket.join(room);
      console.log('User joined room: ', room);
    });

    socket.on('typing', (room, user) => socket.in(room).emit('typing', user));

    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

    socket.on('new_message', (newMessageReceived) => {
      var chat = newMessageReceived.chat_room_id;

      if (!chat.chat_room_members) return console.log('chat.chat_room_members not defined');

      chat.chat_room_members.forEach((member) => {
        if (member._id == newMessageReceived.sender._id) return;

        socket.in(member._id).emit('message_received', newMessageReceived)
      })
    });

    socket.off('setup', (userData) => {
      console.log('User Disconnected');
      socket.leave(userData._id)
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

  });

  return io;
};

module.exports = { initSocket };