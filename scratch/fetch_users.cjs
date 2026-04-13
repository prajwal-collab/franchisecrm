require('dotenv').config();
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String
});
const User = mongoose.model('User', UserSchema);

async function fetchUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const users = await User.find();
    console.log('--- FOUND USERS ---');
    users.forEach(u => {
      console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Password: ${u.password}, ID: ${u.id}, _ID: ${u._id}`);
    });
    console.log('-------------------');
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await mongoose.connection.close();
  }
}

fetchUsers();
