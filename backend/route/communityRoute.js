import express from 'express';
import { protect } from '../controller/patientController.js';
import { getChatHistory } from '../controller/communityController.js';

const router = express.Router();

// Chat routes
router.get('/:communityId/chat-history', protect, getChatHistory);

export default router;