const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  id: String, // Compatibility with legacy records
  name: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Available', 'Sold', 'Blocked'], default: 'Available' },
  soldDate: Date,
  franchiseeId: String,
  notes: String,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('District', DistrictSchema);
