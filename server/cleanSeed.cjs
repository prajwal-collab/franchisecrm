require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const fs = require('fs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const data = JSON.parse(fs.readFileSync('./seedData.json', 'utf8'));

    const mapped = data.map(d => ({
      name: d['District Name'],
      status: d['Status'],
      notes: "State: " + d['State'] + " | Inquiries: " + d['Inquiry Count'] + " | Price: " + d['Price'],
      createdDate: new Date()
    }));
    
    const existing = await District.find({ name: { $in: mapped.map(m => m.name) } });
    const existingNames = new Set(existing.map(e => e.name));
    
    let toInsert = [];
    mapped.forEach(m => {
       if (!existingNames.has(m.name)) {
         toInsert.push(m);
       }
    });

    if (toInsert.length > 0) {
      await District.insertMany(toInsert);
      console.log('Inserted ' + toInsert.length + ' districts.');
    } else {
      console.log('All 25 districts already exist in the database.');
    }

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
