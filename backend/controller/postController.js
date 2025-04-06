import mongoose from 'mongoose';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, contentType, caption } = req.body;
    
    // Validate required fields
    if (!content || !contentType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Content and content type are required',
      });
    }
    
    // Validate content type
    if (!['image', 'video'].includes(contentType)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Content type must be either image or video',
      });
    }
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    const patientsCollection = db.collection('patients');
    
    // Create new post
    const newPost = {
      patient: new mongoose.Types.ObjectId(req.patient._id),
      content,
      contentType,
      caption: caption || '',
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert post
    const result = await postsCollection.insertOne(newPost);
    newPost._id = result.insertedId;
    
    // Update patient's posts array
    await patientsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $push: { posts: newPost._id } }
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        post: newPost,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get all posts
export const getAllPosts = async (req, res) => {
  try {
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Get all posts with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Find posts and sort by createdAt in descending order
    const posts = await postsCollection.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const total = await postsCollection.countDocuments();
    
    res.status(200).json({
      status: 'success',
      results: posts.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        posts,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get posts by patient ID
export const getPatientPosts = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Get posts by patient ID with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Find posts by patient ID and sort by createdAt in descending order
    const posts = await postsCollection.find({ patient: new mongoose.Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const total = await postsCollection.countDocuments({ patient: new mongoose.Types.ObjectId(patientId) });
    
    res.status(200).json({
      status: 'success',
      results: posts.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        posts,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        post,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { caption } = req.body;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    // Check if the post belongs to the patient
    if (post.patient.toString() !== req.patient._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this post',
      });
    }
    
    // Update post
    const result = await postsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { 
        $set: { 
          caption, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    const updatedPost = result.value;
    
    res.status(200).json({
      status: 'success',
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    const patientsCollection = db.collection('patients');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    // Check if the post belongs to the patient
    if (post.patient.toString() !== req.patient._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this post',
      });
    }
    
    // Delete post
    await postsCollection.deleteOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    // Remove post from patient's posts array
    await patientsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(req.patient._id) },
      { $pull: { posts: new mongoose.Types.ObjectId(postId) } }
    );
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    // Check if patient already liked the post
    const alreadyLiked = post.likes.some(like => like.toString() === req.patient._id.toString());
    
    if (alreadyLiked) {
      // Unlike the post
      const result = await postsCollection.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(postId) },
        { $pull: { likes: new mongoose.Types.ObjectId(req.patient._id) } },
        { returnDocument: 'after' }
      );
      
      const updatedPost = result.value;
      
      return res.status(200).json({
        status: 'success',
        message: 'Post unliked',
        data: {
          post: updatedPost,
          likesCount: updatedPost.likes.length,
        },
      });
    }
    
    // Like the post
    const result = await postsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { $addToSet: { likes: new mongoose.Types.ObjectId(req.patient._id) } },
      { returnDocument: 'after' }
    );
    
    const updatedPost = result.value;
    
    res.status(200).json({
      status: 'success',
      message: 'Post liked',
      data: {
        post: updatedPost,
        likesCount: updatedPost.likes.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'fail',
        message: 'Comment text is required',
      });
    }
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    // Create new comment
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      patient: new mongoose.Types.ObjectId(req.patient._id),
      text,
      createdAt: new Date(),
    };
    
    // Add comment to post
    const result = await postsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { $push: { comments: newComment } },
      { returnDocument: 'after' }
    );
    
    const updatedPost = result.value;
    
    res.status(201).json({
      status: 'success',
      data: {
        comment: newComment,
        commentsCount: updatedPost.comments.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    
    // Connect to collections
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');
    
    // Find post by ID
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }
    
    // Find comment
    const comment = post.comments.find(c => c._id.toString() === commentId);
    
    if (!comment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Comment not found',
      });
    }
    
    // Check if the comment belongs to the patient or if the patient is the post owner
    if (comment.patient.toString() !== req.patient._id.toString() && 
        post.patient.toString() !== req.patient._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this comment',
      });
    }
    
    // Remove comment from post
    const result = await postsCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } } },
      { returnDocument: 'after' }
    );
    
    const updatedPost = result.value;
    
    res.status(200).json({
      status: 'success',
      data: {
        commentsCount: updatedPost.comments.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
