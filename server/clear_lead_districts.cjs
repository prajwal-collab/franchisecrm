require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

async function clearDistricts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const LeadSchema = new mongoose.Schema({}, { strict: false });
    const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

    console.log('🧹 Clearing districtId for all leads...');
    const result = await Lead.updateMany({}, { $set: { districtId: null } });
    console.log(`✅ Updated ${result.modifiedCount} leads. They are now set to "Pending".`);

  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

clearDistricts();
