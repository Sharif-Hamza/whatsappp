const axios = require('axios');

console.log('🔄 TECHNICAL ANALYSIS SERVICE INITIALIZING...');

// API Keys
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-46c91ac26c5f4a7896779c5a6b3db08a';

console.log('📊 Technical Analysis Service - Alpha Vantage + DeepSeek AI configured');

class TechnicalAnalysisService {
  constructor() {
    this.alphaVantageKey = ALPHA_VANTAGE_API_KEY;
    this.deepseekKey = DEEPSEEK_API_KEY;
    console.log('✅ TechnicalAnalysisService initialized with AI trading analysis');
  }

  async getStockAnalysis(symbol) {
    try {
      console.log(`📈 TECHNICAL ANALYSIS: Fetching complete analysis for ${symbol}`);
      
      // Get current price first
      const priceData = await this.getCurrentPrice(symbol);
      
      // Get technical indicators
      const indicators = await this.getTechnicalIndicators(symbol);
      
      // Combine all data
      const analysisData = {
        symbol: symbol.toUpperCase(),
        currentPrice: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        rsi: indicators.rsi,
        vwap: indicators.vwap,
        cci: indicators.cci,
        volume: indicators.volume,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ TECHNICAL ANALYSIS: Complete data retrieved for ${symbol}`);
      return analysisData;
      
    } catch (error) {
      console.error(`❌ TECHNICAL ANALYSIS: Failed for ${symbol}:`, error.message);
      throw new Error(`Technical analysis failed for ${symbol}: ${error.message}`);
    }
  }

  async getCurrentPrice(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      const data = response.data['Global Quote'];
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No price data available');
      }

      return {
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', ''))
      };
    } catch (error) {
      console.error(`❌ Price fetch failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getTechnicalIndicators(symbol) {
    try {
      console.log(`📊 Fetching technical indicators for ${symbol}...`);
      
      // Fetch RSI, VWAP, CCI in parallel for efficiency
      const [rsiData, vwapData, cciData] = await Promise.all([
        this.getRSI(symbol),
        this.getVWAP(symbol),
        this.getCCI(symbol)
      ]);

      return {
        rsi: rsiData.rsi,
        vwap: vwapData.vwap,
        cci: cciData.cci,
        volume: vwapData.volume || 0
      };
      
    } catch (error) {
      console.error(`❌ Technical indicators failed for ${symbol}:`, error.message);
      // Return default values if indicators fail
      return {
        rsi: null,
        vwap: null,
        cci: null,
        volume: 0
      };
    }
  }

  async getRSI(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'RSI',
          symbol: symbol.toUpperCase(),
          interval: 'daily',
          time_period: 14,
          series_type: 'close',
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      const rsiData = response.data['Technical Analysis: RSI'];
      if (!rsiData) {
        console.log(`⚠️ No RSI data for ${symbol}, using fallback calculation`);
        return { rsi: null };
      }

      // Get the most recent RSI value
      const dates = Object.keys(rsiData);
      if (dates.length === 0) {
        return { rsi: null };
      }

      const latestDate = dates[0];
      const rsiValue = parseFloat(rsiData[latestDate]['RSI']);
      
      console.log(`✅ RSI for ${symbol}: ${rsiValue}`);
      return { rsi: rsiValue };
      
    } catch (error) {
      console.log(`⚠️ RSI fetch failed for ${symbol}, using estimation`);
      return { rsi: null };
    }
  }

  async getVWAP(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'VWAP',
          symbol: symbol.toUpperCase(),
          interval: '15min',
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      const vwapData = response.data['Technical Analysis: VWAP'];
      if (!vwapData) {
        console.log(`⚠️ No VWAP data for ${symbol}`);
        return { vwap: null, volume: 0 };
      }

      // Get the most recent VWAP value
      const dates = Object.keys(vwapData);
      if (dates.length === 0) {
        return { vwap: null, volume: 0 };
      }

      const latestDate = dates[0];
      const vwapValue = parseFloat(vwapData[latestDate]['VWAP']);
      
      console.log(`✅ VWAP for ${symbol}: ${vwapValue}`);
      return { vwap: vwapValue, volume: 0 };
      
    } catch (error) {
      console.log(`⚠️ VWAP fetch failed for ${symbol}`);
      return { vwap: null, volume: 0 };
    }
  }

  async getCCI(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CCI',
          symbol: symbol.toUpperCase(),
          interval: 'daily',
          time_period: 20,
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      const cciData = response.data['Technical Analysis: CCI'];
      if (!cciData) {
        console.log(`⚠️ No CCI data for ${symbol}`);
        return { cci: null };
      }

      // Get the most recent CCI value
      const dates = Object.keys(cciData);
      if (dates.length === 0) {
        return { cci: null };
      }

      const latestDate = dates[0];
      const cciValue = parseFloat(cciData[latestDate]['CCI']);
      
      console.log(`✅ CCI for ${symbol}: ${cciValue}`);
      return { cci: cciValue };
      
    } catch (error) {
      console.log(`⚠️ CCI fetch failed for ${symbol}`);
      return { cci: null };
    }
  }

