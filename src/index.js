const express = require("express");
const Filter = require("bad-words");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const public = path.join(__dirname, "../public");
const { generateMessage } = require("./utils/messages");
const { generateLocationMessage } = require("./utils/location");
const {
  getUser,
  addUser,
  removeUser,
  getUsersInRoom,
} = require("./utils/users");
app.use(express.static(public));

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (input, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(input)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, input));
    callback();
  });

  socket.on("sendLocation", (coordsObject, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coordsObject.latitude},${coordsObject.longitude}`
      )
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log("server is up");
});
