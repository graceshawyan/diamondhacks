import { controlBox } from '../controller/arduinoController.js';
import mongoose from 'mongoose';

// Time check interval (in milliseconds)
const CHECK_INTERVAL = 60000; // Check every minute

// Format time in HH:MM format (24-hour)
const formatCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Get current day of the week
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// Check if time matches and trigger Arduino
const checkMedicationTimes = async () => {
  try {
    // Get current time and day
    const currentTime = formatCurrentTime();
    const currentDay = getCurrentDay();
    
    console.log(`Checking medication times at ${currentTime} on ${currentDay}`);
    
    // Get MongoDB connection and patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Fetch all patients with medication schedules
    const patients = await patientsCollection.find({ 'med_schedule': { $exists: true, $ne: {} } }).toArray();
    
    // Track if any medications need to be dispensed
    let medicationFound = false;
    
    // Check each patient's medication schedule
    for (const patient of patients) {
      if (!patient.med_schedule) continue;
      
      // Check each medication
      for (const [medicationName, medicationData] of Object.entries(patient.med_schedule)) {
        if (!medicationData.active) continue;
        if (!medicationData.schedule || !medicationData.schedule[currentDay]) continue;
        
        // Check if current time matches any scheduled time for today
        if (medicationData.schedule[currentDay].includes(currentTime)) {
          console.log(`Time match found for ${medicationName} at ${currentTime} for patient ${patient.name || patient.email}`);
          
          // Call Arduino controller to dispense medication
          await controlBox('move');
          
          medicationFound = true;
          console.log(`Dispensing ${medicationName} for patient ${patient.name || patient.email}`);
        }
      }
    }
    
    if (!medicationFound) {
      console.log('No medications scheduled for the current time');
    }
  } catch (error) {
    console.error('Error checking medication times:', error);
  }
};

// Start the medication scheduler
export const startMedicationScheduler = () => {
  console.log('Starting medication scheduler service...');
  
  // Run immediately on startup
  checkMedicationTimes();
  
  // Then run at regular intervals
  const intervalId = setInterval(checkMedicationTimes, CHECK_INTERVAL);
  
  return intervalId;
};

// Stop the medication scheduler
export const stopMedicationScheduler = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('Medication scheduler stopped');
  }
};
