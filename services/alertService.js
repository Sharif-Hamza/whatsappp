// Import stockService with error handling
let stockService;
try {
  stockService = require('./stockService');
  console.log('✅ StockService loaded in AlertService');
} catch (error) {
  console.error('❌ Failed to load StockService in AlertService:', error.message);
  stockService = null;
}

class AlertService {
  constructor() {
    try {
      this.activeAlerts = new Map(); // Store alerts by chatId
      this.monitoringInterval = null;
      this.isMonitoring = false;
      this.checkIntervalMs = 15000; // Check every 15 seconds for faster response
      this.botClient = null; // Will be set by the main bot
      this.cryptoSymbols = [
        'bitcoin', 'ethereum', 'cardano', 'solana', 'dogecoin', 'ripple', 'litecoin',
        'polkadot', 'chainlink', 'stellar', 'vechain', 'filecoin', 'tron', 'cosmos',
        'algorand', 'avalanche', 'polygon', 'fantom', 'near', 'harmony', 'elrond',
        'btc', 'eth', 'ada', 'sol', 'doge', 'xrp', 'ltc', 'dot', 'link', 'xlm',
        'vet', 'fil', 'trx', 'atom', 'algo', 'avax', 'matic', 'ftm', 'one', 'egld'
      ];
      
      console.log('🚀 AlertService initialized');
      console.log(`📊 StockService available: ${stockService ? 'Yes' : 'No'}`);
      
      if (stockService) {
        console.log('🔄 Starting continuous monitoring...');
        this.startContinuousMonitoring();
      } else {
        console.log('⚠️ AlertService running without StockService - alerts disabled');
      }
      
    } catch (error) {
      console.error('❌ AlertService constructor failed:', error.message);
      throw error;
    }
  }

  /**
   * Set the WhatsApp client for sending notifications
   * @param {Object} client - WhatsApp client instance
   */
  setBotClient(client) {
    this.botClient = client;
    console.log('✅ Bot client connected to AlertService');
  }

  /**
   * Detect if a symbol is likely a cryptocurrency
   * @param {string} symbol - Symbol to check
   * @returns {boolean} True if likely crypto
   */
  isCryptoSymbol(symbol) {
    const lowerSymbol = symbol.toLowerCase();
    return this.cryptoSymbols.includes(lowerSymbol);
  }

  /**
   * Add a new price alert - simplified interface
   * @param {string} alertText - Alert command text like "AAPL $187.50"
   * @param {string} chatId - Chat ID where alert was created
   * @param {string} userId - User who created the alert (optional)
   * @param {string} userName - Display name of user (optional)
   * @returns {Promise<Object>} Alert result
   */
  async addAlert(alertText, chatId, userId = 'unknown', userName = 'User') {
    try {
      console.log(`🚨 Processing alert command: "${alertText}"`);
      
      if (!stockService) {
        return {
          success: false,
          message: '❌ Alert service not available - Stock service failed to load'
        };
      }

      // Parse the alert command
      const parsed = this.parseAlertCommand(alertText);
      if (!parsed) {
        return {
          success: false,
          message: '❌ Invalid alert format. Use: !alert SYMBOL $price\n\nExamples:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000'
        };
      }

      const { symbol, targetPrice } = parsed;
      console.log(`📊 Parsed alert: ${symbol} @ $${targetPrice}`);

      // Get current price to determine alert direction
      const assetType = this.isCryptoSymbol(symbol) ? 'crypto' : 'stock';
      console.log(`📈 Asset type detected: ${assetType}`);

      let currentPrice;
      try {
        if (assetType === 'crypto') {
          const cryptoData = await stockService.getCryptoPrice(symbol.toLowerCase());
          currentPrice = cryptoData.price;
        } else {
          const stockData = await stockService.getStockPrice(symbol);
          currentPrice = stockData.price;
        }
      } catch (priceError) {
        console.log(`❌ Current price fetch failed: ${priceError.message}`);
        return {
          success: false,
          message: `❌ Could not fetch current price for ${symbol}: ${priceError.message}`
        };
      }

      console.log(`💰 Current price: $${currentPrice} | Target: $${targetPrice}`);

      // Create the alert
      const alert = this.createAlert(chatId, symbol, targetPrice, userId, userName, currentPrice, assetType);
      
      // Determine direction message
      let directionText = '';
      if (alert.alertDirection === 'up') {
        directionText = `📈 Alert when price rises to $${targetPrice.toLocaleString()}`;
      } else if (alert.alertDirection === 'down') {
        directionText = `📉 Alert when price drops to $${targetPrice.toLocaleString()}`;
      } else {
        directionText = `🎯 Target price already reached!`;
      }

      return {
        success: true,
        message: `🚨 *PRICE ALERT CREATED!* ✅\n\n${assetType === 'crypto' ? '🪙' : '📈'} *${symbol}* (${assetType.toUpperCase()})\n💰 *Current Price:* $${currentPrice.toLocaleString()}\n🎯 *Target Price:* $${targetPrice.toLocaleString()}\n\n${directionText}\n\n🔍 *Live monitoring active* (15s intervals)\n📱 You'll be notified when target is reached\n\n🤖 *Powered by Fentrix.Ai*`,
        alert: alert
      };

    } catch (error) {
      console.error('❌ Alert creation failed:', error.message);
      return {
        success: false,
        message: `❌ Failed to create alert: ${error.message}`
      };
    }
  }

