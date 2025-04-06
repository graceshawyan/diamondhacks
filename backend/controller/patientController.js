import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { initializeArduino, scheduleBoxOperations } from './arduinoController.js';

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
      name, // Will be changed to username in frontend but keep as name for now for backward compatibility
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
      name, // This is the username
      email,
      password: hashedPassword,
      pfp: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',  // Default profile picture
      posts: [],           // Empty posts array
      followers: [],       // Empty followers array
      following: [],       // Empty following array
      communities: [],     // Empty communities array
      age: null,           // Age if provided
      pronouns: '',
      condition: '',       // Condition if provided
      bio: '', 
      product,      // Whether patient is using product
      // Initialize empty medication schedule
      med_schedule: {},    // Structure for medication schedules
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

// Get user information (pfp, bio, age, pronouns, condition, posts count, followers count, following count)
export const getUserInfo = async (req, res) => {
  try {
    const patientId = req.params.id || req.patient._id;
    
    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Find the patient by ID
    const patient = await patientsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { projection: { 
        pfp: 1, 
        bio: 1, 
        age: 1, 
        pronouns: 1, 
        condition: 1, 
        name: 1, // name field represents username
        email: 1, // Include email for profile settings
        posts: 1,
        followers: 1,
        following: 1,
        product: 1,
      } }
    );
    
    if (!patient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }
    
    // Add stats to the patient object
    patient.stats = {
      postsCount: patient.posts ? patient.posts.length : 0,
      followersCount: patient.followers ? patient.followers.length : 0,
      followingCount: patient.following ? patient.following.length : 0
    };
    
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
    const { bio, age, pronouns, condition, product } = req.body;
    
    // Only allow specific fields to be updated
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (age !== undefined) updateData.age = age;
    if (pronouns) updateData.pronouns = pronouns;
    if (condition !== undefined) updateData.condition = condition;
    // Fix product toggle conversion to ensure it properly captures boolean values
    if (product !== undefined) {
      console.log('Product value received:', product, 'type:', typeof product);
      // Handle different ways product might be provided (string, boolean, etc.)
      if (typeof product === 'boolean') {
        updateData.product = product;
      } else if (typeof product === 'string') {
        updateData.product = product.toLowerCase() === 'true';
      } else if (typeof product === 'number') {
        updateData.product = product === 1;
      } else {
        updateData.product = Boolean(product);
      }
      console.log('Product value after conversion:', updateData.product);
    }
    
    // Handle profile picture upload if present
    if (req.file) {
      // Store the image data in MongoDB
      updateData.pfp = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
    }
    
    // Connect directly to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Log the patient ID for debugging
    console.log('Updating profile for patient ID:', req.patient._id);
    
    // Find and update the patient
    const result = await patientsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    const updatedPatient = result.value || result;
    
    if (!updatedPatient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }
    
    // Don't send the full profile picture data back in the response
    if (updatedPatient.pfp && updatedPatient.pfp.data) {
      updatedPatient.pfp = {
        contentType: updatedPatient.pfp.contentType,
        filename: updatedPatient.pfp.filename,
        _id: updatedPatient.pfp._id
      };
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        patient: updatedPatient,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
  
  // Handle profile picture upload if present
  if (req.file) {
    // Store the image data in MongoDB
    updateData.pfp = {
      data: req.file.buffer.toString('base64'),
      contentType: req.file.mimetype,
      filename: req.file.originalname
    };
  }
  
  // Connect directly to the patients collection
  const db = mongoose.connection.db;
  const patientsCollection = db.collection('patients');
  
  // Log the patient ID for debugging
  console.log('Updating profile for patient ID:', req.patient._id);
  
  // Find and update the patient
  const result = await patientsCollection.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.patient._id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  
  const updatedPatient = result.value || result;
  
  if (!updatedPatient) {
    return res.status(404).json({
      status: 'fail',
      message: 'Patient not found',
    });
  }
  
  // Don't send the full profile picture data back in the response
  if (updatedPatient.pfp && updatedPatient.pfp.data) {
    updatedPatient.pfp = {
      contentType: updatedPatient.pfp.contentType,
      filename: updatedPatient.pfp.filename,
      _id: updatedPatient.pfp._id
    };
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: updatedPatient,
    },
  });

};

