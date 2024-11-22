const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  username: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: false },
  age: { type: Number, required: true },
  contact: { type: String, required: true },
  userId: { type: String, ref: 'User', required: true },
  medicalHistory: { type: String },
});

module.exports = mongoose.model('Patient', PatientSchema);