  analyzeWithBasicLogic(analysisData) {
    try {
      const { rsi, vwap, cci, currentPrice } = analysisData;
      
      let signal = 'HOLD';
      let confidence = 50;
      let reasons = [];

      // RSI Analysis
      if (rsi !== null) {
        if (rsi < 30) {
          signal = 'BUY';
          confidence += 20;
          reasons.push(`RSI oversold (${rsi.toFixed(1)})`);
        } else if (rsi > 70) {
          signal = 'SELL';
          confidence += 20;
          reasons.push(`RSI overbought (${rsi.toFixed(1)})`);
        }
      }

      // VWAP Analysis
      if (vwap !== null && currentPrice) {
        if (currentPrice < vwap) {
          if (signal === 'HOLD') signal = 'BUY';
          confidence += 15;
          reasons.push(`Price below VWAP ($${vwap.toFixed(2)})`);
        } else if (currentPrice > vwap) {
          if (signal === 'HOLD') signal = 'SELL';
          confidence += 15;
          reasons.push(`Price above VWAP ($${vwap.toFixed(2)})`);
        }
      }

      // CCI Analysis
      if (cci !== null) {
        if (cci < -100) {
          if (signal !== 'SELL') signal = 'BUY';
          confidence += 10;
          reasons.push(`CCI oversold (${cci.toFixed(1)})`);
        } else if (cci > 100) {
          if (signal !== 'BUY') signal = 'SELL';
          confidence += 10;
          reasons.push(`CCI overbought (${cci.toFixed(1)})`);
        }
      }

      // Cap confidence at 95
      confidence = Math.min(confidence, 95);

      return {
        signal,
        confidence,
        reasons,
        riskLevel: confidence > 75 ? 'LOW' : confidence > 50 ? 'MEDIUM' : 'HIGH'
      };
      
    } catch (error) {
      console.error('❌ Basic logic analysis failed:', error.message);
      return {
        signal: 'HOLD',
        confidence: 50,
        reasons: ['Analysis incomplete'],
        riskLevel: 'HIGH'
      };
    }
  }

  async analyzeWithAI(analysisData) {
    try {
      console.log('🤖 Using DeepSeek AI for advanced trading analysis...');
      
      const { symbol, currentPrice, change, changePercent, rsi, vwap, cci } = analysisData;
      
      const prompt = `You are a professional stock trading analyst. Analyze this stock data and provide trading recommendations:

STOCK: ${symbol}
Current Price: $${currentPrice}
Change: ${change >= 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent}%)
RSI: ${rsi !== null ? rsi.toFixed(1) : 'N/A'}
VWAP: $${vwap !== null ? vwap.toFixed(2) : 'N/A'}
CCI: ${cci !== null ? cci.toFixed(1) : 'N/A'}

Provide analysis in this exact format:
ACTION: [BUY/SELL/HOLD]
CONFIDENCE: [1-100]%
REASONING: [Brief technical analysis]
TIMING: [Specific time suggestion like "Check at 10:30 AM tomorrow" or "Monitor during first hour of trading"]
RISK: [LOW/MEDIUM/HIGH]
TARGET: [Price target if buying/selling, or "N/A" if holding]

Keep it concise and professional.`;

      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional stock analyst providing concise trading recommendations based on technical indicators.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.deepseekKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('✅ DeepSeek AI analysis completed');
      
      return this.parseAIResponse(aiResponse);
      
    } catch (error) {
      console.log('⚠️ AI analysis failed, using basic logic:', error.message);
      return this.analyzeWithBasicLogic(analysisData);
    }
  }

