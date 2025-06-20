console.log('🔄 SIMPLE SENTIMENT SERVICE INITIALIZING...');

class SimpleSentimentService {
  constructor() {
    console.log('✅ SimpleSentimentService initialized successfully');
  }

  async getEnhancedMarketSentiment(symbol = null, priceData = null) {
    try {
      console.log(`🧠 SimpleSentimentService: Analyzing sentiment for ${symbol || 'general market'}`);

      // Basic sentiment based on price changes
      let sentiment = 'neutral';
      let score = 50;
      let reasoning = 'Market data analysis in progress';

      if (priceData) {
        const change = priceData.changePercent || priceData.change24h || 0;
        
        if (change > 5) {
          sentiment = 'very_bullish';
          score = 85;
          reasoning = `Strong positive momentum with ${change.toFixed(2)}% gain`;
        } else if (change > 2) {
          sentiment = 'bullish';
          score = 70;
          reasoning = `Positive trend with ${change.toFixed(2)}% increase`;
        } else if (change > 0) {
          sentiment = 'slightly_bullish';
          score = 60;
          reasoning = `Modest gains of ${change.toFixed(2)}%`;
        } else if (change < -5) {
          sentiment = 'very_bearish';
          score = 15;
          reasoning = `Significant decline of ${change.toFixed(2)}%`;
        } else if (change < -2) {
          sentiment = 'bearish';
          score = 30;
          reasoning = `Negative trend with ${change.toFixed(2)}% drop`;
        } else if (change < 0) {
          sentiment = 'slightly_bearish';
          score = 40;
          reasoning = `Minor decline of ${change.toFixed(2)}%`;
        }
      }

      const result = {
        symbol: symbol || 'MARKET',
        sentiment: sentiment,
        score: score,
        reasoning: reasoning,
        analysis: {
          priceAction: priceData ? 'Price data analyzed' : 'No price data available',
          marketMood: this.getMarketMood(score),
          recommendation: this.getRecommendation(score)
        },
        timestamp: new Date().toISOString()
      };

      console.log(`✅ SimpleSentimentService: Sentiment analysis complete - ${sentiment} (${score})`);
      return result;

    } catch (error) {
      console.error('❌ SimpleSentimentService: Sentiment analysis failed:', error.message);
      
      // Fallback neutral sentiment
      return {
        symbol: symbol || 'MARKET',
        sentiment: 'neutral',
        score: 50,
        reasoning: 'Basic analysis due to service limitations',
        analysis: {
          priceAction: 'Limited data available',
          marketMood: 'Neutral',
          recommendation: 'Monitor market conditions'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  getMarketMood(score) {
    if (score >= 80) return 'Very Optimistic';
    if (score >= 70) return 'Optimistic';
    if (score >= 60) return 'Cautiously Optimistic';
    if (score >= 40) return 'Cautious';
    if (score >= 30) return 'Pessimistic';
    return 'Very Pessimistic';
  }

  getRecommendation(score) {
    if (score >= 80) return 'Strong buy signals present';
    if (score >= 70) return 'Consider buying opportunities';
    if (score >= 60) return 'Hold positions, watch for entry';
    if (score >= 40) return 'Monitor closely, be cautious';
    if (score >= 30) return 'Consider reducing exposure';
    return 'Exercise extreme caution';
  }

  formatEnhancedSentimentDisplay(sentiment) {
    try {
      const { symbol, sentiment: mood, score, reasoning, analysis } = sentiment;
      
      let sentimentEmoji = '😐';
      if (score >= 80) sentimentEmoji = '🚀';
      else if (score >= 70) sentimentEmoji = '📈';
      else if (score >= 60) sentimentEmoji = '👍';
      else if (score >= 40) sentimentEmoji = '⚠️';
      else if (score >= 30) sentimentEmoji = '📉';
      else sentimentEmoji = '🔴';

      let message = `🧠 *MARKET SENTIMENT ANALYSIS* ${sentimentEmoji}\n\n`;
      message += `📊 *Asset:* ${symbol}\n`;
      message += `💭 *Sentiment:* ${mood.replace('_', ' ').toUpperCase()}\n`;
      message += `📈 *Score:* ${score}/100\n\n`;
      message += `🔍 *Analysis:*\n`;
      message += `• ${reasoning}\n`;
      message += `• Market Mood: ${analysis.marketMood}\n`;
      message += `• Recommendation: ${analysis.recommendation}\n\n`;
      message += `⏰ *Generated:* ${new Date().toLocaleString()}\n`;
      message += `🤖 *Powered by Fentrix.Ai*`;

      return message;
    } catch (error) {
      console.error('❌ SimpleSentimentService: Display formatting failed:', error.message);
      return `🧠 *SENTIMENT ANALYSIS*\n\n❌ Error formatting sentiment data\n\n🤖 *Powered by Fentrix.Ai*`;
    }
  }
}

console.log('🚀 SimpleSentimentService: Creating instance...');
const simpleSentimentService = new SimpleSentimentService();
console.log('✅ SimpleSentimentService: Instance created successfully');

module.exports = simpleSentimentService; 
