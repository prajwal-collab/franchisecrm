const mongoose = require('mongoose');
require('dotenv').config();
const Lead = require('../server/models/Lead');

async function deleteImportedLeadsWithNoDistrict() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('✅ Connected!\n');

    // Count leads with no districtId or empty districtId
    const pending = await Lead.countDocuments({
      $or: [
        { districtId: null },
        { districtId: '' },
        { districtId: { $exists: false } }
      ]
    });

    console.log(`📊 Total leads with no/pending district: ${pending}`);

    const total = await Lead.countDocuments();
    console.log(`📊 Total leads in DB: ${total}`);
    console.log(`📊 Leads with district: ${total - pending}\n`);

    if (pending === 0) {
      console.log('Nothing to delete!');
      process.exit(0);
    }

    // Show sample of pending leads before deleting
    const samples = await Lead.find({
      $or: [
        { districtId: null },
        { districtId: '' },
        { districtId: { $exists: false } }
      ]
    }).limit(5).lean();

    console.log('Sample pending leads (first 5):');
    samples.forEach(l => {
      console.log(`  - ${l.firstName} ${l.lastName} | ${l.phone} | ${l.email} | Created: ${l.createdDate}`);
    });

    const args = process.argv.slice(2);
    if (args.includes('--confirm')) {
      console.log(`\n🗑️  Deleting ${pending} leads with pending district...`);
      const result = await Lead.deleteMany({
        $or: [
          { districtId: null },
          { districtId: '' },
          { districtId: { $exists: false } }
        ]
      });
      console.log(`✅ Deleted: ${result.deletedCount} leads`);

      const remaining = await Lead.countDocuments();
      console.log(`📊 Remaining leads: ${remaining}`);
    } else {
      console.log('\n⚠️  DRY RUN - no leads deleted.');
      console.log('Run with --confirm to actually delete:');
      console.log('  node scratch/delete_pending_district_leads.cjs --confirm');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

deleteImportedLeadsWithNoDistrict();