  parseAIResponse(aiResponse) {
    try {
      const lines = aiResponse.split('\n');
      let action = 'HOLD';
      let confidence = 50;
      let reasoning = 'Analysis incomplete';
      let timing = 'Monitor during market hours';
      let risk = 'MEDIUM';
      let target = 'N/A';

      lines.forEach(line => {
        if (line.includes('ACTION:')) {
          action = line.split(':')[1].trim().toUpperCase();
        } else if (line.includes('CONFIDENCE:')) {
          confidence = parseInt(line.split(':')[1].replace('%', '').trim()) || 50;
        } else if (line.includes('REASONING:')) {
          reasoning = line.split(':')[1].trim();
        } else if (line.includes('TIMING:')) {
          timing = line.split(':')[1].trim();
        } else if (line.includes('RISK:')) {
          risk = line.split(':')[1].trim().toUpperCase();
        } else if (line.includes('TARGET:')) {
          target = line.split(':')[1].trim();
        }
      });

      return {
        signal: action,
        confidence: confidence,
        reasoning: reasoning,
        timing: timing,
        riskLevel: risk,
        target: target,
        source: 'DeepSeek AI'
      };

    } catch (error) {
      console.error('❌ AI response parsing failed:', error.message);
      return {
        signal: 'HOLD',
        confidence: 50,
        reasoning: 'AI analysis parsing failed',
        timing: 'Monitor during market hours',
        riskLevel: 'HIGH',
        target: 'N/A',
        source: 'Fallback'
      };
    }
  }

  getMarketTimingSuggestion(signal, symbol) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Market hours: 9:30 AM - 4:00 PM EST
    let suggestion = '';
    
    if (signal === 'BUY') {
      if (currentHour < 9) {
        suggestion = 'Consider buying at market open (9:30 AM EST)';
      } else if (currentHour >= 16) {
        suggestion = 'Consider buying at tomorrow\'s market open (9:30 AM EST)';
      } else {
        suggestion = 'Consider buying now during market hours';
      }
    } else if (signal === 'SELL') {
      if (currentHour < 9) {
        suggestion = 'Consider selling at market open (9:30 AM EST)';
      } else if (currentHour >= 16) {
        suggestion = 'Consider selling at tomorrow\'s market open (9:30 AM EST)';
      } else {
        suggestion = 'Consider selling now during market hours';
      }
    } else {
      suggestion = 'Monitor during market hours (9:30 AM - 4:00 PM EST)';
    }
    
