const stockService = require('./stockService');

class AlertService {
  constructor() {
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
    
    // Start monitoring immediately when service is created
    console.log('🚀 Alert Service initialized - starting continuous monitoring...');
    this.startContinuousMonitoring();
  }

  /**
   * Set the WhatsApp client for sending notifications
   * @param {Object} client - WhatsApp client instance
   */
  setBotClient(client) {
    this.botClient = client;
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
   * Add a new price alert
   * @param {string} chatId - Chat ID where alert was created
   * @param {string} symbol - Stock/crypto symbol
   * @param {number} targetPrice - Target price to alert at
   * @param {string} userId - User who created the alert
   * @param {string} userName - Display name of user
   * @param {number} currentPrice - Current price when alert was created
   * @returns {Object} Alert details
   */
  addAlert(chatId, symbol, targetPrice, userId, userName, currentPrice) {
    const alertId = `${symbol}_${targetPrice}_${Date.now()}`;
    const assetType = this.isCryptoSymbol(symbol) ? 'crypto' : 'stock';
    
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
        throw new Error(`Could not fetch price for ${symbol} as either stock or crypto`);
      }
    }
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
   * Get all active alerts across all chats
   * @returns {Array} Array of all alerts
   */
  getAllAlerts() {
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
   * Start continuous monitoring that never stops
   */
  startContinuousMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 Monitoring already running...');
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
    
    const allAlerts = this.getAllAlerts();
    
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
   * Stop monitoring completely
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Live price monitoring stopped');
  }

  /**
   * Legacy checkAlerts method - now redirects to enhanced version
   */
  async checkAlerts() {
    await this.checkAlertsAndLogPrices();
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

${actionEmoji} *Consider buying now!* The ${alert.assetType} has reached your target level.

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
   * Format current alerts display
   * @param {string} chatId - Chat ID
   * @returns {string} Formatted alerts message
   */
  formatAlertsDisplay(chatId) {
    const alerts = this.getChatAlerts(chatId);
    
    if (alerts.length === 0) {
      return '📭 *No active alerts in this chat*\n\n💡 Create alerts with: !alert SYMBOL $price\n\n📈 *Stock Examples:*\n• !alert AAPL $187.50\n• !alert TSLA $200.00\n\n🪙 *Crypto Examples:*\n• !alert bitcoin $45000\n• !alert ethereum $2500';
    }

    let message = `📢 *ACTIVE PRICE ALERTS* (${alerts.length})\n\n`;

    // Separate stocks and crypto for better display
    const stockAlerts = alerts.filter(alert => alert.assetType === 'stock');
    const cryptoAlerts = alerts.filter(alert => alert.assetType === 'crypto');

    if (stockAlerts.length > 0) {
      message += `📈 *STOCKS (${stockAlerts.length}):*\n`;
      stockAlerts.forEach((alert, index) => {
        const timeAgo = this.getTimeAgo(alert.createdAt);
        const directionEmoji = alert.alertDirection === 'up' ? '⬆️' : alert.alertDirection === 'down' ? '⬇️' : '🎯';
        message += `${index + 1}. 📊 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
        message += `   👤 By: ${alert.userName} | ⏰ ${timeAgo} | Direction: ${alert.alertDirection.toUpperCase()}\n\n`;
      });
    }

    if (cryptoAlerts.length > 0) {
      message += `🪙 *CRYPTO (${cryptoAlerts.length}):*\n`;
      cryptoAlerts.forEach((alert, index) => {
        const timeAgo = this.getTimeAgo(alert.createdAt);
        const directionEmoji = alert.alertDirection === 'up' ? '⬆️' : alert.alertDirection === 'down' ? '⬇️' : '🎯';
        message += `${index + 1}. 🪙 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
        message += `   👤 By: ${alert.userName} | ⏰ ${timeAgo} | Direction: ${alert.alertDirection.toUpperCase()}\n\n`;
      });
    }

    message += `🔍 LIVE monitoring every ${this.checkIntervalMs / 1000} seconds with real-time price checks\n`;
    message += `📊 Background monitoring is always active\n`;
    message += `🤖 *Powered by Fentrix.Ai*`;

    return message;
  }

  /**
   * Get time ago string
   * @param {Date} date - Date to compare
   * @returns {string} Time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  /**
   * Get monitoring status
   * @returns {Object} Monitoring status
   */
  getStatus() {
    const allAlerts = this.getAllAlerts();
    const stockAlerts = allAlerts.filter(alert => alert.assetType === 'stock');
    const cryptoAlerts = allAlerts.filter(alert => alert.assetType === 'crypto');

    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: allAlerts.length,
      stockAlerts: stockAlerts.length,
      cryptoAlerts: cryptoAlerts.length,
      checkInterval: this.checkIntervalMs / 1000,
      chatsWithAlerts: this.activeAlerts.size
    };
  }
}

module.exports = new AlertService(); 