require('dotenv').config();
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String
});
const User = mongoose.model('User', UserSchema);

async function testDelete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Create a dummy user
    const dummy = new User({
      id: 'test-delete-id',
      name: 'Test Delete',
      email: 'test@delete.com',
      role: 'Viewer'
    });
    await dummy.save();
    console.log('Dummy user created');

    // Try to delete using the logic from index.cjs
    const idToDelete = 'test-delete-id';
    const query = mongoose.Types.ObjectId.isValid(idToDelete) ? { _id: idToDelete } : { id: idToDelete };
    console.log('Query:', query);
    
    const result = await User.findOneAndDelete(query);
    console.log('Deleted result:', result);

    if (result) {
      console.log('✅ Deletion worked in test script!');
    } else {
      console.log('❌ Deletion FAILED in test script!');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.connection.close();
  }
}

testDelete();
