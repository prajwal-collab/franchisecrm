const mongoose = require('mongoose');
require('dotenv').config();
const Lead = require('../server/models/Lead');

async function checkLeads() {
  console.log('Connecting to MongoDB...');
  try {
    // Increase timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected!');
    const total = await Lead.countDocuments();
    console.log(`Total Leads: ${total}`);
    
    // Check most recent lead
    const lastLead = await Lead.findOne().sort({ createdDate: -1 });
    if (lastLead) {
      console.log(`Last Lead Created: ${lastLead.createdDate}`);
      console.log(`Name: ${lastLead.firstName} ${lastLead.lastName}`);
    } else {
      console.log('No leads found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkLeads();
