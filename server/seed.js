require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const { Schema, model } = mongoose;

// Models (Redefined for seeding script reliability)
const LeadSchema = new Schema({
  firstName: String, lastName: String, phone: String, email: String, 
  districtId: String, profession: String, investmentCapacity: String, 
  source: String, stage: String, score: Number, assignedTo: String, 
  notes: String, createdDate: Date, updatedDate: Date
});
const Lead = mongoose.models.Lead || model('Lead', LeadSchema);

const DistrictSchema = new Schema({
  name: String, status: { type: String, default: 'Available' },
  soldDate: Date, franchiseeId: String, createdDate: Date
});
const District = mongoose.models.District || model('District', DistrictSchema);

const UserSchema = new Schema({ id: String, name: String, email: String, role: String, password: String, avatar: String });
const User = mongoose.models.User || model('User', UserSchema);

const districtsList = JSON.parse(fs.readFileSync('./districts.json', 'utf8'));

const DEMO_USERS = [
  { id: 'u1', name: 'Arjun Sharma',    email: 'admin@earlyjobs.co.in',  role: 'Admin',  password: 'admin123',  avatar: 'AS' },
  { id: 'u2', name: 'Priya Mehta',     email: 'closer@earlyjobs.co.in', role: 'Closer', password: 'closer123', avatar: 'PM' },
  { id: 'u3', name: 'Rahul Verma',     email: 'sdr1@earlyjobs.co.in',   role: 'SDR',    password: 'sdr123',    avatar: 'RV' },
  { id: 'u4', name: 'Sneha Patel',     email: 'sdr2@earlyjobs.co.in',   role: 'SDR',    password: 'sdr456',    avatar: 'SP' },
  { id: 'u5', name: 'Kiran Reddy',     email: 'viewer@earlyjobs.co.in', role: 'Viewer', password: 'viewer123', avatar: 'KR' },
];

async function seed() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected! Wiping old data...');

  await Promise.all([
    Lead.deleteMany({}),
    District.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('🌱 Inserting 700+ Districts...');
  const districts = districtsList.map(name => ({ name, status: 'Available', createdDate: new Date() }));
  await District.insertMany(districts);

  console.log('👤 Inserting Demo Users...');
  await User.insertMany(DEMO_USERS);

  console.log('✨ MIGRATION SUCCESSFUL! Database is ready.');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ SEEDING FAILED:', err.message);
  console.log('Troubleshooting: Ensure your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas.');
  process.exit(1);
});
