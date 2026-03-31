const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Available', 'Sold', 'Blocked'], default: 'Available' },
  soldDate: Date,
  franchiseeId: String,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('District', DistrictSchema);
