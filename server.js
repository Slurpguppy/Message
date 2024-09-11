const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require('./db');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utils/users');
const formatMessage = require('./utils/messages');
const { getUserRooms } = require('./utils/rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static('public', { index: 'index.html' }));
app.use(express.json()); // Middleware to parse JSON bodies

// Example route to serve the index.html (not needed if using express.static)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Catch-all route for 404 Not Found
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// All socket event handling here...

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});