  /**
   * Create alert object and store it
   * @param {string} chatId - Chat ID
   * @param {string} symbol - Symbol
   * @param {number} targetPrice - Target price
   * @param {string} userId - User ID
   * @param {string} userName - User name
   * @param {number} currentPrice - Current price
   * @param {string} assetType - 'stock' or 'crypto'
   * @returns {Object} Alert object
   */
  createAlert(chatId, symbol, targetPrice, userId, userName, currentPrice, assetType) {
    const alertId = `${symbol}_${targetPrice}_${Date.now()}`;
    
    // Determine alert direction based on current vs target price
    let alertDirection = 'up'; // Default to up
    if (targetPrice > currentPrice) {
      alertDirection = 'up';   // Alert when price rises to target
    } else if (targetPrice < currentPrice) {
      alertDirection = 'down'; // Alert when price drops to target
    } else {
      alertDirection = 'exact'; // Target price already reached
    }
    
    const alert = {
      id: alertId,
      chatId: chatId,
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      currentPriceAtCreation: parseFloat(currentPrice),
      alertDirection: alertDirection,
      userId: userId,
      userName: userName || 'Unknown User',
      createdAt: new Date(),
      isActive: true,
      assetType: assetType // 'stock' or 'crypto'
    };

    // Initialize chat alerts if not exists
    if (!this.activeAlerts.has(chatId)) {
      this.activeAlerts.set(chatId, new Map());
    }

    // Add alert to chat
    this.activeAlerts.get(chatId).set(alertId, alert);

    console.log(`📢 Alert created: ${symbol} (${assetType}) @ $${targetPrice} [${alertDirection.toUpperCase()}] by ${userName}`);
    console.log(`📊 Current: $${currentPrice} | Target: $${targetPrice} | Direction: ${alertDirection}`);

    // Start monitoring if not already running
    this.startMonitoring();

    return alert;
  }

