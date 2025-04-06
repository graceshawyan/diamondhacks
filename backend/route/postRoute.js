import express from 'express';
import { protect } from '../controller/patientController.js';
import {
  createPost,
  getAllPosts,
  getPatientPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment
} from '../controller/postController.js';

const router = express.Router();

// Post routes
router.post('/', protect, createPost);
router.get('/', getAllPosts);
router.get('/:id', getPost);
router.patch('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

// Like routes
router.post('/:id/like', protect, likePost);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.delete('/:postId/comments/:commentId', protect, deleteComment);

// Get posts by patient
router.get('/patient/:patientId', getPatientPosts);

export default router;