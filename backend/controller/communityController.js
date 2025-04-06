import mongoose from 'mongoose';

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