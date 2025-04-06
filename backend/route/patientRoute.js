import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { register, login, logout, protect, updateProfile, getUserInfo } from '../controller/patientController.js';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
router.patch('/update-profile', protect, upload.single('profilePicture'), updateProfile);

// Get user info route
router.get('/user-info', protect, getUserInfo);

// Get specific user info by ID
router.get('/user-info/:id', getUserInfo);

// Get profile picture
router.get('/profile-picture/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Find the patient by ID and get only the profile picture
    const patient = await patientsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { projection: { pfp: 1 } }
    );
    
    if (!patient || !patient.pfp || !patient.pfp.data) {
      return res.status(404).json({
        status: 'fail',
        message: 'Profile picture not found',
      });
    }
    
    // Set the content type header and send the base64 data
    res.set('Content-Type', patient.pfp.contentType);
    res.send(Buffer.from(patient.pfp.data, 'base64'));
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;