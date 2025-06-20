console.log('🔄 WORKING ALERT SERVICE INITIALIZING...');

class WorkingAlertService {
  constructor() {
    this.activeAlerts = new Map();
    this.botClient = null;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.checkIntervalMs = 30000; // Check every 30 seconds for real alerts
    this.stockService = null;
    
    console.log('✅ WorkingAlertService initialized - ready for real-time monitoring');
  }

  setBotClient(client) {
    this.botClient = client;
    console.log('✅ WorkingAlertService: Bot client connected');
  }

  setStockService(service) {
    this.stockService = service;
    console.log('✅ WorkingAlertService: Stock service connected');
    // Start monitoring immediately when stock service is available
    this.startMonitoring();
  }

  parseAlertCommand(text) {
    console.log(`🔍 WorkingAlertService: Parsing "${text}"`);
    
    const parts = text.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const [command, symbol, priceStr] = parts;
    if (!command.toLowerCase().includes('alert')) return null;

    const cleanPrice = priceStr.replace(/[$,]/g, '');
    const targetPrice = parseFloat(cleanPrice);

    if (isNaN(targetPrice) || targetPrice <= 0) return null;

    console.log(`✅ WorkingAlertService: Parsed ${symbol} @ $${targetPrice}`);
    return { symbol: symbol.toUpperCase(), targetPrice: targetPrice };
  }

  async addAlert(alertText, chatId, userId = 'unknown', userName = 'User') {
    try {
      console.log(`🚨 WorkingAlertService: Processing "${alertText}"`);

      if (!this.stockService) {
        return {
          success: false,
          message: '❌ Alert service not available - Stock service not connected'
        };
      }

      const parsed = this.parseAlertCommand(alertText);
      if (!parsed) {
        return {
          success: false,
          message: '❌ Invalid alert format. Use: !alert SYMBOL $price\n\nExamples:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000'
        };
      }

      const { symbol, targetPrice } = parsed;

      // Get current price to determine direction
      let currentPrice;
      let assetType = 'stock';
      try {
        // Try as stock first
        try {
          const stockData = await this.stockService.getStockPrice(symbol);
          currentPrice = stockData.price;
          assetType = 'stock';
        } catch {
          // Try as crypto if stock fails
          const cryptoData = await this.stockService.getCryptoPrice(symbol.toLowerCase());
          currentPrice = cryptoData.price;
          assetType = 'crypto';
        }
      } catch (priceError) {
        return {
          success: false,
          message: `❌ Could not get current price for ${symbol}: ${priceError.message}`
        };
      }

      // Determine alert direction
      let direction = 'exact';
      if (targetPrice > currentPrice) {
        direction = 'up';
      } else if (targetPrice < currentPrice) {
        direction = 'down';
      }

      const alertId = `${symbol}_${targetPrice}_${Date.now()}`;
      
      const alert = {
        id: alertId,
        chatId: chatId,
        symbol: symbol,
        targetPrice: targetPrice,
        currentPrice: currentPrice,
        direction: direction,
        assetType: assetType,
        userId: userId,
        userName: userName,
        createdAt: new Date(),
        isActive: true
      };

      if (!this.activeAlerts.has(chatId)) {
        this.activeAlerts.set(chatId, new Map());
      }
      this.activeAlerts.get(chatId).set(alertId, alert);

      console.log(`✅ WorkingAlertService: Alert created for ${symbol} @ $${targetPrice} (${direction}) - Current: $${currentPrice}`);

      // Start monitoring if not already running
      this.startMonitoring();

      const directionEmoji = direction === 'up' ? '📈⬆️' : direction === 'down' ? '📉⬇️' : '🎯';
      const directionText = direction === 'up' ? 
        `Alert when price rises to $${targetPrice.toLocaleString()}` :
        direction === 'down' ? 
        `Alert when price drops to $${targetPrice.toLocaleString()}` :
        `Target price already reached!`;

      return {
        success: true,
        message: `🚨 *PRICE ALERT CREATED!* ✅\n\n${assetType === 'crypto' ? '🪙' : '📈'} *${symbol}* (${assetType.toUpperCase()})\n💰 *Current Price:* $${currentPrice.toLocaleString()}\n🎯 *Target Price:* $${targetPrice.toLocaleString()}\n\n${directionEmoji} ${directionText}\n\n🔍 *LIVE MONITORING ACTIVE*\n📱 You'll be notified when target is reached\n⏰ Check interval: ${this.checkIntervalMs / 1000} seconds\n\n🤖 *Powered by Fentrix.Ai*`
      };

    } catch (error) {
      console.error('❌ WorkingAlertService: Alert creation failed:', error.message);
      return {
        success: false,
        message: `❌ Failed to create alert: ${error.message}`
      };
    }
  }

  startMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 WorkingAlertService: Already monitoring...');
      return;
    }

    if (!this.stockService) {
      console.log('⚠️ WorkingAlertService: Cannot start monitoring - no stock service');
      return;
    }

    console.log('🎯 WorkingAlertService: STARTING LIVE PRICE MONITORING...');
    console.log(`📊 Check interval: ${this.checkIntervalMs / 1000} seconds`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllAlerts();
    }, this.checkIntervalMs);

    // Initial check after 5 seconds
    setTimeout(() => this.checkAllAlerts(), 5000);
  }

  async checkAllAlerts() {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`\n🔍 [${currentTime}] WorkingAlertService: CHECKING ALL ALERTS...`);

    const allAlerts = this.getActiveAlerts();
    
    if (allAlerts.length === 0) {
      console.log('📭 WorkingAlertService: No active alerts to check');
      return;
    }

    console.log(`🚨 WorkingAlertService: Checking ${allAlerts.length} active alerts...`);

    for (const alert of allAlerts) {
      try {
        console.log(`\n📊 Checking alert: ${alert.symbol} target $${alert.targetPrice} [${alert.direction.toUpperCase()}]`);
        
        // Get current price
        let currentPrice;
        try {
          if (alert.assetType === 'crypto') {
            const cryptoData = await this.stockService.getCryptoPrice(alert.symbol.toLowerCase());
            currentPrice = cryptoData.price;
          } else {
            const stockData = await this.stockService.getStockPrice(alert.symbol);
            currentPrice = stockData.price;
          }
        } catch (priceError) {
          console.log(`⚠️ Failed to get price for ${alert.symbol}: ${priceError.message}`);
          continue;
        }

        console.log(`💰 Current price: $${currentPrice} | Target: $${alert.targetPrice}`);

        // Check if alert should trigger
        let shouldTrigger = false;
        if (alert.direction === 'up' && currentPrice >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.direction === 'down' && currentPrice <= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.direction === 'exact') {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          console.log(`🚨🚨 ALERT TRIGGERED! ${alert.symbol} hit $${currentPrice} (target: $${alert.targetPrice}) 🚨🚨`);
          await this.sendAlertNotification(alert, currentPrice);
          this.removeAlert(alert.chatId, alert.id);
          console.log(`✅ Alert notification sent and removed for ${alert.symbol}`);
        } else {
          const diff = alert.direction === 'up' 
            ? (alert.targetPrice - currentPrice).toFixed(2)
            : (currentPrice - alert.targetPrice).toFixed(2);
          console.log(`⏳ Still waiting... ${alert.symbol} needs $${diff} more to ${alert.direction === 'up' ? 'rise' : 'drop'}`);
        }

      } catch (error) {
        console.log(`❌ Error checking alert for ${alert.symbol}: ${error.message}`);
      }
    }

    console.log(`✅ WorkingAlertService: Alert check complete - next check in ${this.checkIntervalMs / 1000} seconds`);
  }

  async sendAlertNotification(alert, currentPrice) {
    if (!this.botClient) {
      console.log('❌ WorkingAlertService: No bot client available for notifications');
      return;
    }

    try {
      const chat = await this.botClient.getChatById(alert.chatId);
      
      const assetEmoji = alert.assetType === 'crypto' ? '🪙' : '📈';
      const directionEmoji = alert.direction === 'up' ? '📈⬆️' : '📉⬇️';
      const changePercent = ((currentPrice - alert.currentPrice) / alert.currentPrice * 100).toFixed(2);
      
      const alertMessage = `🚨🚨 *PRICE ALERT TRIGGERED!* 🚨🚨

${assetEmoji} *${alert.symbol}* (${alert.assetType.toUpperCase()}) has hit your target!

🎯 *Target Price:* $${alert.targetPrice.toLocaleString()}
💰 *Current Price:* $${currentPrice.toLocaleString()}
📊 *Change from Alert:* ${changePercent > 0 ? '+' : ''}${changePercent}%

${directionEmoji} *Direction:* ${alert.direction.toUpperCase()}
👤 *Alert by:* ${alert.userName}
⏰ *Triggered:* ${new Date().toLocaleString()}

💡 *Consider your trading strategy!*
The ${alert.assetType} has reached your target level.

🤖 *Powered by Fentrix.Ai*`;

      await chat.sendMessage(alertMessage);
      console.log(`✅ WorkingAlertService: Alert notification sent to chat ${alert.chatId}`);

    } catch (error) {
      console.log(`❌ WorkingAlertService: Failed to send notification:`, error.message);
    }
  }

  getChatAlerts(chatId) {
    const chatAlerts = this.activeAlerts.get(chatId);
    if (!chatAlerts) return [];
    return Array.from(chatAlerts.values()).filter(alert => alert.isActive);
  }

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

  removeAlert(chatId, alertId) {
    const chatAlerts = this.activeAlerts.get(chatId);
    if (!chatAlerts) return false;

    const alert = chatAlerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      chatAlerts.delete(alertId);
      console.log(`🗑️ WorkingAlertService: Alert removed: ${alert.symbol} @ $${alert.targetPrice}`);
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.getActiveAlerts().length,
      stockServiceAvailable: !!this.stockService,
      botClientConnected: !!this.botClient,
      checkInterval: this.checkIntervalMs,
      service: 'WorkingAlertService'
    };
  }

  formatAlertsDisplay(chatId) {
    const alerts = this.getChatAlerts(chatId);
    
    if (alerts.length === 0) {
      return '📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n❌ No active alerts in this chat\n\n💡 Set an alert with:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000\n🚨 !alert TSLA $200.00\n\n🔍 Live monitoring active (30s intervals)\n🤖 Powered by Fentrix.Ai';
    }

    let message = `📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n`;
    
    // Separate stocks and crypto for better display
    const stockAlerts = alerts.filter(alert => alert.assetType === 'stock');
    const cryptoAlerts = alerts.filter(alert => alert.assetType === 'crypto');

    if (stockAlerts.length > 0) {
      message += `📈 *STOCKS (${stockAlerts.length}):*\n`;
      stockAlerts.forEach((alert, index) => {
        const timeAgo = this.getTimeAgo(alert.createdAt);
        const directionEmoji = alert.direction === 'up' ? '⬆️' : alert.direction === 'down' ? '⬇️' : '🎯';
        message += `${index + 1}. 📊 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
        message += `   👤 By: ${alert.userName} | ⏰ ${timeAgo}\n`;
        message += `   💰 Current: $${alert.currentPrice.toLocaleString()} | Direction: ${alert.direction.toUpperCase()}\n\n`;
      });
    }

    if (cryptoAlerts.length > 0) {
      message += `🪙 *CRYPTO (${cryptoAlerts.length}):*\n`;
      cryptoAlerts.forEach((alert, index) => {
        const timeAgo = this.getTimeAgo(alert.createdAt);
        const directionEmoji = alert.direction === 'up' ? '⬆️' : alert.direction === 'down' ? '⬇️' : '🎯';
        message += `${index + 1}. 🪙 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
        message += `   👤 By: ${alert.userName} | ⏰ ${timeAgo}\n`;
        message += `   💰 Current: $${alert.currentPrice.toLocaleString()} | Direction: ${alert.direction.toUpperCase()}\n\n`;
      });
    }
    
    message += `🔍 *LIVE monitoring active* (${this.checkIntervalMs / 1000}s intervals)\n`;
    message += `📊 Real-time price checking in progress\n`;
    message += '🤖 *Powered by Fentrix.Ai*';
    
    return message;
  }

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
}

console.log('🚀 WorkingAlertService: Creating working alert service instance...');
const workingAlertService = new WorkingAlertService();
console.log('✅ WorkingAlertService: Instance created successfully with real monitoring');

module.exports = workingAlertService; 
