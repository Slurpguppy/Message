const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require('./db');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utils/users');
const formatMessage = require('./utils/messages');
const { getUserRooms } = require('./utils/rooms');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "https://message-davc.onrender.com", // Replace this with your Render app's URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.static('Public'));
app.use(express.json()); // Middleware to parse JSON bodies

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
