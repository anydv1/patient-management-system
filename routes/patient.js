const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const Appointment = require('../models/Appointment');

const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware(['admin', 'doctor']), async (req, res) => {
  try {
    const { username, patientDetails } = req.body;

    let user = await User.findOne({ username });

    if (!user ) {
      const  password  = req.body.username; 
      const hashedPassword = await bcrypt.hash(password, 10);

      user = new User({ username, password: hashedPassword, role: 'patient' }); 
      await user.save();
    }else if (user.role !== 'patient') {
      return res
        .status(400)
        .json({ error: `User exists with role '${user.role}', cannot proceed as 'patient'` });
    }

    const patient = new Patient({
      userId: user._id,     
      username,
      ...patientDetails,  
    });

    await patient.save();
    res.status(201).json(patient); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



router.get('/', authMiddleware(['admin', 'doctor', 'patient']), async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) {
        return res.status(404).json({ message: 'Patient record not found' });
      }
      return res.json(patient);
    }

    if (req.user.role === 'doctor') {
      const appointments = await Appointment.find({ doctorId: req.user.id }).select('patientId');
      const patientIds = appointments.map((appointment) => appointment.patientId);

      const patients = await Patient.find({ _id: { $in: patientIds } });
      return res.json(patients);
    }

    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving patients', error: error.message });
  }
});

  

router.put('/:id', authMiddleware(['admin', 'doctor']), async (req, res) => {
  try {
    const { id } = req.params;
    let patient = await Patient.findOne({userId: id});
    if(!patient){
      return res.status(404).json({ message: 'Patient not found' });
    }
    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,                 
      req.body,           
      { new: true, runValidators: true } 
    ); 

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found!!!!' });
    }

    res.json(updatedPatient);
  
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const userDeleteResult = await User.findOneAndDelete({ username: patient.username });

    if (!userDeleteResult) {
      return res.status(404).json({ message: 'User not found for the patient' });
    }

    await Patient.findByIdAndDelete(req.params.id);

    res.json({ message: 'Patient and associated user deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
