// utils/rooms.js
const connectDB = require('../db');

async function getUserRooms(username) {
  try {
    const db = await connectDB();
    const roomsCollection = db.collection('rooms');
    const messagesCollection = db.collection('messages');
    return await roomsCollection.find({ createdBy: username }).toArray();
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return [];
  }
}


module.exports = { getUserRooms };