// Protect routes - middleware to check if user is logged in
// Format medication data from API to display format
const formatMedicationData = (medSchedule) => {
  if (!medSchedule) return [];
  
  const formatted = [];
  let id = 1;
  
  Object.entries(medSchedule).forEach(([name, medData]) => {
    // Extract active status and schedule from medication data
    const active = medData.active !== undefined ? medData.active : true;
    const schedule = medData.schedule || {};
    
    // Create human-readable frequency and time strings
    const days = Object.keys(schedule);
    const times = new Set();
    
    days.forEach(day => {
      schedule[day].forEach(time => {
        times.add(time);
      });
    });
    
    let frequency;
    if (days.length === 7) {
      frequency = 'Daily';
    } else if (days.length === 1) {
      frequency = `Every ${days[0]}`;
    } else {
      frequency = `${days.join(', ')}`;
    }
    
    formatted.push({
      id: String(id++),
      name,
      frequency,
      time: Array.from(times).join(', '),
      active: active,
      rawSchedule: schedule // Keep original schedule for edits
    });
  });
  
  return formatted;
};

// Add medication to schedule
export const addMedication = async (req, res) => {
  try {
    const { name, active, timeSlots } = req.body;
    
    if (!name || !timeSlots) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide medication name and time slots',
      });
    }
    
    // Connect to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Create the medication entry with the new format
    const medicationEntry = {
      active: active !== undefined ? active : true, // Default to active if not provided
      schedule: timeSlots
    };
    
    // Create the med_schedule path update
    const updatePath = `med_schedule.${name}`;
    const updateObj = {};
    updateObj[updatePath] = medicationEntry;
    
    // Update the patient's medication schedule
    const result = await patientsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    
    const updatedPatient = result.value || result;
    
    if (!updatedPatient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }

    // Schedule Arduino box operations for the updated schedule
    try {
      await scheduleBoxOperations(updatedPatient.med_schedule);
    } catch (error) {
      console.error('Failed to schedule box operations:', error);
      // Continue anyway as the medication schedule was updated successfully
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        med_schedule: updatedPatient.med_schedule,
      },
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Remove medication from schedule
export const removeMedication = async (req, res) => {
  try {
    const { medicationName } = req.params;
    
    if (!medicationName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide medication name',
      });
    }
    
    // Connect to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Create the med_schedule path to unset
    const updatePath = `med_schedule.${medicationName}`;
    const updateObj = {};
    updateObj[updatePath] = '';
    
    // Update the patient's medication schedule
    const result = await patientsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $unset: updateObj },
      { returnDocument: 'after' }
    );
    
    const updatedPatient = result.value || result;
    
    if (!updatedPatient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Patient not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        med_schedule: updatedPatient.med_schedule,
      },
    });
  } catch (error) {
    console.error('Remove medication error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get medication schedule
export const getMedicationSchedule = async (req, res) => {
  try {
    // Connect to the patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Find the patient
    const patient = await patientsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { projection: { med_schedule: 1 } }
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
        med_schedule: patient.med_schedule || {},
      },
    });
  } catch (error) {
    console.error('Get medication schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

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
    
    console.log('Received token:', token);

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('Decoded token ID:', decoded.id);

    // 3) Check if patient still exists
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Make sure we're using a valid ObjectId
    let patientId;
    try {
      patientId = new mongoose.Types.ObjectId(decoded.id);
    } catch (error) {
      console.error('Invalid ObjectId format:', error);
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token format',
      });
    }
    
    const currentPatient = await patientsCollection.findOne({ _id: patientId });
    console.log('Found patient:', currentPatient ? 'Yes' : 'No');
    
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