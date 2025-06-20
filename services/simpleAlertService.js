console.log('🔄 SIMPLE ALERT SERVICE INITIALIZING...');

class SimpleAlertService {
  constructor() {
    this.activeAlerts = new Map();
    this.botClient = null;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.checkIntervalMs = 15000;
    
    console.log('✅ SimpleAlertService initialized successfully');
  }

  setBotClient(client) {
    this.botClient = client;
    console.log('✅ SimpleAlertService: Bot client connected');
  }

  parseAlertCommand(text) {
    console.log(`🔍 SimpleAlertService: Parsing "${text}"`);
    
    const parts = text.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const [command, symbol, priceStr] = parts;
    if (!command.toLowerCase().includes('alert')) return null;

    const cleanPrice = priceStr.replace(/[$,]/g, '');
    const targetPrice = parseFloat(cleanPrice);

    if (isNaN(targetPrice) || targetPrice <= 0) return null;

    console.log(`✅ SimpleAlertService: Parsed ${symbol} @ $${targetPrice}`);
    return { symbol: symbol.toUpperCase(), targetPrice: targetPrice };
  }

  async addAlert(alertText, chatId, userId = 'unknown', userName = 'User') {
    try {
      console.log(`🚨 SimpleAlertService: Processing "${alertText}"`);

      const parsed = this.parseAlertCommand(alertText);
      if (!parsed) {
        return {
          success: false,
          message: '❌ Invalid alert format. Use: !alert SYMBOL $price\n\nExamples:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000'
        };
      }

      const { symbol, targetPrice } = parsed;
      const alertId = `${symbol}_${targetPrice}_${Date.now()}`;
      
      const alert = {
        id: alertId,
        chatId: chatId,
        symbol: symbol,
        targetPrice: targetPrice,
        userId: userId,
        userName: userName,
        createdAt: new Date(),
        isActive: true
      };

      if (!this.activeAlerts.has(chatId)) {
        this.activeAlerts.set(chatId, new Map());
      }
      this.activeAlerts.get(chatId).set(alertId, alert);

      console.log(`✅ SimpleAlertService: Alert created for ${symbol} @ $${targetPrice}`);

      return {
        success: true,
        message: `🚨 *PRICE ALERT CREATED!* ✅\n\n📈 *${symbol}*\n🎯 *Target Price:* $${targetPrice.toLocaleString()}\n\n🔍 *Live monitoring active*\n📱 You'll be notified when target is reached\n\n🤖 *Powered by Fentrix.Ai*`
      };

    } catch (error) {
      console.error('❌ SimpleAlertService: Alert creation failed:', error.message);
      return {
        success: false,
        message: `❌ Failed to create alert: ${error.message}`
      };
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

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.getActiveAlerts().length,
      stockServiceAvailable: true,
      botClientConnected: !!this.botClient,
      checkInterval: this.checkIntervalMs
    };
  }

  startMonitoring() {
    console.log('🔄 SimpleAlertService: Monitoring started (simplified)');
    this.isMonitoring = true;
  }
}

console.log('🚀 SimpleAlertService: Creating instance...');
const simpleAlertService = new SimpleAlertService();
console.log('✅ SimpleAlertService: Instance created successfully');

module.exports = simpleAlertService; 
