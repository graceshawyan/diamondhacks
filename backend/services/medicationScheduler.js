import { controlBox } from '../controller/arduinoController.js';
import mongoose from 'mongoose';

// Time check interval (in milliseconds)
const CHECK_INTERVAL = 1000; // Check every second

// Track dispensed medications to prevent duplicates
const dispensedMedications = new Map();

// Track follow-up reminders
const pendingReminders = new Map();

// Clear dispensed medications after time changes
let lastMinute = -1;

// Format time in HH:MM format (24-hour) and also in 12-hour format with AM/PM
const formatCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentMinute = minutes;
  
  // Check if minute has changed and clear the dispensed medications tracking
  if (currentMinute !== lastMinute) {
    // Don't clear if we have pending reminders
    if (pendingReminders.size === 0) {
      dispensedMedications.clear();
    } else {
      console.log(`Keeping medication tracking due to ${pendingReminders.size} pending reminders`);
    }
    lastMinute = currentMinute;
    console.log('\u23f0 New minute detected');
  }
  
  // 24-hour format
  const time24h = `${hours.toString().padStart(2, '0')}:${minutes}`;
  
  // 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const time12h = `${hours12.toString().padStart(2, '0')}:${minutes} ${period}`;
  
  return { time24h, time12h };
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
    const { time24h: currentTime24h, time12h: currentTime12h } = formatCurrentTime();
    const currentDay = getCurrentDay();
    
    // Only log full check message once per minute to reduce noise
    if (lastMinute === new Date().getMinutes().toString().padStart(2, '0')) {
      // Minimal log for frequent checks
      process.stdout.write('.');
    } else {
      console.log(`\n\u23f0 Checking medications for ${currentTime12h} on ${currentDay}`);
    }
    
    // Get MongoDB connection and patients collection
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');
    
    // Fetch all patients with medication schedules
    const patients = await patientsCollection.find({ 'med_schedule': { $exists: true, $ne: {} } }).toArray();
    
    console.log(`Found ${patients.length} patients with medication schedules`);
    
    // Track if any medications need to be dispensed
    let medicationFound = false;
    
    // Check each patient's medication schedule
    for (const patient of patients) {
      if (!patient.med_schedule) continue;
      
      // Check each medication
      console.log(`Checking ${Object.keys(patient.med_schedule).length} medications for patient ${patient.name || patient.email}`);
      
      for (const [medicationName, medicationData] of Object.entries(patient.med_schedule)) {
        console.log(`Medication: ${medicationName}, Active: ${medicationData.active || false}`);
        
        if (!medicationData.active) {
          console.log(`  Skipping inactive medication: ${medicationName}`);
          continue;
        }
        
        if (!medicationData.schedule || !medicationData.schedule[currentDay]) {
          console.log(`  No schedule for ${currentDay} found for ${medicationName}`);
          continue;
        }
        
        console.log(`  ${medicationName} schedule for ${currentDay}: ${JSON.stringify(medicationData.schedule[currentDay])}`);
        
        // Check if current time matches any scheduled time for today
        const matchingTime = medicationData.schedule[currentDay].find(time => {
          console.log(`  Comparing medication time: ${time} with current time: ${currentTime24h} or ${currentTime12h}`);
          return time === currentTime24h || time === currentTime12h;
        });
        
        if (matchingTime) {
          // Create a unique key for this medication+time+patient
          const medicationKey = `${patient._id}_${medicationName}_${matchingTime}`;
          
          // Check if this medication has already been dispensed this minute
          if (!dispensedMedications.has(medicationKey)) {
            console.log(`\u2705 TIME MATCH FOUND for ${medicationName} at ${matchingTime} for patient ${patient.name || patient.email}`);
            
            // Call Arduino controller to dispense medication
            console.log(`Calling Arduino controller to dispense ${medicationName}...`);
            await controlBox('move');
            
            // Mark this medication as dispensed
            dispensedMedications.set(medicationKey, new Date());
            
            medicationFound = true;
            console.log(`\u2705 DISPENSED ${medicationName} for patient ${patient.name || patient.email}`);
            
            // Schedule a follow-up reminder in 5 minutes if not already scheduled
            if (!pendingReminders.has(medicationKey)) {
              console.log(`\u23f0 Scheduling 5-minute follow-up reminder for ${medicationName}`);
              
              const reminderId = setTimeout(async () => {
                console.log(`\u23f0 FOLLOW-UP REMINDER for ${medicationName} for patient ${patient.name || patient.email}`);
                await controlBox('move');
                console.log(`\u2705 DISPENSED follow-up for ${medicationName}`);
                pendingReminders.delete(medicationKey);
              }, 5 * 60 * 1000); // 5 minutes in milliseconds
              
              pendingReminders.set(medicationKey, reminderId);
            }
          } else {
            // Skip already dispensed medication
            const dispensedTime = dispensedMedications.get(medicationKey);
            const secondsAgo = Math.floor((new Date() - dispensedTime) / 1000);
            console.log(`\u23ed\ufe0f Already dispensed ${medicationName} ${secondsAgo} seconds ago, skipping`);
          }
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

// Clean up interval and any pending reminders when server stops
export const stopMedicationScheduler = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('Medication scheduler stopped');
  }
  
  // Clear any pending reminder timeouts
  if (pendingReminders.size > 0) {
    console.log(`Clearing ${pendingReminders.size} pending medication reminders`);
    for (const reminderId of pendingReminders.values()) {
      clearTimeout(reminderId);
    }
    pendingReminders.clear();
  }
};
