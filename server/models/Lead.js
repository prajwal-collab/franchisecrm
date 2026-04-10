const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  id: String, // For legacy data compatibility
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: String,
  districtId: { type: String },
  profession: String,
  investmentCapacity: String,
  source: String,
  stage: { type: String, default: 'New Lead' },
  score: { type: Number, default: 0 },
  assignedTo: String,
  followUpDate: String,
  notes: String,
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
});

LeadSchema.pre('save', function(next) {
  this.updatedDate = Date.now();
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
