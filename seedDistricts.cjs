require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./server/models/District');

async function seedDistricts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Fetching Indian districts data from Github...');
    
    // Fetch data from GitHub raw
    const response = await fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json');
    if (!response.ok) throw new Error('Failed to fetch JSON from GitHub');
    const data = await response.json();
    
    // Transform into CRM schema format
    const crmDistricts = [];
    data.states.forEach(stateObj => {
      stateObj.districts.forEach(distName => {
        crmDistricts.push({
          name: distName + ' (' + stateObj.state + ')',
          state: stateObj.state,
          status: 'Available',
          price: Math.floor(Math.random() * 20 + 30) * 100000, // randomly between 30L and 50L
          inquiryCount: 0
        });
      });
    });

    console.log(`Found ${crmDistricts.length} districts. Processing...`);
    
    // Clean old districts or just insert
    // Since name is unique, we will use insertMany with ordered: false to skip duplicates
    try {
      const results = await District.insertMany(crmDistricts, { ordered: false });
      console.log(`✅ Seeding Complete! Imported ${results.length} districts into the database directly.`);
    } catch (insertErr) {
      if (insertErr.code === 11000) {
        console.log(`✅ Seeding Complete! Duplicates ignored.`);
      } else {
        throw insertErr;
      }
    }
  } catch (err) {
    if (err.code !== 11000) {
      console.error('Error seeding districts:', err);
    }
  } finally {
    process.exit(0);
  }
}

seedDistricts();
