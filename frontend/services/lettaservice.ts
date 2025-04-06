import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types for Letta AI
export interface LettaAIResponse {
  message: string;
  suggestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  actionItems?: string[];
}

// Agent ID
const AGENT_ID = 'agent-c01be621-a9eb-48ed-bbf9-0445d11e7403';

/**
 * Letta AI Service - implements communication with Letta agents
 */
class LettaAIService {
  private static instance: LettaAIService;
  private agent = {
    id: 'agent-c01be621-a9eb-48ed-bbf9-0445d11e7403',
    name: 'recovery-assistant'
  };
  private LETTA_API_KEY = 'YjBlNWZmYTEtMWNiMy00YzJkLWE3MjAtODNkNTc0ZDIxNzJhOjllN2VmMTM1LTlmYTktNGE0OC1iN2E1LTJkNDg4OTBkNTlkNA==';
  private LETTA_BASE_URL = 'https://7150-69-196-39-133.ngrok-free.app';
  private mockMode: boolean = false; // mock mode

  // For debugging
  private constructor() {
    console.log('Letta AI Service: Initializing...');
    console.log('Expo Config:', Constants.expoConfig?.extra);
    console.log(`API Key: ${this.LETTA_API_KEY ? 'Found' : 'Missing'}`);
    console.log(`Base URL: ${this.LETTA_BASE_URL}`);
    console.log(`Mock Mode: ${this.mockMode ? 'Enabled' : 'Disabled'}`);
    if (this.mockMode) {
      console.log('Letta service initialized in mock mode - using fallback responses');
    } else {
      console.log('Letta service initialized in real API mode - attempting to connect to server');
    }
  }
  
  // Mock responses as fallback
  private mockResponses: { [key: string]: string[] } = {
    greetings: [
      "Hello! I'm your Recovrly AI assistant. How can I help with your health journey today?",
      "Hi there! I'm here to support your health journey. What can I assist you with?",
      "Welcome back! How are you feeling today?"
    ],
    pain: [
      "I'm sorry to hear you're experiencing pain. Would you like some management techniques that others have found helpful?",
      "Pain can be difficult to manage. Have you recorded this in your symptom tracker? It could help your healthcare provider adjust your treatment plan.",
      "I notice this is the third time you've mentioned increased pain this week. Would you like me to draft a note for your next doctor's appointment?"
    ],
    progress: [
      "Looking at your recent activity, you've made excellent progress! Your walking distance has increased by 15% over the last week.",
      "Congratulations on consistently taking your medication as prescribed. That's a key factor in successful recovery.",
      "You've logged fewer pain episodes this week compared to last - that's a positive trend!"
    ],
    motivation: [
      "Remember that recovery isn't always linear. Many have faced setbacks but ultimately succeeded.",
      "Small steps lead to big progress. Every day you follow your treatment plan is a victory.",
      "You're not alone in this journey. There are many others with similar recovery paths who've reported significant improvements within 3 months."
    ],
    default: [
      "I understand you're on a health journey. Could you tell me more about what specific aspect you need help with?",
      "I'm here to support you. Would you like information about your treatment, symptom management, or emotional support?",
      "Your health is important. Let me know how I can best assist you right now."
    ]
  };
  
  public static getInstance(): LettaAIService {
    if (!LettaAIService.instance) {
      LettaAIService.instance = new LettaAIService();
    }
    return LettaAIService.instance;
  }
  
  /**
   * Enable/disable mock mode (use actual Letta API)
   */
  public setMockMode(mock: boolean): void {
    this.mockMode = mock;
    console.log(`Letta AI Service now in ${mock ? 'mock' : 'live'} mode`);
  }
  
  /**
   * Get a response from the Letta AI agent
   */
  public async getResponse(userMessage: string, context: any = {}): Promise<LettaAIResponse> {
    try {
      console.log('Processing message:', userMessage);
      
      // Use mock mode for reliable responses during development
      if (this.mockMode) {
        console.log('Using mock response for:', userMessage);
        return this.getMockResponse(userMessage, context);
      }
      
      // API call implementation
      console.log('Making Letta API request to:', this.LETTA_BASE_URL);
      console.log('API Key present:', !!this.LETTA_API_KEY);
      
      if (!this.agent || !this.agent.id) {
        throw new Error('Letta agent not initialized');
      }

      // Use the proper endpoint format based on Letta API docs
      const url = `${this.LETTA_BASE_URL}/v1/agents/${this.agent.id}/messages`;
      
      // Format the request body using messages array as specified by mentor
      const body = {
        messages: [
          { role: 'user', content: userMessage }
        ],
        parse_assistant_message: true,
        assistant_message_tool_name: "send_message"
      };
      
      // Set the correct authorization header with Bearer token
      const headers = {
        'Authorization': `Bearer ${this.LETTA_API_KEY}`,
        'Content-Type': 'application/json'
      };

      console.log('=== Making Letta API Request ===');
      console.log('URL:', url);
      console.log('Body:', JSON.stringify(body, null, 2));
      
      // Make API request
      const response = await axios.post(url, body, {
        headers,
        timeout: 30000, // 30 second timeout
      });
      
      console.log('=== Letta API Response ===');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
      // Extract content from response
      const content = this.extractContentFromResponse(response.data);
      
      // Try to extract suggestions or action items from the response data
      let suggestions = [];
      let actionItems = [];
      
      if (response.data.messages && Array.isArray(response.data.messages)) {
        // Look for suggestions in the response messages
        const lastMessage = response.data.messages[response.data.messages.length - 1];
        if (lastMessage.suggestions) {
          suggestions = lastMessage.suggestions;
        }
        if (lastMessage.action_items) {
          actionItems = lastMessage.action_items;
        }
      }
      
      return {
        message: content,
        suggestions: suggestions.length > 0 ? suggestions : this.getRandomSuggestions(),
        sentiment: this.getSentimentFromMessage(content),
        actionItems: actionItems.length > 0 ? actionItems : []
      };
    } catch (error: any) {
      console.error('Error in Letta API service:', error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      } else if (error.code === 'ECONNABORTED') {
        console.error('Timeout error:', error.message);
      } else {
        console.error('Network error:', error.message);
      }
      
      // Always fall back to mock response if any error occurs
      console.log('Falling back to mock response due to error');
      return this.getMockResponse(userMessage, context);
    }
  }
  
