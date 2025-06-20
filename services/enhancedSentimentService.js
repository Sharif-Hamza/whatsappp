const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config');

class EnhancedSentimentService {
  constructor() {
    // Configure OpenAI client to use DeepSeek API
    this.deepseek = new OpenAI({
      apiKey: config.DEEPSEEK_API_KEY,
      baseURL: config.DEEPSEEK_API_BASE
    });
  }

  /**
   * Get real-time market news for a symbol
   * @param {string} symbol - Stock or crypto symbol
   * @returns {Promise<Array>} Array of news articles
   */
  async getMarketNews(symbol) {
    try {
      console.log(`🌐 Fetching real-time news for ${symbol}...`);
      
      // Try multiple news sources
      const newsPromises = [
        this.getAlphaVantageNews(symbol),
        this.getGoogleNewsViaRSS(symbol),
        this.getCryptoNewsIfApplicable(symbol)
      ];

      const newsResults = await Promise.allSettled(newsPromises);
      
      let allNews = [];
      newsResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allNews = allNews.concat(result.value);
        }
      });

      // Sort by recency and limit to top 5
      return allNews
        .sort((a, b) => new Date(b.time_published || b.date) - new Date(a.time_published || a.date))
        .slice(0, 5);
        
    } catch (error) {
      console.log('⚠️ Could not fetch news, using general market data');
      return [];
    }
  }

  /**
   * Get news from Alpha Vantage
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Array>} News articles
   */
  async getAlphaVantageNews(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          limit: 3,
          apikey: config.ALPHA_VANTAGE_API_KEY
        },
        timeout: 10000
      });

      if (response.data.feed) {
        return response.data.feed.map(article => ({
          title: article.title,
          summary: article.summary,
          sentiment: article.overall_sentiment_label,
          source: article.source,
          time_published: article.time_published,
          url: article.url
        }));
      }
    } catch (error) {
      console.log('Alpha Vantage news not available');
    }
    return [];
  }

  /**
   * Get news via Google News RSS (simplified)
   * @param {string} symbol - Symbol to search for
   * @returns {Promise<Array>} News articles
   */
  async getGoogleNewsViaRSS(symbol) {
    try {
      // Use a news aggregator API or RSS parser
      const searchQuery = `${symbol} stock market`;
      // This would need a news API service - for now return empty
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get crypto-specific news if applicable
   * @param {string} symbol - Symbol to check
   * @returns {Promise<Array>} Crypto news
   */
  async getCryptoNewsIfApplicable(symbol) {
    const cryptoSymbols = ['BTC', 'ETH', 'BITCOIN', 'ETHEREUM', 'DOGE', 'SOL', 'ADA'];
    if (!cryptoSymbols.some(crypto => symbol.toUpperCase().includes(crypto))) {
      return [];
    }

    try {
      // For crypto, we could use CoinGecko or other crypto news APIs
      // For now, return empty but structure is ready
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get real-time Fear & Greed Index
   * @returns {Promise<Object>} Fear & Greed data
   */
  async getFearGreedIndex() {
    try {
      console.log('📊 Fetching real-time Fear & Greed Index...');
      const response = await axios.get('https://api.alternative.me/fng/', {
        timeout: 8000
      });
      
      if (response.data && response.data.data && response.data.data[0]) {
        const data = response.data.data[0];
        console.log(`✅ Fear & Greed Index: ${data.value}/100 (${data.value_classification})`);
        return {
          value: parseInt(data.value),
          classification: data.value_classification,
          timestamp: data.timestamp,
          lastUpdate: new Date(parseInt(data.timestamp) * 1000).toLocaleString()
        };
      }
    } catch (error) {
      console.log('⚠️ Could not fetch Fear & Greed Index');
    }
    return null;
  }

  /**
   * Get enhanced market sentiment with real-time data
   * @param {string} symbol - Stock or crypto symbol
   * @param {Object} priceData - Current price data
   * @returns {Promise<Object>} Enhanced sentiment analysis
   */
  async getEnhancedMarketSentiment(symbol, priceData) {
    try {
      console.log(`🧠 Starting enhanced sentiment analysis for ${symbol}...`);
      
      // Gather real-time data in parallel
      const [news, fearGreed] = await Promise.all([
        this.getMarketNews(symbol),
        this.getFearGreedIndex()
      ]);

      // Create comprehensive market context
      const marketContext = this.buildMarketContext(symbol, priceData, news, fearGreed);
      
      // Enhanced prompt for clean, professional response
      const prompt = `You are a professional financial analyst. Analyze the market sentiment for ${symbol} using this REAL-TIME data:

CURRENT PRICE: $${priceData.price?.toLocaleString() || 'N/A'}
CHANGE: ${priceData.change || priceData.change24h || 0}%
VOLUME: ${priceData.volume24h ? '$' + (priceData.volume24h / 1e6).toFixed(2) + 'M' : 'N/A'}

FEAR & GREED INDEX: ${fearGreed ? `${fearGreed.value}/100 (${fearGreed.classification})` : 'Unavailable'}

NEWS ANALYSIS: ${news.length > 0 ? news.map(article => `${article.title} - ${article.sentiment || 'neutral'} sentiment`).join('; ') : 'No recent news available'}

MARKET CONTEXT: ${marketContext}

Provide a professional sentiment analysis in conversational style. Do NOT use markdown formatting (no ##, **, etc.). Write naturally with clear sections separated by line breaks. Include:

1. Overall sentiment assessment (Extremely Fearful/Fearful/Neutral/Optimistic/Extremely Greedy)
2. Key driving factors
3. Risk level (Low/Medium/High) with brief explanation
4. Short-term outlook (2-3 sentences)

Keep it professional but conversational, like you're speaking to a client. Use emojis sparingly and naturally.`;

      console.log('🤖 Sending enhanced prompt to Fentrix AI...');
      
      const response = await this.deepseek.chat.completions.create({
        model: config.DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst providing clean, conversational market analysis. Never use markdown formatting. Write naturally and professionally."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.2 // Lower temperature for consistent, professional responses
      });

      const analysis = response.choices[0].message.content;
      console.log('✅ Enhanced sentiment analysis completed!');
      
      return {
        symbol: symbol,
        sentiment: this.extractEnhancedSentiment(analysis),
        analysis: analysis,
        riskLevel: this.extractRiskLevel(analysis),
        fearGreedIndex: fearGreed,
        newsCount: news.length,
        marketContext: marketContext,
        timestamp: new Date().toISOString(),
        priceChange: priceData.change || priceData.change24h || 0
      };
      
    } catch (error) {
      console.error('❌ Enhanced sentiment analysis failed:', error.message);
      throw new Error(`Failed to analyze enhanced sentiment for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get general market sentiment with real-time data
   * @returns {Promise<Object>} General market sentiment
   */
  async getEnhancedGeneralSentiment() {
    try {
      console.log('🌍 Analyzing general market sentiment with real-time data...');
      
      const fearGreed = await this.getFearGreedIndex();
      
      const prompt = `Analyze the overall market sentiment using this REAL-TIME data:

FEAR & GREED INDEX: ${fearGreed ? `${fearGreed.value}/100 (${fearGreed.classification})` : 'Unavailable'}
MARKET SESSION: ${this.getCurrentMarketSession()}
VOLATILITY ASSESSMENT: ${fearGreed ? this.assessVolatilityFromFearGreed(fearGreed.value) : 'Moderate'}

Provide a professional general market sentiment analysis. Do NOT use markdown formatting (no ##, **, etc.). Write conversationally and professionally. Include:

1. Overall market mood and sentiment
2. Key market factors and concerns
3. Risk assessment for current conditions
4. General outlook for investors

Keep it natural and professional, like explaining to a client over the phone.`;

      const response = await this.deepseek.chat.completions.create({
        model: config.DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a senior market analyst providing clean, conversational market analysis. Never use markdown formatting. Write naturally and professionally."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 350,
        temperature: 0.2
      });

      const analysis = response.choices[0].message.content;
      
      return {
        sentiment: this.extractEnhancedSentiment(analysis),
        analysis: analysis,
        riskLevel: this.extractRiskLevel(analysis),
        fearGreedIndex: fearGreed,
        marketSession: this.getCurrentMarketSession(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ General sentiment analysis failed:', error.message);
      throw new Error(`Failed to analyze general market sentiment: ${error.message}`);
    }
  }

  /**
   * Build comprehensive market context
   */
  buildMarketContext(symbol, priceData, news, fearGreed) {
    const changePercent = priceData.changePercent || priceData.change24h || 0;
    
    let context = `${symbol} `;
    
    if (Math.abs(changePercent) > 10) {
      context += "is experiencing extreme volatility";
    } else if (Math.abs(changePercent) > 5) {
      context += "is showing significant price movement";
    } else if (Math.abs(changePercent) > 2) {
      context += "has moderate price action";
    } else {
      context += "is trading relatively stable";
    }
    
    if (changePercent > 0) {
      context += " with bullish momentum";
    } else if (changePercent < 0) {
      context += " with bearish pressure";
    }
    
    if (fearGreed) {
      context += `. Market-wide sentiment is ${fearGreed.classification.toLowerCase()} (Fear & Greed: ${fearGreed.value}/100)`;
    }
    
    if (news.length > 0) {
      const sentiments = news.map(n => n.sentiment).filter(s => s);
      if (sentiments.length > 0) {
        const positiveSentiments = sentiments.filter(s => s.toLowerCase().includes('positive')).length;
        const negativeSentiments = sentiments.filter(s => s.toLowerCase().includes('negative')).length;
        
        if (positiveSentiments > negativeSentiments) {
          context += ". Recent news sentiment is generally positive";
        } else if (negativeSentiments > positiveSentiments) {
          context += ". Recent news sentiment is generally negative";
        } else {
          context += ". Recent news sentiment is mixed";
        }
      }
    }
    
    return context;
  }

  /**
   * Extract enhanced sentiment with more nuanced categories
   */
  extractEnhancedSentiment(analysis) {
    const text = analysis.toLowerCase();
    
    if (text.includes('extremely greedy') || text.includes('euphoric')) {
      return 'Extremely Greedy';
    } else if (text.includes('greedy') || text.includes('very optimistic')) {
      return 'Greedy';
    } else if (text.includes('optimistic') || text.includes('bullish')) {
      return 'Optimistic';
    } else if (text.includes('neutral') || text.includes('balanced')) {
      return 'Neutral';
    } else if (text.includes('pessimistic') || text.includes('bearish')) {
      return 'Pessimistic';
    } else if (text.includes('fearful') || text.includes('concerned')) {
      return 'Fearful';
    } else if (text.includes('extremely fearful') || text.includes('panic')) {
      return 'Extremely Fearful';
    } else {
      return 'Neutral';
    }
  }

  /**
   * Extract risk level from analysis
   */
  extractRiskLevel(analysis) {
    const text = analysis.toLowerCase();
    
    if (text.includes('high risk') || text.includes('very risky') || text.includes('extreme risk')) {
      return 'High';
    } else if (text.includes('medium risk') || text.includes('moderate risk')) {
      return 'Medium';
    } else if (text.includes('low risk') || text.includes('minimal risk')) {
      return 'Low';
    } else {
      return 'Medium';
    }
  }

  /**
   * Get current market session
   */
  getCurrentMarketSession() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 9 && hour < 16) {
      return 'US Market Open';
    } else if (hour >= 16 && hour < 20) {
      return 'After Hours';
    } else if (hour >= 4 && hour < 9) {
      return 'Pre Market';
    } else {
      return 'Market Closed';
    }
  }

  /**
   * Interpret Fear & Greed level
   */
  interpretFearGreedLevel(value) {
    if (value >= 75) return 'Market shows signs of excessive optimism';
    if (value >= 55) return 'Market sentiment is generally positive';
    if (value >= 45) return 'Market sentiment is neutral';
    if (value >= 25) return 'Market shows signs of concern';
    return 'Market sentiment is very cautious';
  }

  /**
   * Assess volatility from Fear & Greed
   */
  assessVolatilityFromFearGreed(value) {
    if (value >= 80 || value <= 20) return 'High';
    if (value >= 60 || value <= 40) return 'Moderate';
    return 'Low';
  }

  /**
   * Format enhanced sentiment display with beautiful emojis and clean layout
   */
  formatEnhancedSentimentDisplay(sentimentData) {
    const { 
      sentiment, 
      analysis, 
      riskLevel, 
      fearGreedIndex, 
      symbol, 
      newsCount, 
      marketContext,
      priceChange,
      marketSession 
    } = sentimentData;
    
    // Enhanced emoji mapping
    let sentimentEmoji = '🤔';
    let headerEmoji = '💭';
    
    switch (sentiment) {
      case 'Extremely Greedy':
        sentimentEmoji = '🤑';
        headerEmoji = '🚀';
        break;
      case 'Greedy':
        sentimentEmoji = '😊';
        headerEmoji = '📈';
        break;
      case 'Optimistic':
        sentimentEmoji = '😌';
        headerEmoji = '📈';
        break;
      case 'Neutral':
        sentimentEmoji = '😐';
        headerEmoji = '⚖️';
        break;
      case 'Pessimistic':
        sentimentEmoji = '😟';
        headerEmoji = '📉';
        break;
      case 'Fearful':
        sentimentEmoji = '😰';
        headerEmoji = '📉';
        break;
      case 'Extremely Fearful':
        sentimentEmoji = '😱';
        headerEmoji = '💥';
        break;
    }

    let riskEmoji = '⚠️';
    switch (riskLevel) {
      case 'Low':
        riskEmoji = '🟢';
        break;
      case 'Medium':
        riskEmoji = '🟡';
        break;
      case 'High':
        riskEmoji = '🔴';
        break;
    }

    // Price change emoji
    let priceEmoji = '➡️';
    if (priceChange > 5) priceEmoji = '🚀';
    else if (priceChange > 2) priceEmoji = '📈';
    else if (priceChange > 0) priceEmoji = '📈';
    else if (priceChange < -5) priceEmoji = '💥';
    else if (priceChange < -2) priceEmoji = '📉';
    else if (priceChange < 0) priceEmoji = '📉';

    let message = `${headerEmoji} *MARKET SENTIMENT ANALYSIS*\n\n`;
    
    if (symbol) {
      message += `📊 *${symbol}* ${priceEmoji} ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%\n`;
    }
    
    message += `${sentimentEmoji} *Sentiment:* ${sentiment}\n`;
    message += `${riskEmoji} *Risk Level:* ${riskLevel}\n`;
    
    if (marketSession) {
      let sessionEmoji = '🕐';
      if (marketSession.includes('Open')) sessionEmoji = '🟢';
      else if (marketSession.includes('After') || marketSession.includes('Pre')) sessionEmoji = '🟡';
      else sessionEmoji = '🔴';
      
      message += `${sessionEmoji} *Market:* ${marketSession}\n`;
    }
    
    if (fearGreedIndex) {
      let fearGreedEmoji = '📊';
      if (fearGreedIndex.value >= 75) fearGreedEmoji = '🤑';
      else if (fearGreedIndex.value >= 55) fearGreedEmoji = '😊';
      else if (fearGreedIndex.value >= 45) fearGreedEmoji = '😐';
      else if (fearGreedIndex.value >= 25) fearGreedEmoji = '😟';
      else fearGreedEmoji = '😰';
      
      message += `${fearGreedEmoji} *Fear & Greed:* ${fearGreedIndex.value}/100 (${fearGreedIndex.classification})\n`;
    }
    
    if (newsCount > 0) {
      message += `📰 *News Sources:* ${newsCount} articles analyzed\n`;
    }
    
    message += `\n💡 *Professional Analysis:*\n${analysis}\n\n`;
    
    message += `⏰ ${new Date().toLocaleString()}\n`;
    message += `🤖 *Powered by Fentrix.Ai*`;
    
    return message;
  }
}

module.exports = new EnhancedSentimentService(); 