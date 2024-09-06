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

app.use(express.static('public'));
app.use(express.json()); // Middleware to parse JSON bodies

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

// Endpoint to create a new room
app.post('/create-room', async (req, res) => {
  try {
    const { room, username } = req.body;

    if (!room || !username) {
      return res.status(400).json({ error: 'Room name and username are required' });
    }

    const db = await connectDB();
    const roomsCollection = db.collection('rooms');

    // Store the room name and the username of the creator in the database
    await roomsCollection.updateOne(
      { roomName: room },
      { $set: { roomName: room, createdBy: username } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', (socket) => {
  // Handle joining a room
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
    const messagesCollection = db.collection('messages');
    const chatHistory = await messagesCollection.find({ room: user.room }).toArray();
    socket.emit('chatHistory', chatHistory);

    // Send user and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

    // Send the list of rooms created by the current user
    socket.emit('userRooms', await getUserRooms(user.username));
  });

  // Handle new chat messages
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

  // Handle adding a new room
  socket.on('addRoom', async (room) => {
    const user = getCurrentUser(socket.id);
    const db = await connectDB();
    const roomsCollection = db.collection('rooms');

    await roomsCollection.updateOne(
      { roomName: room },
      { $set: { roomName: room, createdBy: user.username } },
      { upsert: true }
    );

    console.log('New room added:', room);

    // Emit an event to all connected clients to update the room list
    io.emit('roomAdded', room);
  });

  // Handle retrieving rooms for a specific user
  socket.on('getUserRooms', async (username) => {
    try {
      const db = await connectDB();
      const roomsCollection = db.collection('rooms');

      // Fetch all rooms created by the user
      const rooms = await roomsCollection.find({ createdBy: username }).toArray();

      // Send the room list to the client
      socket.emit('userRooms', rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessage('Admin', `${user.username} has left the chat`));

      // Send updated room and user info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

  socket.on('create-private-room', async ({ withUser }) => {
    try {
      const user = getCurrentUser(socket.id);
      const roomName = generateRoomName(user.username, withUser); // Generate a consistent room name
  
      // Store the room name in the database
      const db = await connectDB();
      const roomsCollection = db.collection('rooms');
      await roomsCollection.updateOne(
        { roomName },
        { $set: { roomName, createdBy: user.username, privateWith: withUser } },
        { upsert: true }
      );
  
      // Send the room name back to the client
      socket.emit('roomCreated', roomName);
    } catch (error) {
      console.error('Error creating private room:', error);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Endpoint to create a private room via HTTP
app.post('/create-private-room', async (req, res) => {
  try {
    const { withUser, username } = req.body;

    if (!withUser || !username) {
      return res.status(400).json({ error: 'User to chat with and your username are required' });
    }

    // Generate a consistent room name
    const usernames = [username, withUser].sort();
    const roomName = `${usernames[0]}-${usernames[1]}`;

    // Store the private room information
    const db = await connectDB();
    const roomsCollection = db.collection('rooms');

    await roomsCollection.updateOne(
      { roomName },
      { $set: { roomName, createdBy: username, privateWith: withUser } },
      { upsert: true }
    );

    // Send the room name back to the client
    res.status(200).json({ room: roomName });
  } catch (error) {
    console.error('Error creating private room:', error);
    res.status(500).send('Internal Server Error');
  }
});
