import mongoose from 'mongoose';
import { io } from '../app.js';

// Initialize Socket.IO chat handlers
export const initChatHandlers = () => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Set user info
    socket.on('setUser', async (userId) => {
      try {
        const db = mongoose.connection.db;
        const patientsCollection = db.collection('patients');
        
        const user = await patientsCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) },
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
        userId: socket.user.id,
        name: socket.user.name
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
            userId: socket.user.id,
            name: socket.user.name
          });
        }
      });
    });
  });
};

// Get community chat history
export const getChatHistory = async (req, res) => {
  try {
    const communityId = req.params.communityId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const db = mongoose.connection.db;
    const communitiesCollection = db.collection('communities');

    const community = await communitiesCollection.findOne(
      { _id: new mongoose.Types.ObjectId(communityId) },
      { projection: { chatHistory: 1 } }
    );

    if (!community) {
      return res.status(404).json({
        status: 'fail',
        message: 'Community not found'
      });
    }

    // Get paginated chat history
    const chatHistory = community.chatHistory
      .slice().reverse() // Reverse to get newest messages first
      .slice(skip, skip + limit)
      .reverse(); // Reverse back to chronological order

    // Get total count for pagination
    const total = community.chatHistory.length;

    res.status(200).json({
      status: 'success',
      results: chatHistory.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        chatHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};