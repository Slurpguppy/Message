const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://wlratkowski:mongodb@cluster0.oxrvh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 

let client;

async function connectDB() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db('chatApp'); 
}

module.exports = connectDB;