    return suggestion;
  }

  formatAnalysisDisplay(analysisData, analysis) {
    try {
      const { symbol, currentPrice, change, changePercent, rsi, vwap, cci } = analysisData;
      const { signal, confidence, reasoning, timing, riskLevel, target, source } = analysis;
      
      // Determine emoji based on signal
      let signalEmoji = '➡️';
      let actionColor = '';
      
      if (signal === 'BUY') {
        signalEmoji = '📈💚';
        actionColor = '🟢';
      } else if (signal === 'SELL') {
        signalEmoji = '📉🔴';
        actionColor = '🔴';
      } else {
        signalEmoji = '⏸️🟡';
        actionColor = '🟡';
      }

      // Format price change
      const changeFormatted = change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`;
      const changePercentFormatted = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

      let message = `📊 *${symbol} TECHNICAL ANALYSIS* 📈\n\n`;
      
      // Current Price Section
      message += `💰 *Current Price:* $${currentPrice.toLocaleString()}\n`;
      message += `📊 *Change:* ${changeFormatted} (${changePercentFormatted})\n\n`;
      
      // Technical Indicators
      message += `🔬 *TECHNICAL INDICATORS:*\n`;
      message += `📈 *RSI:* ${rsi !== null ? rsi.toFixed(1) : 'N/A'} ${rsi !== null ? (rsi < 30 ? '(Oversold 🟢)' : rsi > 70 ? '(Overbought 🔴)' : '(Neutral 🟡)') : ''}\n`;
      message += `⚖️ *VWAP:* ${vwap !== null ? '$' + vwap.toFixed(2) : 'N/A'} ${vwap !== null && currentPrice ? (currentPrice < vwap ? '(Below 🟢)' : '(Above 🔴)') : ''}\n`;
      message += `🌊 *CCI:* ${cci !== null ? cci.toFixed(1) : 'N/A'} ${cci !== null ? (cci < -100 ? '(Oversold 🟢)' : cci > 100 ? '(Overbought 🔴)' : '(Neutral 🟡)') : ''}\n\n`;
      
      // AI Recommendation
      message += `🤖 *AI RECOMMENDATION:*\n`;
      message += `${signalEmoji} *Action:* ${actionColor} ${signal}\n`;
      message += `🎯 *Confidence:* ${confidence}% ${confidence > 75 ? '🔥' : confidence > 50 ? '⚡' : '⚠️'}\n`;
      message += `🧠 *Analysis:* ${reasoning || 'Technical analysis based on indicators'}\n`;
      message += `⏰ *Timing:* ${timing || this.getMarketTimingSuggestion(signal, symbol)}\n`;
      message += `⚠️ *Risk Level:* ${riskLevel} ${riskLevel === 'LOW' ? '🟢' : riskLevel === 'MEDIUM' ? '🟡' : '🔴'}\n`;
      
      if (target && target !== 'N/A') {
        message += `🎯 *Price Target:* ${target}\n`;
      }
      
      message += `\n💡 *NEXT STEPS:*\n`;
      if (signal === 'BUY') {
        message += `• Consider entry position\n`;
        message += `• Set stop-loss orders\n`;
        message += `• Monitor RSI for momentum\n`;
      } else if (signal === 'SELL') {
        message += `• Consider taking profits\n`;
        message += `• Review position size\n`;
        message += `• Watch for reversal signals\n`;
      } else {
        message += `• Wait for clearer signals\n`;
        message += `• Monitor key levels\n`;
        message += `• Watch for breakouts\n`;
      }
      
      message += `\n⚠️ *DISCLAIMER:* This is AI analysis, not financial advice. Always do your own research!\n`;
      message += `🔄 *Analysis by:* ${source || 'Technical Analysis AI'}\n`;
      message += `⏰ *Generated:* ${new Date().toLocaleString()}\n`;
      message += `🤖 *Powered by Fentrix.Ai*`;

      return message;
      
    } catch (error) {
      console.error('❌ Analysis display formatting failed:', error.message);
      return `❌ Error formatting analysis for ${analysisData?.symbol || 'unknown symbol'}`;
    }
  }

  async testService() {
    console.log('🧪 TECHNICAL ANALYSIS: Testing service...');
    
    try {
      const testData = await this.getStockAnalysis('AAPL');
      const testAnalysis = await this.analyzeWithAI(testData);
      
      console.log('✅ TECHNICAL ANALYSIS: Test passed');
      return {
        success: true,
        testData: testData,
        testAnalysis: testAnalysis
      };
    } catch (error) {
      console.log('❌ TECHNICAL ANALYSIS: Test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

console.log('🚀 TECHNICAL ANALYSIS: Creating technical analysis service instance...');
const technicalAnalysisService = new TechnicalAnalysisService();
console.log('✅ TECHNICAL ANALYSIS: Service ready with AI trading analysis');

module.exports = technicalAnalysisService; 
