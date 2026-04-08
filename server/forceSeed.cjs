require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 40) + '...' : 'NO URI FOUND');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const District = require('./models/District');

    const ALL_25 = [
      { name: 'Surat', status: 'Sold', notes: 'State: Gujarat | Price: ₹118000 | Inquiries: 1' },
      { name: 'Mohali', status: 'Sold', notes: 'State: Punjab | Price: ₹118000 | Inquiries: 1' },
      { name: 'Chandigarh', status: 'Sold', notes: 'State: Chandigarh (UT) | Price: ₹118000 | Inquiries: 1' },
      { name: 'Rampur', status: 'Sold', notes: 'State: Uttar Pradesh | Price: ₹118000 | Inquiries: 1' },
      { name: 'Hyderabad', status: 'Sold', notes: 'State: Telangana | Price: ₹118000 | Inquiries: 1' },
      { name: 'Chennai', status: 'Sold', notes: 'State: Tamil Nadu | Price: ₹118000 | Inquiries: 1' },
      { name: 'Faridabad', status: 'Sold', notes: 'State: Haryana | Price: ₹118000 | Inquiries: 1' },
      { name: 'Bhopal', status: 'Sold', notes: 'State: Madhya Pradesh | Price: ₹118000 | Inquiries: 1' },
      { name: 'Chengalpattu', status: 'Sold', notes: 'State: Tamil Nadu | Price: ₹118000 | Inquiries: 1' },
      { name: 'Sonipat', status: 'Sold', notes: 'State: Haryana | Price: ₹118000 | Inquiries: 1' },
      { name: 'Patna', status: 'Sold', notes: 'State: Bihar | Price: ₹118000 | Inquiries: 1' },
      { name: 'Vishakhapatnam', status: 'Sold', notes: 'State: Andhra Pradesh | Price: ₹118000 | Inquiries: 1' },
      { name: 'Lucknow', status: 'Sold', notes: 'State: Uttar Pradesh | Price: ₹118000 | Inquiries: 1' },
      { name: 'Ghaziabad', status: 'Sold', notes: 'State: Uttar Pradesh | Price: ₹118000 | Inquiries: 1' },
      { name: 'Bangalore Urban', status: 'Sold', notes: 'State: Karnataka | Price: ₹118000 | Inquiries: 1' },
      { name: 'Coimbatore', status: 'Sold', notes: 'State: Tamil Nadu | Price: ₹118000 | Inquiries: 1' },
      { name: 'Gulbarga (Kalaburagi)', status: 'Sold', notes: 'State: Karnataka | Price: ₹118000 | Inquiries: 1' },
      { name: 'Bijapur (Vijayapura)', status: 'Sold', notes: 'State: Karnataka | Price: ₹118001 | Inquiries: 1' },
      { name: 'Ananthpur (Anantapur)', status: 'Sold', notes: 'State: Andhra Pradesh | Price: ₹118002 | Inquiries: 1' },
      { name: 'Ramnagara (Ramanagara)', status: 'Sold', notes: 'State: Karnataka | Price: ₹100000 | Inquiries: 1' },
      { name: 'Mangalore', status: 'Sold', notes: 'State: Karnataka | Price: ₹100000 | Inquiries: 1' },
      { name: 'Kurukshetra', status: 'Sold', notes: 'State: Haryana | Price: ₹118000 | Inquiries: 1' },
      { name: 'Bellary (Ballari)', status: 'Sold', notes: 'State: Karnataka | Price: ₹130000 | Inquiries: 1' },
      { name: 'Medchal - Malkajgiri', status: 'Sold', notes: 'State: Telangana | Price: ₹150000 | Inquiries: 1' },
      { name: 'Sikar', status: 'Sold', notes: 'State: Rajasthan | Price: ₹94300 | Inquiries: 1' }
    ];

    // Upsert each one by name - never fails on duplicates
    let inserted = 0;
    let updated = 0;
    for (const d of ALL_25) {
      const result = await District.findOneAndUpdate(
        { name: d.name },
        { $set: d },
        { upsert: true, new: true }
      );
      if (result.__v === undefined || result.createdDate > new Date(Date.now() - 5000)) {
        inserted++;
      } else {
        updated++;
      }
    }

    const total = await District.countDocuments();
    console.log('Done! DB now has ' + total + ' districts total.');
    console.log('Processed all 25 from the provided list.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
