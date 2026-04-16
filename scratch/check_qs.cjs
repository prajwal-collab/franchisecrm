require('dotenv').config();
const mongoose = require('mongoose');

const QualificationSchema = new mongoose.Schema({
  leadId: String,
  leadData: Object,
  type: String,
  scores: [Number],
  openAnswers: [String],
  totalScore: Number,
  qualificationStatus: String,
  signature: String,
  date: { type: Date, default: Date.now }
});
const Qualification = mongoose.model('Qualification', QualificationSchema);

async function checkQualifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const qs = await Qualification.find();
    console.log('--- QUALIFICATIONS ---');
    console.log(JSON.stringify(qs, null, 2));
    console.log('-----------------------');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkQualifications();
