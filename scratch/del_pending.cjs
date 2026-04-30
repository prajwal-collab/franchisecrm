const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const LeadSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  phone: String, email: String,
  districtId: String,
  stage: String,
  createdDate: { type: Date, default: Date.now },
});
const Lead = mongoose.model('Lead', LeadSchema);

async function run() {
  console.log('Connecting to:', process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1] : 'URI not set');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log('✅ Connected!\n');

    const total = await Lead.countDocuments();
    console.log(`📊 Total leads in DB: ${total}`);

    const pending = await Lead.countDocuments({
      $or: [{ districtId: null }, { districtId: '' }, { districtId: { $exists: false } }]
    });
    console.log(`📊 Leads with NO district (pending): ${pending}`);
    console.log(`📊 Leads with district: ${total - pending}\n`);

    // Show 5 sample pending leads
    const samples = await Lead.find({
      $or: [{ districtId: null }, { districtId: '' }, { districtId: { $exists: false } }]
    }).limit(5).lean();

    console.log('Sample pending leads:');
    samples.forEach(l => {
      console.log(`  - ${l.firstName} ${l.lastName} | Phone: ${l.phone} | Created: ${new Date(l.createdDate).toLocaleString('en-IN')}`);
    });

    const args = process.argv.slice(2);
    if (args.includes('--confirm')) {
      console.log(`\n🗑️  Deleting ${pending} leads with pending district...`);
      const result = await Lead.deleteMany({
        $or: [{ districtId: null }, { districtId: '' }, { districtId: { $exists: false } }]
      });
      console.log(`✅ Deleted: ${result.deletedCount} leads`);
      const remaining = await Lead.countDocuments();
      console.log(`📊 Remaining leads: ${remaining}`);
    } else {
      console.log('\n⚠️  DRY RUN - no leads deleted.');
      console.log('Run with --confirm to delete:');
      console.log('  node scratch/del_pending.cjs --confirm');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
