const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  id: String, // Compatibility with legacy records
  name: { type: String, required: true, unique: true },
  state: { type: String, default: '' },
  status: { type: String, enum: ['Available', 'Sold', 'Blocked'], default: 'Available' },
  soldDate: Date,
  franchiseeId: String,
  price: { type: Number, default: 0 },
  inquiryCount: { type: Number, default: 0 },
  notes: String,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('District', DistrictSchema);
