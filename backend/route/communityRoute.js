import express from 'express';
import { protect } from '../controller/patientController.js';
import { getChatHistory } from '../controller/communityController.js';

const router = express.Router();

// Initialize Socket.IO chat handlers
import { initChatHandlers } from '../controller/communityController.js';
initChatHandlers();

// Chat routes
router.get('/:communityId/chat-history', protect, getChatHistory);

export default router;