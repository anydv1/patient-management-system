const express = require('express');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');
const moment = require('moment');
const User = require('../models/User');
const Patient = require('../models/Patient');

const router = express.Router();

router.post('/', authMiddleware(['admin','patient']), async (req, res) => {
  try {
    const formattedDate = moment(req.body.date, 'DD-MM-YYYY HH:mm').add(5, 'hours').add(30, 'minutes').toDate();
    req.body.date = formattedDate;
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authMiddleware(['admin', 'doctor', 'patient']), async (req, res) => {
  try {
    let appointments;

    if (req.user.role === 'patient') {
     let patient = await Patient.findOne({ userId: req.user.id });
      appointments = await Appointment.find({ patientId:patient._id })
        .populate('patientId')
        .populate('doctorId');
    } else if (req.user.role === 'doctor') {
      appointments = await Appointment.find({ doctorId: req.user.id })
        .populate('patientId')
        .populate('doctorId');
    } else if (req.user.role === 'admin') {
      appointments = await Appointment.find()
        .populate('patientId')
        .populate('doctorId');
    }

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointments', error: err.message });
  }
});

  

router.put('/:id', authMiddleware(['admin', 'doctor', 'patient']), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    const formattedDate = moment(req.body.date, 'DD-MM-YYYY HH:mm').add(5, 'hours').add(30, 'minutes').toDate();
   req.body.date = formattedDate;
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === 'patient') {
      let patient = await Patient.findOne({ userId: req.user.id });
      if (patient.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to update this appointment' });
      }
    } else if (req.user.role === 'doctor') {
      if (appointment.doctorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to update this appointment' });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete('/:id', authMiddleware(['admin','patient']), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
