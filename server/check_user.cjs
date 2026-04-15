require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./db.cjs');

async function checkUser() {
  try {
    await connectDB();
    const UserSchema = new mongoose.Schema({
      id: String, name: String, email: { type: String, unique: true }, role: String, password: String, avatar: String
    });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const email = 'dipanjana@earlyjobs.in';
    const user = await User.findOne({ email });

    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('User not found with email:', email);
      const allUsers = await User.find({}, { name: 1, email: 1, role: 1 });
      console.log('All Users:', JSON.stringify(allUsers, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkUser();
