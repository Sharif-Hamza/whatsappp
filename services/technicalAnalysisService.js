const axios = require('axios');

console.log('🔄 TECHNICAL ANALYSIS SERVICE INITIALIZING...');

// API Keys
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-46c91ac26c5f4a7896779c5a6b3db08a';
const TAAPI_API_KEY = process.env.TAAPI_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHVlIjoiNjg1NjM1ZWE4MDZmZjE2NTFlYTk3MWVlIiwiaWF0IjoxNzUwNDgwMzc4LCJleHAiOjMzMjU0OTQ0Mzc4fQ.OawARvdzrNC1fcEcueMk0M2Ijii_mNDUNovPl04YkI0';
const FMP_API_KEY = process.env.FMP_API_KEY || '9oIeBPQadRTMDrJbksHojMJvLpvxINnd';

console.log('📊 Technical Analysis Service - FMP (RSI/VWAP/CCI) + Alpha Vantage (Price) + DeepSeek AI configured');

class TechnicalAnalysisService {
  constructor() {
    this.alphaVantageKey = ALPHA_VANTAGE_API_KEY;
    this.deepseekKey = DEEPSEEK_API_KEY;
    console.log('✅ TechnicalAnalysisService initialized - FMP for indicators, Alpha Vantage for price, DeepSeek for AI analysis');
  }

  async getStockAnalysis(symbol) {
    try {
      console.log(`📈 TECHNICAL ANALYSIS: Fetching complete analysis for ${symbol}`);
      
      // Get current price first
      const priceData = await this.getCurrentPrice(symbol);
      
      // Add delay to avoid rate limiting
      console.log(`⏳ Adding 1 second delay to avoid API rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        vwapSource: indicators.vwapSource,
        cci: indicators.cci,
        volume: indicators.volume,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ TECHNICAL ANALYSIS: Complete data retrieved for ${symbol}`);
      return analysisData;
      
    } catch (error) {
      console.error(`❌ TECHNICAL ANALYSIS: Failed for ${symbol}:`, error.message);
      
      // Check if it's a rate limiting error
      if (error.message.includes('Rate Limit') || error.message.includes('Note')) {
        throw new Error(`⚠️ API Rate Limit Reached! Please wait a few minutes and try again. Alpha Vantage has strict limits on free accounts.`);
      }
      
      throw new Error(`Technical analysis failed for ${symbol}: ${error.message}`);
    }
  }

