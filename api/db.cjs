const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing');

    console.log('🔄 Connecting to Atlas (Native API Layer)...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log('✅ Connected');
  } catch (err) {
    console.error(`❌ Connection Error: ${err.message}`);
    isConnected = false;
    throw err;
  }
};

module.exports = { connectDB, getIsConnected: () => isConnected };
