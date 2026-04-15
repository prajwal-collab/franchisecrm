const mongoose = require('mongoose');

const QualificationSchema = new mongoose.Schema({
  leadId: { type: String, default: null },
  leadData: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    interestedDistrict: { type: String, default: '' }
  },
  type: { type: String, enum: ['FOFO', 'FOCO'], required: true },
  scores: [{ type: Number, min: 1, max: 10 }],
  openAnswers: [{ type: String, default: '' }],
  totalScore: { type: Number, default: 0 },
  qualificationStatus: { type: String, default: 'Not Recommended' },
  signature: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
});

QualificationSchema.pre('save', function(next) {
  this.updatedDate = Date.now();
  
  // Calculate total score if needed (though it should be sent from frontend)
  if (this.scores && this.scores.length === 6) {
    this.totalScore = this.scores.reduce((a, b) => a + b, 0);
    
    // Determine status
    if (this.totalScore >= 45) this.qualificationStatus = 'Strong Fit';
    else if (this.totalScore >= 35) this.qualificationStatus = 'Borderline';
    else this.qualificationStatus = 'Not Recommended';
  }
  
  next();
});

module.exports = mongoose.model('Qualification', QualificationSchema);