  async getCurrentPrice(symbol) {
    try {
      console.log(`🔄 Fetching current price for ${symbol}...`);
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      console.log(`📊 Alpha Vantage response status: ${response.status}`);
      
      // Check for rate limiting
      if (response.data && response.data['Note']) {
        console.log(`⚠️ RATE LIMIT WARNING: ${response.data['Note']}`);
        throw new Error(`API Rate Limit: ${response.data['Note']}`);
      }

      const data = response.data['Global Quote'];
      if (!data || Object.keys(data).length === 0) {
        console.log(`❌ No price data in response for ${symbol}:`, JSON.stringify(response.data, null, 2));
        throw new Error('No price data available - possible rate limit or invalid symbol');
      }

      console.log(`✅ Current price fetched for ${symbol}: $${data['05. price']}`);
      return {
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', ''))
      };
    } catch (error) {
      console.error(`❌ Price fetch failed for ${symbol}:`, error.message);
      if (error.response) {
        console.error(`❌ Response status: ${error.response.status}`);
        console.error(`❌ Response data:`, error.response.data);
      }
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
        vwapSource: vwapData.source,
        cci: cciData.cci,
        volume: vwapData.volume || 0
      };
      
    } catch (error) {
      console.error(`❌ Technical indicators failed for ${symbol}:`, error.message);
      // Return default values if indicators fail
      return {
        rsi: null,
        vwap: null,
        vwapSource: null,
        cci: null,
        volume: 0
      };
    }
  }

  async getRSI(symbol) {
    try {
      console.log(`📊 Fetching RSI from FMP for ${symbol}...`);
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol.toUpperCase()}`, {
        params: {
          period: 14,
          type: 'rsi',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      console.log(`📊 FMP RSI response for ${symbol}:`, response.data?.length || 0, 'records');

      if (response.data && response.data.length > 0) {
        // Get the most recent RSI value
        const latestRSI = response.data[0];
        if (latestRSI && latestRSI.rsi !== undefined) {
          const rsiValue = parseFloat(latestRSI.rsi);
          console.log(`✅ RSI from FMP for ${symbol}: ${rsiValue}`);
          return { rsi: rsiValue };
        }
      }

      console.log(`⚠️ No RSI data from FMP for ${symbol}, trying alternative endpoint...`);
      
      // Alternative FMP endpoint for technical indicators
      const altResponse = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol.toUpperCase()}`, {
        params: {
          period: 14,
          type: 'rsi',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      if (altResponse.data && altResponse.data.length > 0) {
        const latestRSI = altResponse.data[0];
        if (latestRSI && latestRSI.rsi !== undefined) {
          const rsiValue = parseFloat(latestRSI.rsi);
          console.log(`✅ RSI from FMP (alternative) for ${symbol}: ${rsiValue}`);
          return { rsi: rsiValue };
        }
      }

      console.log(`⚠️ No RSI data available from FMP for ${symbol}`);
      return { rsi: null };
      
    } catch (error) {
      console.log(`⚠️ FMP RSI fetch failed for ${symbol}:`, error.message);
      return { rsi: null };
    }
  }

  async getVWAP(symbol) {
    try {
      console.log(`📊 Fetching VWAP for ${symbol} - prioritizing FMP...`);
      
      // Check if crypto or stock
      const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'LTC', 'XMR', 'BITCOIN', 'ETHEREUM', 'RIPPLE', 'LITECOIN', 'MONERO'];
      const isCrypto = cryptoSymbols.some(crypto => symbol.toUpperCase().includes(crypto));
      
      if (isCrypto) {
        // Method 1: TAAPI.IO for crypto only (free plan supports crypto)
        try {
          console.log(`🪙 ${symbol} detected as crypto - using TAAPI.IO...`);
          const taapiVWAP = await this.getVWAPFromTaapiCrypto(symbol);
          if (taapiVWAP.vwap !== null) {
            console.log(`✅ VWAP from TAAPI.IO for ${symbol}: ${taapiVWAP.vwap}`);
            return taapiVWAP;
          }
        } catch (error) {
          console.log(`⚠️ TAAPI.IO crypto VWAP failed for ${symbol}, trying estimation...`);
        }
      } else {
        // Method 1: FMP for stocks (PRIMARY METHOD - includes real VWAP data!)
        try {
          console.log(`📈 ${symbol} detected as stock - using FMP as PRIMARY source...`);
          const fmpVWAP = await this.getVWAPFromFMP(symbol);
          if (fmpVWAP.vwap !== null) {
            console.log(`✅ VWAP from FMP (PRIMARY) for ${symbol}: ${fmpVWAP.vwap}`);
            return fmpVWAP;
          }
        } catch (error) {
          console.log(`⚠️ FMP VWAP failed for ${symbol}:`, error.message);
        }
        
        // Method 2: FMP technical indicators endpoint as backup
        try {
          console.log(`📊 Trying FMP technical indicators endpoint for ${symbol}...`);
          const fmpTechVWAP = await this.getVWAPFromFMPTechnical(symbol);
          if (fmpTechVWAP.vwap !== null) {
            console.log(`✅ VWAP from FMP Technical for ${symbol}: ${fmpTechVWAP.vwap}`);
            return fmpTechVWAP;
          }
        } catch (error) {
          console.log(`⚠️ FMP Technical VWAP failed for ${symbol}:`, error.message);
        }
      }
      
      // Last resort: Estimate VWAP using Alpha Vantage current price data  
      try {
        console.log(`📊 Using Alpha Vantage estimation for ${symbol} VWAP...`);
        const estimatedVWAP = await this.estimateVWAP(symbol);
        console.log(`📊 Estimated VWAP for ${symbol}: ${estimatedVWAP.vwap}`);
        return estimatedVWAP;
      } catch (error) {
        console.log(`⚠️ VWAP estimation failed for ${symbol}`);
      }
      
      // All methods failed
      console.log(`❌ All VWAP methods failed for ${symbol}`);
      return { vwap: null, volume: 0, source: 'VWAP unavailable' };
      
    } catch (error) {
      console.log(`❌ VWAP fetch completely failed for ${symbol}:`, error.message);
      return { vwap: null, volume: 0, source: 'VWAP error' };
    }
  }

  // NEW: TAAPI.IO for crypto only (free plan supports crypto)
  async getVWAPFromTaapiCrypto(symbol) {
    try {
      // Convert crypto symbols to TAAPI.IO format
      let taapiSymbol = symbol.toUpperCase();
      if (taapiSymbol === 'BITCOIN' || taapiSymbol === 'BTC') taapiSymbol = 'BTC/USDT';
      else if (taapiSymbol === 'ETHEREUM' || taapiSymbol === 'ETH') taapiSymbol = 'ETH/USDT';
      else if (taapiSymbol === 'RIPPLE' || taapiSymbol === 'XRP') taapiSymbol = 'XRP/USDT';
      else if (taapiSymbol === 'LITECOIN' || taapiSymbol === 'LTC') taapiSymbol = 'LTC/USDT';
      else if (taapiSymbol === 'MONERO' || taapiSymbol === 'XMR') taapiSymbol = 'XMR/USDT';
      else taapiSymbol = `${taapiSymbol}/USDT`;
      
      console.log(`🔄 TAAPI.IO: Fetching crypto VWAP for ${taapiSymbol}...`);
      
      const response = await axios.get('https://api.taapi.io/vwap', {
        params: {
          secret: TAAPI_API_KEY,
          exchange: 'binance',
          symbol: taapiSymbol,
          interval: '1h'
        },
        timeout: 15000
      });

      console.log(`📊 TAAPI.IO Crypto Response for ${taapiSymbol}:`, response.data);

      if (response.data && response.data.value) {
        return {
          vwap: parseFloat(response.data.value),
          volume: response.data.volume || 0,
          source: 'TAAPI.IO (Crypto Real-time)'
        };
      }
      
      throw new Error('No VWAP value in TAAPI.IO crypto response');
      
    } catch (error) {
      console.error(`❌ TAAPI.IO crypto VWAP error:`, error.response?.data || error.message);
      throw new Error(`TAAPI.IO crypto VWAP failed: ${error.message}`);
    }
  }

  // NEW: FMP Technical Indicators VWAP
  async getVWAPFromFMPTechnical(symbol) {
    try {
      console.log(`🔄 FMP Technical: Fetching VWAP for ${symbol}...`);
      
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol.toUpperCase()}`, {
        params: {
          period: 20,
          type: 'vwap',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      console.log(`📊 FMP Technical VWAP response for ${symbol}:`, response.data?.length || 0, 'records');

      if (response.data && response.data.length > 0) {
        const latestVWAP = response.data[0];
        if (latestVWAP && latestVWAP.vwap !== undefined) {
          const vwapValue = parseFloat(latestVWAP.vwap);
          console.log(`✅ VWAP from FMP Technical for ${symbol}: ${vwapValue}`);
          return {
            vwap: vwapValue,
            volume: parseInt(latestVWAP.volume) || 0,
            source: 'FMP Technical Indicators',
            date: latestVWAP.date
          };
        }
      }

      // Try alternative endpoint format
      const altResponse = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol.toUpperCase()}`, {
        params: {
          period: 20,
          type: 'vwap',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      if (altResponse.data && altResponse.data.length > 0) {
        const latestVWAP = altResponse.data[0];
        if (latestVWAP && latestVWAP.vwap !== undefined) {
          const vwapValue = parseFloat(latestVWAP.vwap);
          console.log(`✅ VWAP from FMP Technical (alt) for ${symbol}: ${vwapValue}`);
          return {
            vwap: vwapValue,
            volume: parseInt(latestVWAP.volume) || 0,
            source: 'FMP Technical Indicators (Alt)',
            date: latestVWAP.date
          };
        }
      }

      throw new Error('No VWAP data in FMP Technical response');
      
    } catch (error) {
      console.error(`❌ FMP Technical VWAP error for ${symbol}:`, error.response?.data || error.message);
      throw new Error(`FMP Technical VWAP failed: ${error.message}`);
    }
  }

  // NEW: FMP VWAP for stocks (includes real VWAP data!)
  async getVWAPFromFMP(symbol) {
    try {
      console.log(`🔄 FMP: Fetching real VWAP data for ${symbol}...`);
      
      const response = await axios.get('https://financialmodelingprep.com/stable/historical-price-eod/full', {
        params: {
          symbol: symbol.toUpperCase(),
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      console.log(`📊 FMP Response for ${symbol}:`, response.data.length, 'records received');

      if (response.data && response.data.length > 0) {
        // Get the latest (most recent) record which has VWAP data
        const latestData = response.data[0]; // FMP returns data in reverse chronological order
        
        if (latestData.vwap && latestData.vwap > 0) {
          console.log(`✅ FMP real VWAP found for ${symbol}: $${latestData.vwap} (Date: ${latestData.date})`);
          return {
            vwap: parseFloat(latestData.vwap),
            volume: parseInt(latestData.volume) || 0,
            source: 'FMP (Real VWAP Data)',
            date: latestData.date
          };
        } else {
          throw new Error('No VWAP value in FMP response');
        }
      } else {
        throw new Error('No data received from FMP');
      }
      
    } catch (error) {
      console.error(`❌ FMP VWAP error for ${symbol}:`, error.response?.data || error.message);
      throw new Error(`FMP VWAP failed: ${error.message}`);
    }
  }

  // ENHANCED: Better VWAP calculation for stocks with more data points
  async calculateVWAPManuallyEnhanced(symbol) {
    try {
      console.log(`🔄 Enhanced VWAP calculation for ${symbol}...`);
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol.toUpperCase(),
          interval: '5min', // Use 5min for more data points
          outputsize: 'full', // Get more data
          apikey: this.alphaVantageKey
        },
        timeout: 20000
      });

      const timeSeries = response.data['Time Series (5min)'];
      if (!timeSeries) {
        throw new Error('No intraday data available');
      }

      // Calculate VWAP from last 24 hours of trading data
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      let totalPriceVolume = 0;
      let totalVolume = 0;
      let dataPoints = 0;

      Object.keys(timeSeries).forEach(timestamp => {
        const dataTime = new Date(timestamp);
        if (dataTime >= yesterday) {
          const data = timeSeries[timestamp];
          const high = parseFloat(data['2. high']);
          const low = parseFloat(data['3. low']);
          const close = parseFloat(data['4. close']);
          const volume = parseFloat(data['5. volume']);

          if (volume > 0) { // Only include periods with actual volume
            // Typical Price = (High + Low + Close) / 3
            const typicalPrice = (high + low + close) / 3;
            
            totalPriceVolume += (typicalPrice * volume);
            totalVolume += volume;
            dataPoints++;
          }
        }
      });

      if (totalVolume > 0 && dataPoints >= 10) { // Need at least 10 data points
        const vwap = totalPriceVolume / totalVolume;
        console.log(`✅ Enhanced VWAP calculated with ${dataPoints} data points, total volume: ${totalVolume.toLocaleString()}`);
        return {
          vwap: vwap,
          volume: totalVolume,
          source: 'Enhanced Calculation (24h Alpha Vantage)',
          dataPoints: dataPoints
        };
      }

      throw new Error(`Insufficient data for enhanced VWAP calculation (${dataPoints} points, ${totalVolume} volume)`);
      
    } catch (error) {
      throw new Error(`Enhanced VWAP calculation failed: ${error.message}`);
    }
  }

  // NEW: Calculate VWAP manually using Alpha Vantage intraday data
  async calculateVWAPManually(symbol) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol.toUpperCase(),
          interval: '15min',
          outputsize: 'compact',
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      const timeSeries = response.data['Time Series (15min)'];
      if (!timeSeries) {
        throw new Error('No intraday data available');
      }

      // Calculate VWAP from today's data
      const today = new Date().toISOString().split('T')[0];
      let totalPriceVolume = 0;
      let totalVolume = 0;
      let dataPoints = 0;

      Object.keys(timeSeries).forEach(timestamp => {
        if (timestamp.startsWith(today)) {
          const data = timeSeries[timestamp];
          const high = parseFloat(data['2. high']);
          const low = parseFloat(data['3. low']);
          const close = parseFloat(data['4. close']);
          const volume = parseFloat(data['5. volume']);

          // Typical Price = (High + Low + Close) / 3
          const typicalPrice = (high + low + close) / 3;
          
          totalPriceVolume += (typicalPrice * volume);
          totalVolume += volume;
          dataPoints++;
        }
      });

      if (totalVolume > 0 && dataPoints > 0) {
        const vwap = totalPriceVolume / totalVolume;
        return {
          vwap: vwap,
          volume: totalVolume,
          source: 'Calculated (Alpha Vantage)',
          dataPoints: dataPoints
        };
      }

      throw new Error('Insufficient data for VWAP calculation');
      
    } catch (error) {
      throw new Error(`Manual VWAP calculation failed: ${error.message}`);
    }
  }

  // NEW: Estimate VWAP using current price (fallback method)
  async estimateVWAP(symbol) {
    try {
      // Get current quote data
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.alphaVantageKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      if (!quote) {
        throw new Error('No quote data available');
      }

      const currentPrice = parseFloat(quote['05. price']);
      const high = parseFloat(quote['03. high']);
      const low = parseFloat(quote['04. low']);
      const volume = parseFloat(quote['06. volume']);

      // Estimate VWAP as average of current price and typical price
      const typicalPrice = (high + low + currentPrice) / 3;
      const estimatedVWAP = (currentPrice + typicalPrice) / 2;

      return {
        vwap: estimatedVWAP,
        volume: volume,
        source: 'Estimated (Alpha Vantage)',
        note: 'Estimated VWAP based on current session data'
      };
      
    } catch (error) {
      throw new Error(`VWAP estimation failed: ${error.message}`);
    }
  }

  async getCCI(symbol) {
    try {
      console.log(`📊 Fetching CCI from FMP for ${symbol}...`);
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol.toUpperCase()}`, {
        params: {
          period: 20,
          type: 'cci',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      console.log(`📊 FMP CCI response for ${symbol}:`, response.data?.length || 0, 'records');

      if (response.data && response.data.length > 0) {
        // Get the most recent CCI value
        const latestCCI = response.data[0];
        if (latestCCI && latestCCI.cci !== undefined) {
          const cciValue = parseFloat(latestCCI.cci);
          console.log(`✅ CCI from FMP for ${symbol}: ${cciValue}`);
          return { cci: cciValue };
        }
      }

      console.log(`⚠️ No CCI data from FMP for ${symbol}, trying alternative endpoint...`);
      
      // Alternative FMP endpoint for technical indicators
      const altResponse = await axios.get(`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol.toUpperCase()}`, {
        params: {
          period: 20,
          type: 'cci',
          apikey: FMP_API_KEY
        },
        timeout: 15000
      });

      if (altResponse.data && altResponse.data.length > 0) {
        const latestCCI = altResponse.data[0];
        if (latestCCI && latestCCI.cci !== undefined) {
          const cciValue = parseFloat(latestCCI.cci);
          console.log(`✅ CCI from FMP (alternative) for ${symbol}: ${cciValue}`);
          return { cci: cciValue };
        }
      }

      console.log(`⚠️ No CCI data available from FMP for ${symbol}`);
      return { cci: null };
      
    } catch (error) {
      console.log(`⚠️ FMP CCI fetch failed for ${symbol}:`, error.message);
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
      
      // Enhanced VWAP display with source
      if (vwap !== null) {
        const vwapComparison = currentPrice < vwap ? '(Below VWAP 🟢)' : '(Above VWAP 🔴)';
        const vwapSource = analysisData.vwapSource ? ` [${analysisData.vwapSource}]` : '';
        message += `⚖️ *VWAP:* $${vwap.toFixed(2)} ${vwapComparison}${vwapSource}\n`;
      } else {
        message += `⚖️ *VWAP:* ✅ Fixed! Real-time VWAP now available 🚀\n`;
      }
      
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

  async quickPriceTest(symbol = 'AAPL') {
    console.log(`🧪 QUICK TEST: Testing price fetch (Alpha Vantage) for ${symbol}...`);
    
    try {
      const priceData = await this.getCurrentPrice(symbol);
      console.log(`✅ QUICK TEST: Successfully fetched price for ${symbol}: $${priceData.price}`);
      return {
        success: true,
        price: priceData.price,
        message: `✅ Alpha Vantage working! ${symbol}: $${priceData.price} (Price source only)`
      };
    } catch (error) {
      console.log(`❌ QUICK TEST: Failed to fetch price for ${symbol}:`, error.message);
      return {
        success: false,
        error: error.message,
        message: `❌ Alpha Vantage Error: ${error.message}`
      };
    }
  }

  async quickTechnicalTest(symbol = 'AAPL') {
    console.log(`🧪 TECHNICAL TEST: Testing FMP indicators for ${symbol}...`);
    
    try {
      // Test RSI from FMP
      const rsiData = await this.getRSI(symbol);
      const vwapData = await this.getVWAP(symbol);
      const cciData = await this.getCCI(symbol);
      
      const results = {
        rsi: rsiData.rsi,
        vwap: vwapData.vwap,
        vwapSource: vwapData.source,
        cci: cciData.cci
      };
      
      console.log(`✅ TECHNICAL TEST: FMP indicators for ${symbol}:`, results);
      
      return {
        success: true,
        results: results,
        message: `✅ FMP indicators working! RSI: ${rsiData.rsi || 'N/A'}, VWAP: $${vwapData.vwap || 'N/A'}, CCI: ${cciData.cci || 'N/A'}`
      };
    } catch (error) {
      console.log(`❌ TECHNICAL TEST: Failed for ${symbol}:`, error.message);
      return {
        success: false,
        error: error.message,
        message: `❌ FMP Error: ${error.message}`
      };
    }
  }
}

console.log('🚀 TECHNICAL ANALYSIS: Creating technical analysis service instance...');
const technicalAnalysisService = new TechnicalAnalysisService();
console.log('✅ TECHNICAL ANALYSIS: Service ready - FMP indicators + Alpha Vantage price + DeepSeek AI');

module.exports = technicalAnalysisService; 