  /**
   * Get current price for a symbol (stock or crypto)
   * @param {string} symbol - Symbol to check
   * @param {string} assetType - 'stock' or 'crypto'
   * @returns {Promise<Object>} Price data
   */
  async getCurrentPrice(symbol, assetType) {
    if (!stockService) {
      throw new Error('Stock service not available');
    }

    try {
      if (assetType === 'crypto' || this.isCryptoSymbol(symbol)) {
        console.log(`🪙 Fetching crypto price for ${symbol}...`);
        return await stockService.getCryptoPrice(symbol.toLowerCase());
      } else {
        console.log(`📈 Fetching stock price for ${symbol}...`);
        return await stockService.getStockPrice(symbol);
      }
    } catch (error) {
      // If initial type fails, try the other type
      try {
        if (assetType === 'crypto') {
          console.log(`🔄 Crypto failed, trying stock for ${symbol}...`);
          return await stockService.getStockPrice(symbol);
        } else {
          console.log(`🔄 Stock failed, trying crypto for ${symbol}...`);
          return await stockService.getCryptoPrice(symbol.toLowerCase());
        }
      } catch (fallbackError) {
        throw new Error(`Could not fetch price for ${symbol} as either stock or crypto: ${error.message}`);
      }
    }
  }

  /**
   * Get all active alerts across all chats
   * @returns {Array} Array of all alerts
   */
  getActiveAlerts() {
    const allAlerts = [];
    for (const chatAlerts of this.activeAlerts.values()) {
      for (const alert of chatAlerts.values()) {
        if (alert.isActive) {
          allAlerts.push(alert);
        }
      }
    }
    return allAlerts;
  }

  /**
   * Get all active alerts for a chat
   * @param {string} chatId - Chat ID
   * @returns {Array} Array of alerts
   */
  getChatAlerts(chatId) {
    const chatAlerts = this.activeAlerts.get(chatId);
    if (!chatAlerts) return [];
    
    return Array.from(chatAlerts.values()).filter(alert => alert.isActive);
  }

