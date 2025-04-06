//app.js
import express from 'express';
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
    server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    console.error('Server encountered an error:', error);
  });
});

export default app;