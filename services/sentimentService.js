const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config');

class SentimentService {
  constructor() {
    // Configure OpenAI client to use DeepSeek API
    this.deepseek = new OpenAI({
      apiKey: config.DEEPSEEK_API_KEY,
      baseURL: config.DEEPSEEK_API_BASE
    });
  }

  /**
   * Get market sentiment analysis for a specific stock/crypto
   * @param {string} symbol - Stock or crypto symbol
   * @param {Object} priceData - Current price data
   * @returns {Promise<Object>} Sentiment analysis
   */
  async getMarketSentiment(symbol, priceData) {
    try {
      // Gather market context
      const marketContext = await this.gatherMarketContext(symbol, priceData);
      
      const prompt = `${config.SENTIMENT_PROMPT}

Market Data for ${symbol}:
- Current Price: $${priceData.price}
- Change: ${priceData.change || priceData.change24h}%
- Market Context: ${marketContext}

Based on this data, provide sentiment analysis for ${symbol}.`;

      const response = await this.deepseek.chat.completions.create({
        model: config.DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst providing market sentiment analysis. Be concise, accurate, and helpful."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const analysis = response.choices[0].message.content;
      
      return {
        symbol: symbol,
        sentiment: this.extractSentiment(analysis),
        analysis: analysis,
        riskLevel: this.extractRiskLevel(analysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting market sentiment:', error.message);
      throw new Error(`Failed to analyze sentiment for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get general market sentiment (Fear & Greed Index style)
   * @returns {Promise<Object>} General market sentiment
   */
  async getGeneralMarketSentiment() {
    try {
      // Try to get Fear & Greed Index data
      let fearGreedData = null;
      try {
        const response = await axios.get('https://api.alternative.me/fng/', {
          timeout: 5000
        });
        fearGreedData = response.data.data[0];
      } catch (error) {
        console.log('Could not fetch Fear & Greed Index, using AI analysis instead');
      }

      let prompt;
      if (fearGreedData) {
        prompt = `Current Market Data:
- Fear & Greed Index: ${fearGreedData.value}/100 (${fearGreedData.value_classification})
- Date: ${fearGreedData.timestamp}

Based on this Fear & Greed Index data, provide a comprehensive market sentiment analysis.`;
      } else {
        prompt = `Analyze the current overall market sentiment for today ${new Date().toDateString()}. Consider recent market trends, economic indicators, and general investor behavior.`;
      }

      const response = await this.deepseek.chat.completions.create({
        model: config.DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: config.SENTIMENT_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const analysis = response.choices[0].message.content;
      
      return {
        sentiment: this.extractSentiment(analysis),
        analysis: analysis,
        riskLevel: this.extractRiskLevel(analysis),
        fearGreedIndex: fearGreedData ? {
          value: fearGreedData.value,
          classification: fearGreedData.value_classification
        } : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting general market sentiment:', error.message);
      throw new Error(`Failed to analyze general market sentiment: ${error.message}`);
    }
  }

  /**
   * Gather additional market context
   * @param {string} symbol - Stock or crypto symbol
   * @param {Object} priceData - Current price data
   * @returns {Promise<string>} Market context description
   */
  async gatherMarketContext(symbol, priceData) {
    try {
      const changePercent = priceData.changePercent || priceData.change24h || 0;
      
      let context = `${symbol} is `;
      
      if (changePercent > 5) {
        context += "experiencing significant gains today";
      } else if (changePercent > 2) {
        context += "showing positive momentum";
      } else if (changePercent > -2) {
        context += "trading relatively flat";
      } else if (changePercent > -5) {
        context += "declining moderately";
      } else {
        context += "experiencing significant losses";
      }
      
      // Add volume context for crypto
      if (priceData.volume24h) {
        const volumeInMillions = priceData.volume24h / 1e6;
        if (volumeInMillions > 1000) {
          context += " with high trading volume";
        } else if (volumeInMillions > 100) {
          context += " with moderate trading volume";
        } else {
          context += " with low trading volume";
        }
      }
      
      return context;
    } catch (error) {
      return "Limited market context available";
    }
  }

  /**
   * Extract sentiment from AI analysis
   * @param {string} analysis - AI analysis text
   * @returns {string} Sentiment classification
   */
  extractSentiment(analysis) {
    const text = analysis.toLowerCase();
    
    if (text.includes('greedy') || text.includes('extreme greed')) {
      return 'Greedy';
    } else if (text.includes('fearful') || text.includes('fear')) {
      return 'Fearful';
    } else if (text.includes('balanced') || text.includes('neutral')) {
      return 'Balanced';
    } else if (text.includes('optimistic') || text.includes('bullish')) {
      return 'Optimistic';
    } else if (text.includes('pessimistic') || text.includes('bearish')) {
      return 'Pessimistic';
    } else {
      return 'Neutral';
    }
  }

  /**
   * Extract risk level from AI analysis
   * @param {string} analysis - AI analysis text
   * @returns {string} Risk level
   */
  extractRiskLevel(analysis) {
    const text = analysis.toLowerCase();
    
    if (text.includes('high risk') || text.includes('very risky')) {
      return 'High';
    } else if (text.includes('medium risk') || text.includes('moderate risk')) {
      return 'Medium';
    } else if (text.includes('low risk')) {
      return 'Low';
    } else {
      return 'Medium'; // Default
    }
  }

  /**
   * Format sentiment display
   * @param {Object} sentimentData - Sentiment analysis data
   * @returns {string} Formatted sentiment message
   */
  formatSentimentDisplay(sentimentData) {
    const { sentiment, analysis, riskLevel, fearGreedIndex, symbol } = sentimentData;
    
    let emoji = '🤔';
    switch (sentiment.toLowerCase()) {
      case 'greedy':
        emoji = '🤑';
        break;
      case 'fearful':
        emoji = '😰';
        break;
      case 'balanced':
      case 'neutral':
        emoji = '⚖️';
        break;
      case 'optimistic':
        emoji = '😊';
        break;
      case 'pessimistic':
        emoji = '😟';
        break;
    }

    let riskEmoji = '⚠️';
    switch (riskLevel.toLowerCase()) {
      case 'low':
        riskEmoji = '🟢';
        break;
      case 'medium':
        riskEmoji = '🟡';
        break;
      case 'high':
        riskEmoji = '🔴';
        break;
    }

    let message = `${emoji} *Market Sentiment Analysis*\n`;
    if (symbol) {
      message += `📊 Symbol: ${symbol}\n`;
    }
    message += `💭 Sentiment: *${sentiment}*\n`;
    message += `${riskEmoji} Risk Level: *${riskLevel}*\n\n`;
    
    if (fearGreedIndex) {
      message += `📈 Fear & Greed Index: ${fearGreedIndex.value}/100 (${fearGreedIndex.classification})\n\n`;
    }
    
    message += `🔍 *Analysis:*\n${analysis}\n\n`;
    message += `⏰ ${new Date().toLocaleString()}`;
    
    return message;
  }
}

module.exports = new SentimentService(); 