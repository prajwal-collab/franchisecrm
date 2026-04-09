const mongoose = require('mongoose');
const Lead = require('./models/Lead.js');

async function main() {
  try {
    const uri = "mongodb+srv://prajwal_db_user:zRb7zAg1OSDxlZDG@cluster0.u9sqjk4.mongodb.net/earlyjobs_crm?appName=Cluster0";
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const importedLeads = await Lead.find({ firstName: 'Imported' });
    console.log(`Found ${importedLeads.length} leads with first name "Imported"`);

    if (importedLeads.length > 0) {
       const result = await Lead.deleteMany({ firstName: 'Imported' });
       console.log(`Deleted ${result.deletedCount} items.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
