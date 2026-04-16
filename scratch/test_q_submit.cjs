require('dotenv').config();
const mongoose = require('mongoose');

const Qualification = require('../server/models/Qualification');

async function testSubmission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const leadData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test' + Date.now() + '@example.com',
      phone: '1234567890',
      interestedDistrict: 'Surat'
    };

    const data = {
      type: 'FOFO',
      scores: [5, 5, 5, 5, 5, 5],
      openAnswers: ['A', 'B', 'C', 'D'],
      totalScore: 30,
      qualificationStatus: 'Borderline',
      signature: 'Test Signature',
      date: new Date().toISOString()
    };

    let targetLeadId = undefined;

    // Simulate server logic
    const query = { $or: [
      { leadId: targetLeadId && targetLeadId !== 'null' ? targetLeadId : 'NONE' }, 
      { "leadData.email": leadData?.email && !targetLeadId ? leadData.email : 'NONE' }
    ]};
    
    console.log('Query:', JSON.stringify(query, null, 2));

    const q = await Qualification.findOneAndUpdate(
      query,
      { leadId: targetLeadId, leadData, ...data },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Saved Record:', JSON.stringify(q, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

testSubmission();
