import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connect to frontend
app.use(cors());

export const port = 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Create a socket.io setup function that will be called after DB connection
const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Set user info
    socket.on('setUser', async (userId) => {
      try {
        const db = mongoose.connection.db;
        const patientsCollection = db.collection('patients');
        
        const user = await patientsCollection.findOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { projection: { name: 1, pfp: 1 } }
        );
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        socket.user = {
          id: userId,
          name: user.name,
          pfp: user.pfp
        };
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Join community chat
    socket.on('joinCommunityChat', async (communityId) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'User not set' });
          return;
        }

        const db = mongoose.connection.db;
        const communitiesCollection = db.collection('communities');
        
        // Verify user is a member of the community
        const community = await communitiesCollection.findOne(
          { 
            _id: new mongoose.Types.ObjectId(communityId),
            members: new mongoose.Types.ObjectId(socket.user.id)
          }
        );
        
        if (!community) {
          socket.emit('error', { message: 'Not authorized to join this community' });
          return;
        }
        
        // Join the room
        socket.join(`community_${communityId}`);
        
        // Notify other users
        io.to(`community_${communityId}`).emit('userJoined', {
          userId: socket.user.id,
          name: socket.user.name,
          pfp: socket.user.pfp
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Send message
    socket.on('sendMessage', async ({ communityId, message }) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'User not set' });
          return;
        }

        const db = mongoose.connection.db;
        const communitiesCollection = db.collection('communities');
        
        // Verify user is in the community
        const community = await communitiesCollection.findOne(
          { 
            _id: new mongoose.Types.ObjectId(communityId),
            members: new mongoose.Types.ObjectId(socket.user.id)
          }
        );
        
        if (!community) {
          socket.emit('error', { message: 'Not authorized to send message' });
          return;
        }

        // Create message
        const newMessage = {
          _id: new mongoose.Types.ObjectId(),
          sender: socket.user.id,
          content: message,
          timestamp: new Date(),
          senderName: socket.user.name,
          senderPfp: socket.user.pfp
        };

        // Add message to community's chat history
        await communitiesCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(communityId) },
          { $push: { chatHistory: newMessage } }
        );

        // Broadcast message to all users in the community
        io.to(`community_${communityId}`).emit('newMessage', newMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave community chat
    socket.on('leaveCommunityChat', (communityId) => {
      socket.leave(`community_${communityId}`);
      io.to(`community_${communityId}`).emit('userLeft', {
        userId: socket.user?.id,
        name: socket.user?.name
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      // Broadcast user left to all communities they were in
      socket.rooms.forEach(room => {
        if (room.startsWith('community_')) {
          const communityId = room.replace('community_', '');
          io.to(room).emit('userLeft', {
            userId: socket.user?.id,
            name: socket.user?.name
          });
        }
      });
    });
  });
};

// Connect to database and start server
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
              
              // Setup Socket.IO after all routes are loaded
              setupSocketIO(io);
              
              // Start the server
              server.listen(port, () => {
                console.log(`Server is running on port ${port}`);
              });
              
              server.on('error', (error) => {
                console.error('Server encountered an error:', error);
              });
            });
        });
    });
});

export default app;