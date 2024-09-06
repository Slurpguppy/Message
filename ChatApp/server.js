const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require('./db');
const { userJoin, getCurrentUser } = require('./utils/users');
const formatMessage = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Serve Socket.io client library
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});

// Endpoint to get all users
app.get('/users', async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', async (socket) => {
  socket.on('joinRoom', async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Store the user in the database
    const db = await connectDB();
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { username: user.username },
      { $set: { username: user.username, room: user.room } },
      { upsert: true }
    );

    // Fetch chat history from the database
    const collection = db.collection('messages');
    const chatHistory = await collection.find({ room: user.room }).sort({ timestamp: 1 }).toArray();
    socket.emit('chatHistory', chatHistory);

    // Send user and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
    });
  });

  socket.on('chatMessage', async (msg) => {
    const user = getCurrentUser(socket.id);
    const db = await connectDB();
    const collection = db.collection('messages');

    const newMessage = {
      username: user.username,
      message: msg,
      room: user.room,
      timestamp: new Date(),
    };

    await collection.insertOne(newMessage);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

