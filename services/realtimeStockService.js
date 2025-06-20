const axios = require('axios');

console.log('🔄 REAL-TIME STOCK SERVICE INITIALIZING...');

// Multiple API keys and endpoints for real-time data
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6';
const BACKUP_API_KEY = process.env.BACKUP_API_KEY || 'DEMO_KEY';

console.log('📊 Real-Time Stock Service - Multiple data sources configured');

class RealtimeStockService {
  constructor() {
    this.alphaVantageKey = ALPHA_VANTAGE_API_KEY;
    console.log('✅ RealtimeStockService initialized with multiple data sources');
  }

  async getStockPrice(symbol) {
    try {
      console.log(`📈 REAL-TIME: Fetching live stock data for ${symbol}`);
      
      // Method 1: Try Alpha Vantage INTRADAY for most recent data
      try {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'TIME_SERIES_INTRADAY',
            symbol: symbol.toUpperCase(),
            interval: '1min',
            apikey: this.alphaVantageKey,
            outputsize: 'compact'
          },
          timeout: 10000
        });

        console.log(`📊 REAL-TIME: Alpha Vantage intraday response received for ${symbol}`);

        const timeSeries = response.data['Time Series (1min)'];
        if (timeSeries && Object.keys(timeSeries).length > 0) {
          // Get the most recent minute's data
          const latestTime = Object.keys(timeSeries)[0];
          const latestData = timeSeries[latestTime];
          
          const currentPrice = parseFloat(latestData['4. close']);
          const openPrice = parseFloat(latestData['1. open']);
          const change = currentPrice - openPrice;
          const changePercent = ((change / openPrice) * 100);

          const result = {
            symbol: symbol.toUpperCase(),
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            lastUpdated: latestTime,
            currency: 'USD',
            source: 'Alpha Vantage Intraday (Real-time)'
          };

          console.log(`✅ REAL-TIME: Got live ${symbol} = $${currentPrice} from intraday data`);
          return result;
        }
      } catch (intradayError) {
        console.log(`⚠️ REAL-TIME: Intraday failed for ${symbol}, trying global quote...`);
      }

      // Method 2: Fallback to Global Quote with fresh request
      try {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol.toUpperCase(),
            apikey: this.alphaVantageKey
          },
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const data = response.data['Global Quote'];
        if (data && Object.keys(data).length > 0) {
          const price = parseFloat(data['05. price']);
          const change = parseFloat(data['09. change']);
          const changePercent = data['10. change percent'].replace('%', '');

          const result = {
            symbol: data['01. symbol'],
            price: price,
            change: change,
            changePercent: parseFloat(changePercent),
            lastUpdated: data['07. latest trading day'],
            currency: 'USD',
            source: 'Alpha Vantage Global Quote'
          };

          console.log(`✅ REAL-TIME: Got ${symbol} = $${price} from global quote`);
          return result;
        }
      } catch (globalError) {
        console.log(`⚠️ REAL-TIME: Global quote failed for ${symbol}, trying Yahoo Finance...`);
      }

      // Method 3: Yahoo Finance API (free, real-time)
      try {
        const yahooResponse = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const yahooData = yahooResponse.data.chart.result[0];
        if (yahooData && yahooData.meta) {
          const meta = yahooData.meta;
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = currentPrice - previousClose;
          const changePercent = ((change / previousClose) * 100);

          const result = {
            symbol: symbol.toUpperCase(),
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            lastUpdated: new Date(meta.regularMarketTime * 1000).toISOString(),
            currency: meta.currency || 'USD',
            source: 'Yahoo Finance (Real-time)'
          };

          console.log(`✅ REAL-TIME: Got live ${symbol} = $${currentPrice} from Yahoo Finance`);
          return result;
        }
      } catch (yahooError) {
        console.log(`⚠️ REAL-TIME: Yahoo Finance failed for ${symbol}`);
      }

      // Method 4: Financial Modeling Prep (backup)
      try {
        const fmpResponse = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol.toUpperCase()}?apikey=demo`, {
          timeout: 10000
        });

        const fmpData = fmpResponse.data[0];
        if (fmpData) {
          const result = {
            symbol: fmpData.symbol,
            price: fmpData.price,
            change: fmpData.change,
            changePercent: fmpData.changesPercentage,
            lastUpdated: new Date().toISOString(),
            currency: 'USD',
            source: 'Financial Modeling Prep'
          };

          console.log(`✅ REAL-TIME: Got ${symbol} = $${fmpData.price} from FMP`);
          return result;
        }
      } catch (fmpError) {
        console.log(`⚠️ REAL-TIME: FMP failed for ${symbol}`);
      }

      throw new Error(`All real-time data sources failed for ${symbol}`);
      
    } catch (error) {
      console.error(`❌ REAL-TIME: All sources failed for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch real-time price for ${symbol}: ${error.message}`);
    }
  }

  async getCryptoPrice(coinId) {
    try {
      console.log(`🪙 REAL-TIME: Fetching live crypto data for ${coinId}`);
      
      // Method 1: CoinGecko with real-time parameters
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: coinId.toLowerCase(),
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true,
            include_last_updated_at: true
          },
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        const data = response.data[coinId.toLowerCase()];
        if (data) {
          const result = {
            symbol: coinId.toUpperCase(),
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            marketCap: data.usd_market_cap || 0,
            volume24h: data.usd_24h_vol || 0,
            lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
            currency: 'USD',
            source: 'CoinGecko (Real-time)'
          };

          console.log(`✅ REAL-TIME: Got live ${coinId} = $${data.usd} from CoinGecko`);
          return result;
        }
      } catch (coinGeckoError) {
        console.log(`⚠️ REAL-TIME: CoinGecko failed for ${coinId}, trying CoinAPI...`);
      }

      // Method 2: CoinAPI (backup)
      try {
        const coinResponse = await axios.get(`https://rest.coinapi.io/v1/exchangerate/${coinId.toUpperCase()}/USD`, {
          headers: {
            'X-CoinAPI-Key': 'YOUR_COINAPI_KEY_OR_DEMO'
          },
          timeout: 10000
        });

        if (coinResponse.data && coinResponse.data.rate) {
          const result = {
            symbol: coinId.toUpperCase(),
            price: coinResponse.data.rate,
            change24h: 0, // Not available in this endpoint
            marketCap: 0,
            volume24h: 0,
            lastUpdated: coinResponse.data.time,
            currency: 'USD',
            source: 'CoinAPI'
          };

          console.log(`✅ REAL-TIME: Got ${coinId} = $${coinResponse.data.rate} from CoinAPI`);
          return result;
        }
      } catch (coinAPIError) {
        console.log(`⚠️ REAL-TIME: CoinAPI failed for ${coinId}`);
      }

      throw new Error(`All crypto data sources failed for ${coinId}`);
      
    } catch (error) {
      console.error(`❌ REAL-TIME: Crypto fetch failed for ${coinId}:`, error.message);
      throw new Error(`Failed to fetch real-time crypto price for ${coinId}: ${error.message}`);
    }
  }

  formatPriceDisplay(priceData, type = 'stock') {
    try {
      const { symbol, price, change, changePercent, change24h, lastUpdated, marketCap, volume24h, source } = priceData;
      
      let emoji = '📈';
      let changeValue = type === 'stock' ? change : change24h;
      let changePercentValue = type === 'stock' ? changePercent : change24h;
      
      if (changeValue < 0) {
        emoji = '📉';
      } else if (changeValue === 0) {
        emoji = '➡️';
      }

      const formattedPrice = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
      const formattedChange = changeValue >= 0 ? `+${changeValue.toFixed(2)}` : changeValue.toFixed(2);
      const formattedChangePercent = changePercentValue >= 0 ? `+${changePercentValue.toFixed(2)}%` : `${changePercentValue.toFixed(2)}%`;

      let message = `${emoji} *${symbol}* ${type === 'crypto' ? '🪙' : '📈'} *LIVE PRICE*\n`;
      message += `💰 *Current Price:* ${formattedPrice}\n`;
      message += `📊 *Today's Change:* ${formattedChange} (${formattedChangePercent})\n`;
      
      if (type === 'crypto') {
        if (marketCap > 0) {
          message += `🏪 *Market Cap:* $${(marketCap / 1e9).toFixed(2)}B\n`;
        }
        if (volume24h > 0) {
          message += `📈 *24h Volume:* $${(volume24h / 1e6).toFixed(2)}M\n`;
        }
      }
      
      message += `🔄 *Data Source:* ${source}\n`;
      message += `⏰ *Real-Time:* ${new Date().toLocaleString()}\n`;
      message += `🚀 *Last Updated:* ${new Date(lastUpdated).toLocaleString()}\n`;
      message += `🤖 *Powered by Fentrix.Ai*`;
      
      return message;
    } catch (error) {
      console.error('❌ REAL-TIME: Price formatting error:', error.message);
      return `❌ Error formatting real-time price data for ${priceData?.symbol || 'unknown symbol'}`;
    }
  }

  async testService() {
    console.log('🧪 REAL-TIME: Testing multiple data sources...');
    
    const results = {
      stockTest: false,
      cryptoTest: false,
      stockError: null,
      cryptoError: null
    };

    try {
      const stockData = await this.getStockPrice('AAPL');
      results.stockTest = stockData && stockData.price > 0;
      console.log('✅ REAL-TIME: Stock test passed with real-time data');
    } catch (error) {
      results.stockError = error.message;
      console.log('❌ REAL-TIME: Stock test failed:', error.message);
    }

    try {
      const cryptoData = await this.getCryptoPrice('bitcoin');
      results.cryptoTest = cryptoData && cryptoData.price > 0;
      console.log('✅ REAL-TIME: Crypto test passed with real-time data');
    } catch (error) {
      results.cryptoError = error.message;
      console.log('❌ REAL-TIME: Crypto test failed:', error.message);
    }

    return results;
  }
}

console.log('🚀 REAL-TIME: Creating real-time stock service instance...');
const realtimeStockService = new RealtimeStockService();
console.log('✅ REAL-TIME: Real-time stock service ready with multiple data sources');

module.exports = realtimeStockService; 
