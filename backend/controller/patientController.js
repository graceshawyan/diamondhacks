import Patient from '../models/patientModel.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Create and send token as response
const createSendToken = (patient, statusCode, res) => {
  const token = signToken(patient._id);

  // Remove password from output
  patient.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      patient,
    },
  });
};

// Register a new patient
export const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phoneNumber, 
      dateOfBirth, 
      medicalHistory,
      age,
      gender,
      condition,
      bio
    } = req.body;

    // Check if patient with email already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already in use',
      });
    }

    // Create new patient with initialized fields
    const newPatient = await Patient.create({
      name,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      medicalHistory,
      pfp: 'default.jpg',  // Default profile picture
      posts: [],           // Empty posts array
      followers: [],       // Empty followers array
      following: [],       // Empty following array
      communities: [],     // Empty communities array
      age: age || null,    // Age if provided
      gender: gender || 'prefer not to say', // Gender if provided
      condition: condition || '',  // Condition if provided
      bio: bio || ''       // Bio if provided
    });

    createSendToken(newPatient, 201, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Login patient
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // Check if patient exists && password is correct
    const patient = await Patient.findOne({ email }).select('+password');

    if (!patient || !(await patient.correctPassword(password, patient.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    // If everything is ok, send token to client
    createSendToken(patient, 200, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Logout patient
export const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

// Update patient profile
export const updateProfile = async (req, res) => {
  try {
    const { pfp, bio, age, gender, condition } = req.body;
    
    // Only allow specific fields to be updated
    const updateData = {};
    if (pfp) updateData.pfp = pfp;
    if (bio !== undefined) updateData.bio = bio;
    if (age !== undefined) updateData.age = age;
    if (gender) updateData.gender = gender;
    if (condition !== undefined) updateData.condition = condition;
    
    // Find and update the patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.patient._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        patient: updatedPatient,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Protect routes - middleware to check if user is logged in
export const protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.',
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if patient still exists
    const currentPatient = await Patient.findById(decoded.id);
    if (!currentPatient) {
      return res.status(401).json({
        status: 'fail',
        message: 'The patient belonging to this token no longer exists.',
      });
    }

    // 4) Grant access to protected route
    req.patient = currentPatient;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token or session expired',
    });
  }
};