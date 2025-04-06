//app.js
import express from 'express';
import { initializeArduino, cleanup } from './controller/arduinoController.js';
import { startMedicationScheduler, stopMedicationScheduler } from './services/medicationScheduler.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import db from './config/db.js';
import dotenv from 'dotenv';
import patientRoute from './route/patientRoute.js';
import postRoute from './route/postRoute.js';
import communityRoute from './route/communityRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connect to frontend
app.use(cors());
app.use('/patient', patientRoute);
app.use('/post', postRoute);
app.use('/community', communityRoute);

export const port = 5001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Export Socket.IO instance
export { io };

db()
.then(() => {
  // Import routes after DB connection
  import('./route/patientRoute.js')
    .then((patientRouteModule) => {
      app.use('/patient', patientRouteModule.default);
      
      import('./route/postRoute.js')
        .then((postRouteModule) => {
          app.use('/post', postRouteModule.default);
          
          import('./route/communityRoute.js')
            .then((communityRouteModule) => {
              app.use('/community', communityRouteModule.default);
              
              // Setup Socket.IO after all routes are loade
              
              // Variable to store scheduler interval reference
              let schedulerInterval;
              
              // Initialize Arduino before starting server
              initializeArduino().then(success => {
                if (success) {
                  console.log('Arduino initialized successfully');
                  
                  // Start medication scheduler service after Arduino is initialized
                  schedulerInterval = startMedicationScheduler();
                  console.log('Medication scheduler started');
                } else {
                  console.warn('Failed to initialize Arduino - box control will be disabled');
                }

                // Start server
                const server = app.listen(port, () => {
                  console.log(`Server is running on port ${port}`);
                });

                // Cleanup on server shutdown
                process.on('SIGTERM', async () => {
                  console.log('SIGTERM received. Cleaning up...');
                  
                  // Stop medication scheduler
                  if (schedulerInterval) {
                    stopMedicationScheduler(schedulerInterval);
                  }
                  
                  // Cleanup Arduino connection
                  await cleanup();
                  
                  server.close(() => {
                    console.log('Server closed');
                    process.exit(0);
                  });
                });
              });
            });
        });
    });
});

export default app;