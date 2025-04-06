import { AI } from '@google/generative-ai';
import mongoose from 'mongoose';

const ai = new AI(process.env.GEMINI_API_KEY);

// Random prompts for analysis
const prompts = [
  "Analyze the post and give a summary of whats happening in it"
];

// Analyze user content
export const analyze = async (req, res) => {
  try {
    const { content, userId } = req.body;

    if (!content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Content is required'
      });
    }

    // Get a random prompt
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Create a model instance
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generate analysis
    const result = await model.generateContent(
      `User Content: ${content}\n\n${prompt}`
    );

    const response = await result.response;
    const analysis = await response.text();

    // Store analysis in MongoDB
    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');

    await patientsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $push: { 
          analysisHistory: {
            content,
            analysis,
            timestamp: new Date()
          } 
        }
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Gemini analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze content. Please try again later.'
    });
  }
};