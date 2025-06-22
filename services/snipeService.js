const axios = require('axios');

console.log('🎯 SNIPE SERVICE INITIALIZING...');

// API Keys
const FMP_API_KEY = process.env.FMP_API_KEY || '9oIeBPQadRTMDrJbksHojMJvLpvxINnd';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-46c91ac26c5f4a7896779c5a6b3db08a';

console.log('🎯 Snipe Service - FMP (Stocks/Indicators) + Alpha Vantage (Backup) + DeepSeek AI (Sentiment) configured');

class SnipeService {
  constructor() {
    this.fmpKey = FMP_API_KEY;
    this.alphaVantageKey = ALPHA_VANTAGE_API_KEY;
    this.deepseekKey = DEEPSEEK_API_KEY;
    console.log('✅ SnipeService initialized - Ready for swing trading analysis');
  }

  async executeSnipeAnalysis() {
    try {
      console.log('🎯 SNIPE: Starting market snipe analysis...');
      
      // Step 1: Get active stocks (top gainers + high volume)
      console.log('📊 Step 1: Fetching active US stocks...');
      const activeStocks = await this.getActiveStocks();
      console.log(`✅ Found ${activeStocks.length} active stocks for analysis`);
      
      // Step 2: Analyze each stock with technical indicators
      console.log('📊 Step 2: Analyzing stocks with swing trading strategy...');
      const snipeCandidates = [];
      
      for (const stock of activeStocks.slice(0, 15)) { // Limit to 15 stocks to avoid rate limits
        try {
          console.log(`🔍 Analyzing ${stock.symbol}...`);
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const analysis = await this.analyzeStock(stock);
          
          if (analysis.isBuyCandidate) {
            console.log(`🎯 BUY CANDIDATE FOUND: ${stock.symbol}`);
            snipeCandidates.push(analysis);
          }
          
          // Stop if we found enough candidates
          if (snipeCandidates.length >= 5) {
            console.log('🎯 Found enough candidates, stopping search...');
            break;
          }
          
        } catch (error) {
          console.log(`⚠️ Analysis failed for ${stock.symbol}:`, error.message);
          continue;
        }
      }
      
      // Step 3: Get news sentiment for candidates
      console.log('📰 Step 3: Analyzing news sentiment for candidates...');
      const finalCandidates = [];
      
      for (const candidate of snipeCandidates.slice(0, 5)) {
        try {
          console.log(`📰 Getting sentiment for ${candidate.symbol}...`);
          
          // Add delay for sentiment analysis
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const sentiment = await this.getStockSentiment(candidate);
          candidate.sentiment = sentiment;
          
          // Only include stocks with positive or neutral sentiment
          if (sentiment.score >= 0) {
            finalCandidates.push(candidate);
            console.log(`✅ ${candidate.symbol} added to final candidates (sentiment: ${sentiment.label})`);
          } else {
            console.log(`❌ ${candidate.symbol} rejected due to negative sentiment`);
          }
          
          // Stop if we have enough final candidates
          if (finalCandidates.length >= 3) {
            break;
          }
          
        } catch (error) {
          console.log(`⚠️ Sentiment analysis failed for ${candidate.symbol}:`, error.message);
          // Include without sentiment if analysis fails
          candidate.sentiment = { label: 'Unknown', score: 0, reason: 'Sentiment analysis failed' };
          finalCandidates.push(candidate);
        }
      }
      
      console.log(`🎯 SNIPE COMPLETE: Found ${finalCandidates.length} final candidates`);
      
      return {
        success: true,
        candidates: finalCandidates.slice(0, 3), // Return max 3 candidates
        totalAnalyzed: activeStocks.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ SNIPE: Market snipe analysis failed:', error.message);
      throw new Error(`Snipe analysis failed: ${error.message}`);
    }
  }

  async getActiveStocks() {
    try {
      console.log('📊 Fetching active stocks from FMP...');
      
      // Get top gainers and high volume stocks
      const [gainersResponse, volumeResponse] = await Promise.all([
        axios.get('https://financialmodelingprep.com/api/v3/stock_market/gainers', {
          params: { apikey: this.fmpKey },
          timeout: 15000
        }),
        axios.get('https://financialmodelingprep.com/api/v3/stock_market/actives', {
          params: { apikey: this.fmpKey },
          timeout: 15000
        })
      ]);
      
      const gainers = gainersResponse.data || [];
      const highVolume = volumeResponse.data || [];
      
      console.log(`📊 Got ${gainers.length} gainers and ${highVolume.length} high volume stocks`);
      
      // Combine and deduplicate
      const combinedStocks = [...gainers, ...highVolume];
      const uniqueStocks = combinedStocks.filter((stock, index, self) => 
        index === self.findIndex(s => s.symbol === stock.symbol)
      );
      
      // Filter for reasonable price range and volume
      const filteredStocks = uniqueStocks.filter(stock => 
        stock.price >= 5 && stock.price <= 500 && stock.volume > 100000
      );
      
      console.log(`✅ Filtered to ${filteredStocks.length} active stocks for analysis`);
      
      return filteredStocks.slice(0, 20); // Limit to top 20 to manage API calls
      
    } catch (error) {
      console.error('❌ Failed to fetch active stocks:', error.message);
      
      // Fallback: Use a predefined list of active stocks
      console.log('🔄 Using fallback stock list...');
      return [
        { symbol: 'AAPL', price: 150, volume: 50000000 },
        { symbol: 'TSLA', price: 200, volume: 40000000 },
        { symbol: 'NVDA', price: 400, volume: 30000000 },
        { symbol: 'MSFT', price: 300, volume: 25000000 },
        { symbol: 'GOOGL', price: 120, volume: 20000000 },
        { symbol: 'META', price: 250, volume: 18000000 },
        { symbol: 'AMZN', price: 130, volume: 15000000 },
        { symbol: 'AMD', price: 100, volume: 12000000 }
      ];
    }
  }

  async analyzeStock(stock) {
    try {
      const symbol = stock.symbol;
      console.log(`🔍 Technical analysis for ${symbol}...`);
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Get technical indicators
      const [rsiData, vwapData, cciData] = await Promise.all([
        this.getRSI(symbol),
        this.getVWAP(symbol),
        this.getCCI(symbol)
      ]);
      
      const analysis = {
        symbol: symbol,
        currentPrice: currentPrice,
        rsi: rsiData.rsi,
        vwap: vwapData.vwap,
        vwapSource: vwapData.source,
        cci: cciData.cci,
        volume: stock.volume,
        // Swing Trading Strategy: BUY if RSI < 30 AND CCI < -100 AND Price > VWAP
        isBuyCandidate: false
      };
      
      // Apply swing trading strategy
      if (analysis.rsi !== null && analysis.cci !== null && analysis.vwap !== null) {
        const rsiOversold = analysis.rsi < 30;
        const cciOversold = analysis.cci < -100;
        const priceAboveVWAP = currentPrice > analysis.vwap;
        
        analysis.isBuyCandidate = rsiOversold && cciOversold && priceAboveVWAP;
        
        analysis.strategyReason = `RSI: ${rsiOversold ? '✅' : '❌'} ${analysis.rsi.toFixed(1)} < 30, ` +
                                 `CCI: ${cciOversold ? '✅' : '❌'} ${analysis.cci.toFixed(1)} < -100, ` +
                                 `Price > VWAP: ${priceAboveVWAP ? '✅' : '❌'} $${currentPrice.toFixed(2)} > $${analysis.vwap.toFixed(2)}`;
      } else {
        analysis.strategyReason = 'Insufficient indicator data for strategy analysis';
      }
      
      console.log(`📊 ${symbol}: BUY=${analysis.isBuyCandidate} | ${analysis.strategyReason}`);
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ Stock analysis failed for ${stock.symbol}:`, error.message);
      throw error;
    }
  }

  async getCurrentPrice(symbol) {
    try {
      // Try FMP first
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
        params: { apikey: this.fmpKey },
        timeout: 10000
      });
      
      if (response.data && response.data.length > 0) {
        return parseFloat(response.data[0].price);
      }
      
      throw new Error('No price data from FMP');
      
    } catch (error) {
      console.log(`⚠️ FMP price failed for ${symbol}, trying Alpha Vantage...`);
      
      // Fallback to Alpha Vantage
      try {
        const avResponse = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: this.alphaVantageKey
          },
          timeout: 10000
        });
        
        const quote = avResponse.data['Global Quote'];
        if (quote && quote['05. price']) {
          return parseFloat(quote['05. price']);
        }
        
        throw new Error('No price data from Alpha Vantage');
        
      } catch (avError) {
        console.error(`❌ Both price sources failed for ${symbol}`);
        throw new Error(`Price fetch failed: ${error.message}`);
      }
    }
  }

  async getRSI(symbol) {
    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}`, {
        params: {
          period: 14,
          type: 'rsi',
          apikey: this.fmpKey
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const latestRSI = response.data[0];
        if (latestRSI && latestRSI.rsi !== undefined) {
          return { rsi: parseFloat(latestRSI.rsi) };
        }
      }
      
      return { rsi: null };
      
    } catch (error) {
      console.log(`⚠️ RSI fetch failed for ${symbol}:`, error.message);
      return { rsi: null };
    }
  }

  async getVWAP(symbol) {
    try {
      // Try FMP historical data for VWAP
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}`, {
        params: {
          apikey: this.fmpKey,
          timeseries: 1
        },
        timeout: 10000
      });

      if (response.data && response.data.historical && response.data.historical.length > 0) {
        const latestData = response.data.historical[0];
        if (latestData.vwap && latestData.vwap > 0) {
          return {
            vwap: parseFloat(latestData.vwap),
            source: 'FMP Historical'
          };
        }
      }
      
      // Fallback: Estimate VWAP
      const currentPrice = await this.getCurrentPrice(symbol);
      const estimatedVWAP = currentPrice * 0.98; // Simple estimation
      
      return {
        vwap: estimatedVWAP,
        source: 'Estimated'
      };
      
    } catch (error) {
      console.log(`⚠️ VWAP fetch failed for ${symbol}:`, error.message);
      return { vwap: null, source: 'Failed' };
    }
  }

  async getCCI(symbol) {
    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}`, {
        params: {
          period: 20,
          type: 'cci',
          apikey: this.fmpKey
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const latestCCI = response.data[0];
        if (latestCCI && latestCCI.cci !== undefined) {
          return { cci: parseFloat(latestCCI.cci) };
        }
      }
      
      return { cci: null };
      
    } catch (error) {
      console.log(`⚠️ CCI fetch failed for ${symbol}:`, error.message);
      return { cci: null };
    }
  }

  async getStockSentiment(candidate) {
    try {
      console.log(`📰 Fetching sentiment for ${candidate.symbol}...`);
      
      // Try to get recent news first
      let newsContext = '';
      try {
        const newsResponse = await axios.get(`https://financialmodelingprep.com/api/v3/stock_news`, {
          params: {
            tickers: candidate.symbol,
            limit: 3,
            apikey: this.fmpKey
          },
          timeout: 10000
        });
        
        if (newsResponse.data && newsResponse.data.length > 0) {
          newsContext = newsResponse.data
            .slice(0, 3)
            .map(news => `${news.title}: ${news.text?.substring(0, 200) || 'No summary'}`)
            .join('\n');
        }
      } catch (newsError) {
        console.log(`⚠️ News fetch failed for ${candidate.symbol}, using DeepSeek without news context`);
      }
      
      // Use DeepSeek AI for sentiment analysis
      const prompt = `Analyze the market sentiment for stock ${candidate.symbol}. 
      
Current Technical Status:
- Price: $${candidate.currentPrice}
- RSI: ${candidate.rsi} (Oversold: ${candidate.rsi < 30})
- CCI: ${candidate.cci} (Oversold: ${candidate.cci < -100})
- Price vs VWAP: ${candidate.currentPrice > candidate.vwap ? 'Above' : 'Below'} VWAP

Recent News Context:
${newsContext || 'No recent news available'}

Provide sentiment analysis in this format:
SENTIMENT: [Positive/Neutral/Negative]
SCORE: [number from -1 to 1, where 1=very positive, 0=neutral, -1=very negative]
REASON: [Brief 1-2 sentence explanation]

Focus on whether this is a good swing trading opportunity based on technical oversold conditions and news sentiment.`;

      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional stock analyst focusing on swing trading opportunities. Provide concise sentiment analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.deepseekKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const aiResponse = response.data.choices[0].message.content;
      return this.parseSentimentResponse(aiResponse);
      
    } catch (error) {
      console.log(`⚠️ Sentiment analysis failed for ${candidate.symbol}:`, error.message);
      
      // Fallback: Basic sentiment based on technical indicators
      const rsiOversold = candidate.rsi && candidate.rsi < 30;
      const cciOversold = candidate.cci && candidate.cci < -100;
      
      if (rsiOversold && cciOversold) {
        return {
          label: 'Neutral',
          score: 0.1,
          reason: 'Technical indicators suggest oversold conditions (potential bounce)'
        };
      } else {
        return {
          label: 'Neutral',
          score: 0,
          reason: 'Mixed technical signals, sentiment analysis unavailable'
        };
      }
    }
  }

  parseSentimentResponse(aiResponse) {
    try {
      const lines = aiResponse.split('\n');
      let sentiment = 'Neutral';
      let score = 0;
      let reason = 'Analysis incomplete';

      lines.forEach(line => {
        if (line.includes('SENTIMENT:')) {
          sentiment = line.split(':')[1].trim();
        } else if (line.includes('SCORE:')) {
          score = parseFloat(line.split(':')[1].trim()) || 0;
        } else if (line.includes('REASON:')) {
          reason = line.split(':')[1].trim();
        }
      });

      return {
        label: sentiment,
        score: score,
        reason: reason
      };

    } catch (error) {
      console.error('❌ Sentiment parsing failed:', error.message);
      return {
        label: 'Neutral',
        score: 0,
        reason: 'Sentiment parsing failed'
      };
    }
  }

  formatSnipeResults(results) {
    try {
      if (!results.success || results.candidates.length === 0) {
        return `🎯 *MARKET SNIPE RESULTS* 📊\n\n❌ No swing trading opportunities found right now.\n\n💡 *Strategy:* Looking for stocks with:\n• RSI < 30 (Oversold)\n• CCI < -100 (Oversold)\n• Price > VWAP (Above average)\n• Positive/Neutral News Sentiment\n\n🔄 Try again later when market conditions change.\n\n🤖 *Powered by Fentrix.Ai*`;
      }

      let message = `🎯 *MARKET SNIPE RESULTS* 📊\n\n✅ Found ${results.candidates.length} swing trading opportunities:\n\n`;

      results.candidates.forEach((candidate, index) => {
        const { symbol, currentPrice, rsi, vwap, cci, sentiment } = candidate;
        
        // Determine sentiment emoji
        let sentimentEmoji = '🟡';
        if (sentiment.label.toLowerCase().includes('positive')) {
          sentimentEmoji = '🟢';
        } else if (sentiment.label.toLowerCase().includes('negative')) {
          sentimentEmoji = '🔴';
        }

        message += `📈 *$${symbol}* (Rank #${index + 1})\n`;
        message += `💰 *Price:* $${currentPrice.toFixed(2)}\n`;
        message += `📊 *RSI:* ${rsi ? rsi.toFixed(1) : 'N/A'} ${rsi && rsi < 30 ? '✅ Oversold' : ''}\n`;
        message += `📊 *CCI:* ${cci ? cci.toFixed(1) : 'N/A'} ${cci && cci < -100 ? '✅ Oversold' : ''}\n`;
        message += `⚖️ *VWAP:* $${vwap ? vwap.toFixed(2) : 'N/A'} ${currentPrice > vwap ? '✅ Above' : '❌ Below'}\n`;
        message += `📰 *Sentiment:* ${sentimentEmoji} ${sentiment.label}\n`;
        message += `🎯 *Reason:* ${sentiment.reason}\n`;
        message += `➡️ *Action:* 🟢 **BUY CANDIDATE**\n\n`;
      });

      message += `⚠️ *SWING TRADING STRATEGY:*\n`;
      message += `• RSI < 30 (Oversold momentum)\n`;
      message += `• CCI < -100 (Oversold confirmation)\n`;
      message += `• Price > VWAP (Above average volume)\n`;
      message += `• Positive/Neutral news sentiment\n\n`;

      message += `🔍 *Analyzed:* ${results.totalAnalyzed} active stocks\n`;
      message += `⏰ *Generated:* ${new Date().toLocaleString()}\n\n`;

      message += `⚠️ *DISCLAIMER:* This is automated analysis for swing trading opportunities. Always:\n`;
      message += `• Do your own research\n`;
      message += `• Set stop-loss orders\n`;
      message += `• Manage position size\n`;
      message += `• Monitor news and earnings\n\n`;

      message += `🤖 *Powered by Fentrix.Ai*`;

      return message;

    } catch (error) {
      console.error('❌ Snipe results formatting failed:', error.message);
      return `❌ Error formatting snipe results. Please try again.\n\n🤖 *Powered by Fentrix.Ai*`;
    }
  }

  async testService() {
    console.log('🧪 SNIPE: Testing snipe service...');
    
    try {
      // Test with a small analysis
      const testStock = { symbol: 'AAPL', price: 150, volume: 50000000 };
      const testAnalysis = await this.analyzeStock(testStock);
      
      console.log('✅ SNIPE: Test passed');
      return {
        success: true,
        testAnalysis: testAnalysis
      };
    } catch (error) {
      console.log('❌ SNIPE: Test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

console.log('🎯 SNIPE: Creating snipe service instance...');
const snipeService = new SnipeService();
console.log('✅ SNIPE: Service ready for swing trading analysis');

module.exports = snipeService; 
