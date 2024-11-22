const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password, role, patientDetails } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const newUser = new User({ username, password: hashedPassword, role });
  
    try {
      const savedUser = await newUser.save();
  
      if (role === 'patient' && patientDetails) {
        const newPatient = new Patient({
          userId: savedUser._id, 
          username:savedUser.username,
          ...patientDetails, 
        });
  
        await newPatient.save();
      }
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  res.json({ token });
});

module.exports = router;
