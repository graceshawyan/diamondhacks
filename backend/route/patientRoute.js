import express from 'express';
import { register, login, logout, protect, updateProfile } from '../controller/patientController.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Profile routes
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      patient: req.patient
    }
  });
});

// Update profile route
router.patch('/update-profile', protect, updateProfile);

export default router;