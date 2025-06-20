const axios = require('axios');

console.log('🔄 SIMPLE STOCK SERVICE INITIALIZING...');

// Direct environment variables - no config dependency
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6';
const STOCK_API_BASE = 'https://www.alphavantage.co/query';
const CRYPTO_API_BASE = 'https://api.coingecko.com/api/v3';

console.log('📊 Simple Stock Service - Alpha Vantage Key:', ALPHA_VANTAGE_API_KEY ? 'Set' : 'Missing');
console.log('🌐 Simple Stock Service - Stock API:', STOCK_API_BASE);
console.log('🪙 Simple Stock Service - Crypto API:', CRYPTO_API_BASE);

class SimpleStockService {
  constructor() {
    this.alphaVantageKey = ALPHA_VANTAGE_API_KEY;
    console.log('✅ SimpleStockService initialized successfully');
  }

  async getStockPrice(symbol) {
    try {
      console.log(`📈 SimpleStockService: Fetching stock data for ${symbol}`);
      
      const response = await axios.get(STOCK_API_BASE, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.alphaVantageKey
        },
        timeout: 15000
      });

      console.log(`📊 SimpleStockService: API Response received for ${symbol}`);

      const data = response.data['Global Quote'];
      if (!data || Object.keys(data).length === 0) {
        throw new Error(`Stock symbol "${symbol}" not found or API limit reached`);
      }

      const price = parseFloat(data['05. price']);
      const change = parseFloat(data['09. change']);
      const changePercent = data['10. change percent'].replace('%', '');

      const result = {
        symbol: data['01. symbol'],
        price: price,
        change: change,
        changePercent: parseFloat(changePercent),
        lastUpdated: data['07. latest trading day'],
        currency: 'USD'
      };

      console.log(`✅ SimpleStockService: Successfully got ${symbol} = $${price}`);
      return result;
      
    } catch (error) {
      console.error(`❌ SimpleStockService: Stock error for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch stock price for ${symbol}: ${error.message}`);
    }
  }

  async getCryptoPrice(coinId) {
    try {
      console.log(`🪙 SimpleStockService: Fetching crypto data for ${coinId}`);
      
      const response = await axios.get(`${CRYPTO_API_BASE}/simple/price`, {
        params: {
          ids: coinId.toLowerCase(),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        },
        timeout: 15000
      });

      console.log(`📊 SimpleStockService: Crypto API Response received for ${coinId}`);

      const data = response.data[coinId.toLowerCase()];
      if (!data) {
        throw new Error(`Cryptocurrency "${coinId}" not found`);
      }

      const result = {
        symbol: coinId.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        currency: 'USD'
      };

      console.log(`✅ SimpleStockService: Successfully got ${coinId} = $${data.usd}`);
      return result;
      
    } catch (error) {
      console.error(`❌ SimpleStockService: Crypto error for ${coinId}:`, error.message);
      throw new Error(`Failed to fetch crypto price for ${coinId}: ${error.message}`);
    }
  }

  formatPriceDisplay(priceData, type = 'stock') {
    try {
      const { symbol, price, change, changePercent, change24h, lastUpdated, marketCap, volume24h } = priceData;
      
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

      let message = `${emoji} *${symbol}* ${type === 'crypto' ? '🪙' : '📈'}\n`;
      message += `💰 *Price:* ${formattedPrice}\n`;
      message += `📊 *Change:* ${formattedChange} (${formattedChangePercent})\n`;
      
      if (type === 'crypto') {
        if (marketCap > 0) {
          message += `🏪 *Market Cap:* $${(marketCap / 1e9).toFixed(2)}B\n`;
        }
        if (volume24h > 0) {
          message += `📈 *24h Volume:* $${(volume24h / 1e6).toFixed(2)}M\n`;
        }
      } else {
        message += `📅 *Last Updated:* ${lastUpdated}\n`;
      }
      
      message += `⏰ *Time:* ${new Date().toLocaleString()}\n`;
      message += `🤖 *Powered by Fentrix.Ai*`;
      
      return message;
    } catch (error) {
      console.error('❌ SimpleStockService: Price formatting error:', error.message);
      return `❌ Error formatting price data for ${priceData?.symbol || 'unknown symbol'}`;
    }
  }

  async testService() {
    console.log('🧪 SimpleStockService: Testing...');
    
    const results = {
      stockTest: false,
      cryptoTest: false,
      stockError: null,
      cryptoError: null
    };

    try {
      const stockData = await this.getStockPrice('AAPL');
      results.stockTest = stockData && stockData.price > 0;
      console.log('✅ SimpleStockService: Stock test passed');
    } catch (error) {
      results.stockError = error.message;
      console.log('❌ SimpleStockService: Stock test failed:', error.message);
    }

    try {
      const cryptoData = await this.getCryptoPrice('bitcoin');
      results.cryptoTest = cryptoData && cryptoData.price > 0;
      console.log('✅ SimpleStockService: Crypto test passed');
    } catch (error) {
      results.cryptoError = error.message;
      console.log('❌ SimpleStockService: Crypto test failed:', error.message);
    }

    return results;
  }
}

console.log('🚀 SimpleStockService: Creating instance...');
const simpleStockService = new SimpleStockService();
console.log('✅ SimpleStockService: Instance created successfully');

module.exports = simpleStockService; 
