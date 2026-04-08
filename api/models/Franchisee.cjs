const mongoose = require('mongoose');

const FranchiseeSchema = new mongoose.Schema({
  id: String, // Compatibility with legacy records
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  districtId: String,
  onboardingDate: { type: Date, default: Date.now },
  committedAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Partial' },
  sourceOfLead: String,
  notes: String,
  leadId: String,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Franchisee', FranchiseeSchema);
