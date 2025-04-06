import axios from 'axios';

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
  private LETTA_API_KEY = 'YjBlNWZmYTEtMWNiMy00YzJkLWE3MjAtODNkNTc0ZDIxNzJhOjllN2VmMTM1LTlmYTktNGE0OC1iN2E1LTJkNDg4OTBkNTlkNA==';
  private LETTA_BASE_URL = 'http://localhost:8283';
  private mockMode: boolean = true; // Use mock mode by default for development

  // Initialize with console logs for debugging
  private constructor() {
    console.log('Letta AI Service: Initializing...');
    console.log(`API Key: ${this.LETTA_API_KEY ? 'Found' : 'Missing'}`);
    console.log(`Base URL: ${this.LETTA_BASE_URL}`);
    console.log(`Agent ID: ${AGENT_ID}`);
    console.log(`Mock Mode: ${this.mockMode ? 'Enabled' : 'Disabled'}`);
  }
  
  // Mock responses as fallback
  private mockResponses: { [key: string]: string[] } = {
    greetings: [
      "Hello! I'm your HealthJourney assistant. How can I help with your health journey today?",
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
    if (this.mockMode) {
      return this.getMockResponse(userMessage, context);
    }
    
    try {
      // Call the agent through the Letta API
      const response = await axios.post(
        `${this.LETTA_BASE_URL}/agents/${AGENT_ID}/messages`,
        {
          message: userMessage,
          context: context
        },
        {
          headers: {
            'Authorization': `Bearer ${this.LETTA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Parse the response from the agent
      const responseData = response.data;
      if (!responseData || typeof responseData.message !== 'string') {
        throw new Error('Invalid response from Letta');
      }
      
      return {
        message: responseData.message,
        suggestions: responseData.suggestions || [],
        sentiment: responseData.sentiment || 'neutral',
        actionItems: responseData.actionItems || []
      };
    } catch (error) {
      console.error('Error getting response from Letta AI:', error);
      
      // Fallback to mock response if Letta API fails
      return this.getMockResponse(userMessage, context);
    }
  }
  
  /**
   * Mock implementation for getResponse - used as fallback
   */
  private getMockResponse(userMessage: string, context: any = {}): Promise<LettaAIResponse> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const message = userMessage.toLowerCase();
        let responseCategory = 'default';
        
        // Simple keyword matching
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
          responseCategory = 'greetings';
        } else if (message.includes('pain') || message.includes('hurt') || message.includes('ache')) {
          responseCategory = 'pain';
        } else if (message.includes('progress') || message.includes('better') || message.includes('improve')) {
          responseCategory = 'progress';
        } else if (message.includes('sad') || message.includes('depress') || message.includes('motivat')) {
          responseCategory = 'motivation';
        }
        
        // Get random response from the category
        const responses = this.mockResponses[responseCategory];
        const randomIndex = Math.floor(Math.random() * responses.length);
        
        resolve({
          message: responses[randomIndex],
          suggestions: this.getRandomSuggestions(),
          sentiment: this.getSentimentFromMessage(message),
          actionItems: responseCategory === 'pain' ? [
            "Log this pain episode in your symptom tracker",
            "Schedule a check-in with your healthcare provider",
            "Try the recommended pain management techniques"
          ] : undefined
        });
      }, 1000);
    });
  }
  
  private getRandomSuggestions(): string[] | undefined {
    if (Math.random() > 0.5) return undefined;
    
    const allSuggestions = [
      "Tell me about your health goals",
      "How did you sleep last night?",
      "Would you like tips for managing stress?",
      "Have you been able to do your exercises today?",
      "Are you experiencing any side effects from your medication?"
    ];
    
    const count = Math.floor(Math.random() * 2) + 2;
    const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  private getSentimentFromMessage(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'better', 'great', 'happy', 'improve', 'progress'];
    const negativeWords = ['pain', 'bad', 'worse', 'difficult', 'hard', 'sad', 'depress'];
    
    let score = 0;
    
    for (const word of positiveWords) {
      if (message.includes(word)) score += 1;
    }
    
    for (const word of negativeWords) {
      if (message.includes(word)) score -= 1;
    }
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }
}

export default LettaAIService.getInstance();