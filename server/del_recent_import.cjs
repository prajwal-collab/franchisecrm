// Deletes the last N inserted leads (by MongoDB _id order)
// Usage: node del_recent_import.cjs            <- dry run
//        node del_recent_import.cjs --confirm  <- actually deletes

const mongoose = require('mongoose');
require('dotenv').config();

const LeadSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  phone: String, email: String,
  districtId: String, stage: String,
  source: String,
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
});
const Lead = mongoose.model('Lead', LeadSchema);

const DELETE_COUNT = 500; // Number of most-recent leads to delete

async function run() {
  console.log('🔗 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
  });
  console.log('✅ Connected!\n');

  const total = await Lead.countDocuments();
  console.log(`📊 Total leads in DB: ${total}`);

  // Get the _ids of the last 500 inserted leads (highest _id = most recent)
  const last500 = await Lead.find({})
    .sort({ _id: -1 })
    .limit(DELETE_COUNT)
    .select('_id firstName lastName phone districtId')
    .lean();

  console.log(`📊 Last ${DELETE_COUNT} leads to be deleted: ${last500.length}`);
  console.log('\n🕐 Sample (first 5 in batch):');
  last500.slice(0, 5).forEach(l => {
    console.log(`  - ${l.firstName} ${l.lastName} | ${l.phone || 'no phone'} | districtId: ${l.districtId || 'NONE'}`);
  });
  console.log(`  ... and ${last500.length - 5} more`);

  const ids = last500.map(l => l._id);

  const args = process.argv.slice(2);
  if (args.includes('--confirm')) {
    console.log(`\n🗑️  Deleting last ${ids.length} leads...`);
    const result = await Lead.deleteMany({ _id: { $in: ids } });
    console.log(`✅ Deleted: ${result.deletedCount} leads`);
    const remaining = await Lead.countDocuments();
    console.log(`📊 Remaining leads: ${remaining}`);
  } else {
    console.log(`\n⚠️  DRY RUN — no leads deleted.`);
    console.log(`To delete the last ${DELETE_COUNT} leads, run:`);
    console.log(`  node del_recent_import.cjs --confirm`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done.');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Fatal Error:', err.message);
  process.exit(1);
});