  /**
   * Start continuous monitoring that never stops
   */
  startContinuousMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 Monitoring already running...');
      return;
    }

    if (!stockService) {
      console.log('⚠️ Cannot start monitoring - StockService not available');
      return;
    }

    console.log('🎯 STARTING CONTINUOUS LIVE PRICE MONITORING...');
    console.log(`📊 Check interval: ${this.checkIntervalMs / 1000} seconds`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.checkAlertsAndLogPrices();
    }, this.checkIntervalMs);
    
    // Initial check
    setTimeout(() => this.checkAlertsAndLogPrices(), 2000);
  }

  /**
   * Enhanced monitoring that always shows live prices
   */
  async checkAlertsAndLogPrices() {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`\n🔍 [${currentTime}] LIVE PRICE MONITORING CHECK...`);
    
    if (!stockService) {
      console.log('⚠️ StockService not available - skipping monitoring');
      return;
    }
    
    const allAlerts = this.getActiveAlerts();
    
    if (allAlerts.length === 0) {
      console.log('📭 No active alerts - but still monitoring live prices...');
      // Show some live prices anyway
      await this.showLivePricesSample();
      return;
    }

    console.log(`🚨 Checking ${allAlerts.length} active alerts against live prices...`);

    // Group alerts by symbol to minimize API calls
    const alertsBySymbol = new Map();
    allAlerts.forEach(alert => {
      if (!alertsBySymbol.has(alert.symbol)) {
        alertsBySymbol.set(alert.symbol, []);
      }
      alertsBySymbol.get(alert.symbol).push(alert);
    });

    console.log(`📊 Fetching live prices for: ${Array.from(alertsBySymbol.keys()).join(', ')}`);

    // Check each symbol with enhanced error handling
    for (const [symbol, symbolAlerts] of alertsBySymbol) {
      try {
        // Use the asset type from the first alert for this symbol
        const assetType = symbolAlerts[0].assetType;
        console.log(`\n💰 Fetching LIVE ${assetType.toUpperCase()} price for ${symbol}...`);
        
        const priceData = await this.getCurrentPrice(symbol, assetType);
        const currentPrice = priceData.price;
        const change = priceData.changePercent || priceData.change24h || 0;

        console.log(`✅ LIVE PRICE: ${symbol} = $${currentPrice.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`);

        // Check each alert for this symbol
        for (const alert of symbolAlerts) {
          console.log(`🎯 Checking alert: ${alert.symbol} target $${alert.targetPrice} [${alert.alertDirection.toUpperCase()}]`);
          
          if (this.shouldTriggerAlert(alert, currentPrice)) {
            console.log(`🚨🚨 ALERT TRIGGERED! ${symbol} hit $${currentPrice} (target: $${alert.targetPrice}) 🚨🚨`);
            await this.sendAlertNotification(alert, currentPrice, priceData);
            this.removeAlert(alert.chatId, alert.id);
            console.log(`✅ Alert notification sent and removed for ${symbol}`);
          } else {
            const diff = alert.alertDirection === 'up' 
              ? (alert.targetPrice - currentPrice).toFixed(2)
              : (currentPrice - alert.targetPrice).toFixed(2);
            console.log(`⏳ Still waiting... ${symbol} needs $${diff} more to ${alert.alertDirection === 'up' ? 'rise' : 'drop'}`);
          }
        }

      } catch (error) {
        console.log(`❌ Error fetching live price for ${symbol}: ${error.message}`);
        console.log(`🔄 Will retry on next check...`);
      }
    }
    
    console.log(`✅ Live monitoring check complete - next check in ${this.checkIntervalMs / 1000} seconds`);
  }

  /**
   * Show sample live prices when no alerts are active
   */
  async showLivePricesSample() {
    try {
      console.log('📈 Showing sample live prices...');
      
      // Check a few popular symbols
      const sampleSymbols = [
        { symbol: 'bitcoin', type: 'crypto' },
        { symbol: 'ethereum', type: 'crypto' }
      ];
      
      for (const sample of sampleSymbols) {
        try {
          const priceData = await this.getCurrentPrice(sample.symbol, sample.type);
          const change = priceData.changePercent || priceData.change24h || 0;
          console.log(`📊 LIVE: ${sample.symbol.toUpperCase()} = $${priceData.price.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`);
        } catch (err) {
          console.log(`⚠️ Could not fetch ${sample.symbol}: ${err.message}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Sample price check failed:', error.message);
    }
  }

  /**
   * Start monitoring (legacy method for compatibility)
   */
  startMonitoring() {
    // Just ensure continuous monitoring is running
    this.startContinuousMonitoring();
  }

  /**
   * Determine if an alert should be triggered
   * @param {Object} alert - Alert object
   * @param {number} currentPrice - Current price
   * @returns {boolean} Whether to trigger alert
   */
  shouldTriggerAlert(alert, currentPrice) {
    const { targetPrice, alertDirection, currentPriceAtCreation } = alert;
    
    console.log(`🔍 Checking alert: ${alert.symbol}`);
    console.log(`   📊 Current: $${currentPrice} | Target: $${targetPrice}`);
    console.log(`   📈 Direction: ${alertDirection} | Original: $${currentPriceAtCreation}`);
    
    let shouldTrigger = false;
    
    if (alertDirection === 'up') {
      // Alert when price rises to or above target
      shouldTrigger = currentPrice >= targetPrice;
      console.log(`   ⬆️ UP Alert: ${currentPrice} >= ${targetPrice} = ${shouldTrigger}`);
    } else if (alertDirection === 'down') {
      // Alert when price drops to or below target
      shouldTrigger = currentPrice <= targetPrice;
      console.log(`   ⬇️ DOWN Alert: ${currentPrice} <= ${targetPrice} = ${shouldTrigger}`);
    } else if (alertDirection === 'exact') {
      // Target was already reached when created
      shouldTrigger = true;
      console.log(`   🎯 EXACT Alert: Already at target, triggering immediately`);
    }
    
    console.log(`   🚨 Result: ${shouldTrigger ? 'TRIGGER' : 'WAIT'}`);
    return shouldTrigger;
  }

  /**
   * Send alert notification to the chat
   * @param {Object} alert - Alert object
   * @param {number} currentPrice - Current price that triggered alert
   * @param {Object} priceData - Complete price data
   */
  async sendAlertNotification(alert, currentPrice, priceData) {
    if (!this.botClient) {
      console.log('❌ No bot client available for sending notifications');
      return;
    }

    try {
      const chat = await this.botClient.getChatById(alert.chatId);
      
      // Create alert message with emojis
      let alertEmoji = '🚨';
      let priceEmoji = '📉';
      let actionEmoji = '💰';
      let assetEmoji = alert.assetType === 'crypto' ? '🪙' : '📈';
      
      // Determine if price went up or down
      const priceChange = priceData.changePercent || priceData.change24h || 0;
      if (priceChange > 0) {
        priceEmoji = '📈';
      } else if (priceChange < 0) {
        priceEmoji = '📉';
      }

      const assetTypeText = alert.assetType === 'crypto' ? 'CRYPTO' : 'STOCK';

      const alertMessage = `${alertEmoji} *PRICE ALERT TRIGGERED!* ${alertEmoji}

${assetEmoji} *${alert.symbol}* (${assetTypeText}) has hit your target price!

📊 *Current Price:* $${currentPrice.toLocaleString()}
🎯 *Target Price:* $${alert.targetPrice.toLocaleString()}
${priceEmoji} *Change Today:* ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%

👤 *Alert by:* ${alert.userName}
⏰ *Time:* ${new Date().toLocaleString()}

${actionEmoji} *Consider your trading strategy!* The ${alert.assetType} has reached your target level.

🤖 *Powered by Fentrix.Ai*`;

      await chat.sendMessage(alertMessage);
      console.log(`✅ Alert notification sent to chat ${alert.chatId}`);

    } catch (error) {
      console.log(`❌ Failed to send alert notification:`, error.message);
    }
  }

  /**
   * Parse alert command
   * @param {string} text - Command text
   * @returns {Object|null} Parsed command or null if invalid
   */
  parseAlertCommand(text) {
    // Expected format: !alert SYMBOL $price
    // e.g., "!alert AAPL $187.50" or "!alert bitcoin $45000" or "!alert bitcoin $104,600"
    
    console.log(`🔍 Parsing alert command: "${text}"`);
    
    const parts = text.trim().split(/\s+/);
    
    console.log(`📝 Command parts:`, parts);
    
    if (parts.length !== 3) {
      console.log(`❌ Invalid parts count: ${parts.length}, expected 3`);
      return null;
    }

    const [command, symbol, priceStr] = parts;
    
    if (!command.toLowerCase().includes('alert')) {
      console.log(`❌ Command doesn't contain 'alert': ${command}`);
      return null;
    }

    // Parse price (remove $ and commas if present)
    const cleanPrice = priceStr.replace(/[$,]/g, '');
    console.log(`💰 Cleaned price string: "${priceStr}" -> "${cleanPrice}"`);
    
    const targetPrice = parseFloat(cleanPrice);

    if (isNaN(targetPrice) || targetPrice <= 0) {
      console.log(`❌ Invalid price: ${cleanPrice} -> ${targetPrice}`);
      return null;
    }

    console.log(`✅ Parsed successfully: ${symbol} @ $${targetPrice}`);
    
    return {
      symbol: symbol.toUpperCase(),
      targetPrice: targetPrice
    };
  }

  /**
   * Remove an alert
   * @param {string} chatId - Chat ID
   * @param {string} alertId - Alert ID to remove
   * @returns {boolean} Success status
   */
  removeAlert(chatId, alertId) {
    const chatAlerts = this.activeAlerts.get(chatId);
    if (!chatAlerts) return false;

    const alert = chatAlerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      chatAlerts.delete(alertId);
      console.log(`🗑️ Alert removed: ${alert.symbol} (${alert.assetType}) @ $${alert.targetPrice}`);
      return true;
    }
    return false;
  }

  /**
   * Get time ago string
   * @param {Date} date - Date to compare
   * @returns {string} Time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.getActiveAlerts().length,
      stockServiceAvailable: !!stockService,
      botClientConnected: !!this.botClient,
      checkInterval: this.checkIntervalMs
    };
  }
}

// Export singleton instance
const alertServiceInstance = new AlertService();

module.exports = alertServiceInstance; 
