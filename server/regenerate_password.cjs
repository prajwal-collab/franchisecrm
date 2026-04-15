require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./db.cjs');

async function regenerate() {
  try {
    await connectDB();
    const UserSchema = new mongoose.Schema({
      id: String, name: String, email: { type: String, unique: true }, role: String, password: String, avatar: String
    });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const email = 'dipanjana@earlyjobs.in';
    const oldPwd = 'password123';
    const newPwd = 'EJ!Dip@' + Math.floor(Math.random() * 9000 + 1000);

    console.log(`Checking current user: ${email}...`);
    const user = await User.findOne({ email });

    if (!user) {
      console.error('User not found.');
      process.exit(1);
    }

    if (user.password !== oldPwd) {
        console.warn(`Warning: Current password in DB (${user.password}) does not match expected (${oldPwd}). Regenerating anyway.`);
    } else {
        console.log('✅ Current password verified.');
    }

    user.password = newPwd;
    await user.save();
    console.log('✅ Password successfully updated to:', newPwd);

    // Verify
    const verifiedUser = await User.findOne({ email, password: newPwd });
    if (verifiedUser) {
        console.log('✅ Final verification successful. Database updated and confirmed.');
        console.log('User ID for notification:', verifiedUser.id);
    } else {
        console.error('❌ Final verification failed! New password not working.');
        process.exit(1);
    }
  } catch (err) {
    console.error('Error during regeneration:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

regenerate();