  /**
   * Helper function to extract content from different response formats
   */
  private extractContentFromResponse(data: any): string {
    try {
      console.log('Extracting content from response:', JSON.stringify(data, null, 2));
      
      // Check for the standard Letta API response format
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        // Get the last message which should be the assistant's response
        const assistantMessage = data.messages[data.messages.length - 1];
        if (assistantMessage.content) {
          return assistantMessage.content;
        }
        if (assistantMessage.message) {
          return assistantMessage.message;
        }
      }
      
      // Try other standard response formats
      if (data.content) {
        return data.content;
      }
      if (data.message) {
        return data.message;
      }
      if (data.assistant_message) {
        return data.assistant_message;
      }
      
      // If we can't find content in a known format, use stringified data
      console.warn('Unknown response format, returning full response as string');
      return `Response received but format was unexpected. Please check logs for details.`;
    } catch (error) {
      console.error('Error extracting content from response:', error);
      return 'Error processing AI response';
    }
  }
  
  /**
   * Get a mock response for development/testing
   */
  private getMockResponse(userMessage: string, context: any = {}): LettaAIResponse {
    const messageType = this.categorizeMessage(userMessage);
    const responses = this.mockResponses[messageType] || this.mockResponses.default;
    const randomIndex = Math.floor(Math.random() * responses.length);
    
    return {
      message: responses[randomIndex],
      suggestions: this.getRandomSuggestions(),
      sentiment: this.getSentimentFromMessage(userMessage),
      actionItems: []
    };
  }
  
  /**
   * Basic sentiment analysis
   */
  private getSentimentFromMessage(message: string): 'positive' | 'neutral' | 'negative' {
    const lowercaseMessage = message.toLowerCase();
    
    // Lists of sentiment words
    const negativeWords = ['pain', 'hurt', 'ache', 'bad', 'worse', 'difficult', 'struggle', 'hard', 'suffering', 'sad', 'depressed', 'anxious', 'worried', 'fear', 'afraid'];
    const positiveWords = ['better', 'good', 'great', 'improving', 'improve', 'progress', 'happy', 'relief', 'hopeful', 'optimistic', 'well', 'success', 'successful'];
    
    let negativeCount = 0;
    let positiveCount = 0;
    
    // Count occurrences of sentiment words
    negativeWords.forEach(word => {
      if (lowercaseMessage.includes(word)) negativeCount++;
    });
    
    positiveWords.forEach(word => {
      if (lowercaseMessage.includes(word)) positiveCount++;
    });
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }
  
  /**
   * Basic message categorization
   */
  private categorizeMessage(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    if (/^(hi|hello|hey|howdy|greetings)/i.test(lowercaseMessage)) {
      return 'greetings';
    }
    
    if (/\b(hurt|hurts|pain|ache|aching|sore)\b/i.test(lowercaseMessage)) {
      return 'pain';
    }
    
    if (/\b(progress|better|improving|recovered|healing|improvement)\b/i.test(lowercaseMessage)) {
      return 'progress';
    }
    
    if (/\b(hard|difficult|struggling|motivation|motivate|encourage|discouraged)\b/i.test(lowercaseMessage)) {
      return 'motivation';
    }
    
    return 'default';
  }
  
  /**
   * Get random response suggestions based on context
   */
  private getRandomSuggestions(): string[] {
    const allSuggestions = [
      "Tell me more about your symptoms",
      "How has your recovery been progressing?",
      "Would you like some self-care tips?",
      "Do you have any questions about your treatment?",
      "What activities are you finding difficult?",
      "How is your pain level today?",
      "Have you been following your exercise routine?",
      "Is there anything specific you need help with?",
      "Would you like to set a recovery goal?"
    ];
    
    // Shuffle and take 3
    const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }
}

// Export singleton instance
const instance = LettaAIService.getInstance();
export default instance;