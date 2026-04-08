const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    // Check if connection is truly alive
    if (mongoose.connection.readyState === 1) return;
    isConnected = false;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 (often more stable on Vercel)
    };

    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, options);
    isConnected = conn.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    isConnected = false;
    throw err;
  }
};

module.exports = { connectDB, getIsConnected: () => isConnected };
