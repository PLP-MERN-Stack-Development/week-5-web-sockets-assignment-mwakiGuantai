const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Example Message model (create this file if it doesn't exist)
const messageSchema = new mongoose.Schema({
  room: String,
  sender: String,
  recipient: String,
  message: String,
  time: String,
  type: String
});

const Message = mongoose.model('Message', messageSchema);

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store users: { socket.id: username }
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("online_users", Object.values(onlineUsers));
  });

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`${onlineUsers[socket.id]} joined room ${room}`);
  });

  socket.on("send_room_message", async ({ room, sender, message, time }) => {
    io.to(room).emit("receive_room_message", {
      sender,
      message,
      time,
      room,
    });
    try {
      await Message.create({
        room,
        sender,
        message,
        time,
        type: "room"
      });
    } catch (err) {
      console.error("Error saving room message:", err);
    }
  });

  socket.on("private_message", async ({ sender, recipient, message, time }) => {
    const roomId = [sender, recipient].sort().join("_"); // unique room name
    io.to(roomId).emit("receive_private_message", {
      sender,
      message,
      time,
    });
    try {
      await Message.create({
        room: roomId,
        sender,
        recipient,
        message,
        time,
        type: "private"
      });
    } catch (err) {
      console.error("Error saving private message:", err);
    }
  });

  socket.on("join_private_room", ({ sender, recipient }) => {
    const roomId = [sender, recipient].sort().join("_");
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    io.emit("online_users", Object.values(onlineUsers));
    console.log(`${username} left. Total online: ${Object.keys(onlineUsers).length}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

