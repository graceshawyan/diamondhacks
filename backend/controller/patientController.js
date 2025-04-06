import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    } = req.body;

    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');

    // Check if patient with email already exists
    const existingPatient = await patientsCollection.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already in use',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new patient with initialized fields
    const newPatient = {
      name,
      email,
      password: hashedPassword,
      pfp: 'default.jpg',  // Default profile picture
      posts: [],           // Empty posts array
      followers: [],       // Empty followers array
      following: [],       // Empty following array
      communities: [],     // Empty communities array
      age: null,           // Age if provided
      pronouns: '',
      condition: '',       // Condition if provided
      bio: '',             // Bio if provided
      createdAt: new Date()
    };

    const result = await patientsCollection.insertOne(newPatient);
    newPatient._id = result.insertedId;
    newPatient.password = undefined; // Remove password from response

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

    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');

    // Check if patient exists
    const patient = await patientsCollection.findOne({ email });

    if (!patient || !(await bcrypt.compare(password, patient.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    // If everything is ok, send token to client
    patient.password = undefined; // Remove password from response
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

// Get user information (pfp, bio, age, pronouns, condition)
export const getUserInfo = async (req, res) => {
  try {
    const patientId = req.params.id || req.patient._id;
    
    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Find the patient by ID
    const patient = await patientsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { projection: { pfp: 1, bio: 1, age: 1, pronouns: 1, condition: 1, name: 1 } }
    );
    
    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        patient,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update patient profile
export const updateProfile = async (req, res) => {
  try {
    const { pfp, bio, age, pronouns, condition } = req.body;
    
    // Only allow specific fields to be updated
    const updateData = {};
    if (pfp) updateData.pfp = pfp;
    if (bio !== undefined) updateData.bio = bio;
    if (age !== undefined) updateData.age = age;
    if (pronouns) updateData.pronouns = pronouns;
    if (condition !== undefined) updateData.condition = condition;
    
    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Find and update the patient
    const result = await patientsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    const updatedPatient = result.value;
    
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
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    const currentPatient = await patientsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(decoded.id) }
    );
    
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