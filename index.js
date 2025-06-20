const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

console.log('🚀 FENTRIX STOCK BOT - CLOUD DEPLOYMENT');
console.log('📈 Real-time stock/crypto prices + Professional AI analysis');
console.log('🚨 Live price monitoring + Smart alerts system');
console.log('👥 Group mode: Anyone can use all commands!');
console.log('🌐 Powered by Fentrix.Ai');

// Environment configuration for production
const config = require('./config');

// Import services with enhanced sentiment analysis and alerts
const stockService = require('./services/stockService');
const enhancedSentimentService = require('./services/enhancedSentimentService');
const alertService = require('./services/alertService');

// Create Express app for health checks
const app = express();
const PORT = config.PORT || 3000;

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    bot: config.BOT_NAME,
    version: config.BOT_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    alerts: {
      active: alertService.getAllAlerts().length,
      monitoring: alertService.isMonitoring
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    bot: config.BOT_NAME,
    description: config.BOT_DESCRIPTION,
    version: config.BOT_VERSION,
    author: config.BOT_AUTHOR,
    status: 'running',
    uptime: process.uptime(),
    features: {
      stockPrices: true,
      cryptoPrices: true,
      sentimentAnalysis: config.ENABLE_SENTIMENT_ANALYSIS,
      priceAlerts: config.ENABLE_PRICE_ALERTS,
      liveMonitoring: true
    }
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: config.SESSION_PATH
  }),
  puppeteer: {
    headless: config.PUPPETEER_HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

let botResponses = new Set(); // Track bot responses to avoid loops

client.on('qr', (qr) => {
  console.log('\n📱 SCAN QR CODE TO CONNECT BOT ACCOUNT:');
  qrcode.generate(qr, { small: true });
  console.log('\n🔗 Or visit: https://web.whatsapp.com and scan the code above');
  console.log('📋 Use your DEDICATED BOT WHATSAPP ACCOUNT to scan this code');
});

client.on('authenticated', () => {
  console.log('✅ BOT AUTHENTICATED SUCCESSFULLY!');
});

client.on('ready', () => {
  console.log('🎉 FENTRIX STOCK BOT IS LIVE ON RAILWAY!');
  console.log('📈 Real stock/crypto data: ✅');
  console.log('🌐 Professional sentiment analysis: ✅');
  console.log('📰 Real-time news integration: ✅');
  console.log('📊 Fear & Greed Index: ✅');
  console.log('🎨 Clean professional responses: ✅');
  console.log('🚨 Price alerts + monitoring (stocks & crypto): ✅');
  console.log('📊 LIVE price monitoring every 15 seconds: ✅');
  console.log('🔄 Continuous background monitoring: ✅');
  console.log('👥 Group mode: ✅ Everyone can use commands!');
  console.log('🤖 Powered by Fentrix.Ai: ✅');
  console.log('🚀 ALL FEATURES OPERATIONAL - BOT IS LIVE!\n');
  
  // Set the bot client for alert service notifications
  alertService.setBotClient(client);
});

client.on('disconnected', (reason) => {
  console.log('❌ Bot disconnected:', reason);
  console.log('🔄 Attempting to reconnect...');
});

// Listen for ALL messages from EVERYONE
client.on('message_create', async (msg) => {
  console.log('\n📝 MESSAGE DETECTED:');
  console.log(`📄 Body: "${msg.body}"`);
  console.log(`📱 From me: ${msg.fromMe}`);
  console.log(`👤 From: ${msg.from}`);
  
  // Skip if this is a bot response (to avoid loops)
  if (botResponses.has(msg.id._serialized)) {
    console.log('🔄 Bot response, skipping...');
    return;
  }
  
  // Process commands from ANYONE (not just you)
  if (msg.type === 'chat') {
    const text = msg.body.toLowerCase().trim();
    
    // Only process messages that start with ! (commands)
    if (text.startsWith('!')) {
      console.log('✅ COMMAND DETECTED FROM ANYONE!');
      console.log(`🔍 Processing command: "${text}"`);
      
      // Test command
      if (text.includes('!test')) {
        console.log('🎯 TEST COMMAND');
        await sendBotResponse(msg, '🎉 *FENTRIX STOCK BOT OPERATIONAL!* 🚀\n\n📈 Real stock/crypto prices: ✅\n🌐 Professional sentiment analysis: ✅\n📰 Real-time news integration: ✅\n📊 Fear & Greed Index: ✅\n🎨 Clean professional responses: ✅\n🚨 Price alerts + LIVE monitoring (15s): ✅\n📊 Continuous background monitoring: ✅\n👥 Group mode: Everyone can use commands ✅\n🤖 Powered by Fentrix.Ai: ✅\n\n🔥 *ALL FEATURES OPERATIONAL!*\n\nTry: !stock AAPL or !alert bitcoin $45000');
      }
      
      // Price Alert Commands
      else if (text.startsWith('!alert ')) {
        console.log('🚨 PRICE ALERT COMMAND DETECTED');
        
        try {
          const parsed = alertService.parseAlertCommand(msg.body);
          
          if (!parsed) {
            await sendBotResponse(msg, '❌ Invalid alert format!\n\n📝 *Correct format:* !alert SYMBOL $price\n\n📈 *Stock Examples:*\n• !alert AAPL $187.50\n• !alert TSLA $200.00\n• !alert GOOGL $150.75\n\n🪙 *Crypto Examples:*\n• !alert bitcoin $45000\n• !alert ethereum $2500\n• !alert dogecoin $0.50\n\n💡 *Note:* Commas in prices are supported (e.g., $104,600)\n\n🤖 Powered by Fentrix.Ai');
            return;
          }
          
          const { symbol, targetPrice } = parsed;
          
          // Determine if it's crypto or stock
          const isLikelyCrypto = alertService.isCryptoSymbol(symbol);
          const assetType = isLikelyCrypto ? 'crypto' : 'stock';
          const assetEmoji = isLikelyCrypto ? '🪙' : '📈';
          
          // Show loading message
          await sendBotResponse(msg, `🔄 Setting up ${assetType} price alert...\n📊 Getting current ${symbol} price...\n🚨 Creating monitoring alert...\nPlease wait...`);
          
          // Get current price to show comparison
          try {
            let priceData;
            if (isLikelyCrypto) {
              priceData = await stockService.getCryptoPrice(symbol.toLowerCase());
            } else {
              // Try stock first, fallback to crypto if needed
              try {
                priceData = await stockService.getStockPrice(symbol);
              } catch (stockError) {
                console.log(`Stock fetch failed, trying crypto for ${symbol}`);
                priceData = await stockService.getCryptoPrice(symbol.toLowerCase());
              }
            }
            
            const currentPrice = priceData.price;
            
            // Get user info
            const contact = await msg.getContact();
            const userName = contact.pushname || contact.name || 'Unknown User';
            const chat = await msg.getChat();
            
            // Add the alert
            const alert = alertService.addAlert(
              chat.id._serialized,
              symbol,
              targetPrice,
              msg.from,
              userName,
              currentPrice  // Pass current price for direction calculation
            );
            
            // Calculate difference
            const priceDiff = currentPrice - targetPrice;
            const diffPercent = ((priceDiff / currentPrice) * 100);
            
            let comparisonEmoji = '📊';
            let comparisonText = '';
            
            if (currentPrice > targetPrice) {
              comparisonEmoji = '📉';
              comparisonText = `Price needs to drop $${priceDiff.toFixed(2)} (${Math.abs(diffPercent).toFixed(2)}%)`;
            } else if (currentPrice < targetPrice) {
              comparisonEmoji = '📈';
              comparisonText = `Price needs to rise $${Math.abs(priceDiff).toFixed(2)} (${diffPercent.toFixed(2)}%)`;
            } else {
              comparisonEmoji = '🎯';
              comparisonText = 'Target price already reached!';
            }
            
            const alertMessage = `🚨 *${assetType.toUpperCase()} ALERT CREATED!* ✅

${assetEmoji} *Asset:* ${symbol} (${assetType.toUpperCase()})
💰 *Current Price:* $${currentPrice.toLocaleString()}
🎯 *Target Price:* $${targetPrice.toLocaleString()}
${comparisonEmoji} *Status:* ${comparisonText}

👤 *Created by:* ${userName}
⏰ *Created:* ${new Date().toLocaleString()}

🔍 *LIVE MONITORING:* Every 15 seconds with real-time price checks
📢 *Notification:* When ${symbol} hits $${targetPrice.toLocaleString()}
🚀 *Direction:* ${alert.alertDirection.toUpperCase()} alert (${alert.alertDirection === 'up' ? 'waiting for price to rise' : 'waiting for price to drop'})

💡 The group will be notified when the target price is reached!
📊 Live prices are being monitored continuously in the background!

🤖 *Powered by Fentrix.Ai*`;

            await sendBotResponse(msg, alertMessage);
            console.log(`✅ ${assetType} alert created successfully for ${symbol} @ $${targetPrice}`);
            
          } catch (priceError) {
            console.log(`❌ Could not get current price for ${symbol}:`, priceError.message);
            await sendBotResponse(msg, `❌ Could not fetch current price for ${symbol}\n\nError: ${priceError.message}\n\n💡 Please check the symbol and try again\n\n📈 Stock examples: AAPL, TSLA, GOOGL\n🪙 Crypto examples: bitcoin, ethereum, dogecoin`);
          }
          
        } catch (error) {
          console.log(`❌ Alert creation failed:`, error.message);
          await sendBotResponse(msg, `❌ Failed to create alert\n\nError: ${error.message}\n\n💡 Examples:\n📈 !alert AAPL $187.50\n🪙 !alert bitcoin $45000`);
        }
      }
      
      // List active alerts
      else if (text.includes('!alerts') || text.includes('!list')) {
        console.log('📋 LIST ALERTS COMMAND');
        
        try {
          const chat = await msg.getChat();
          const alertsList = alertService.formatAlertsDisplay(chat.id._serialized);
          await sendBotResponse(msg, alertsList);
          console.log('✅ Alert list displayed');
        } catch (error) {
          console.log(`❌ Could not list alerts:`, error.message);
          await sendBotResponse(msg, '❌ Could not retrieve alerts list\n\n🤖 Powered by Fentrix.Ai');
        }
      }
      
      // Stock commands
      else if (text.startsWith('!stock ') || text.startsWith('!s ')) {
        const symbol = text.replace('!stock ', '').replace('!s ', '').toUpperCase().trim();
        console.log(`📈 FETCHING STOCK: ${symbol}`);
        
        try {
          await sendBotResponse(msg, `🔄 Fetching ${symbol} stock data...\n📊 Getting real-time prices...\nPlease wait...`);
          
          const stockData = await stockService.getStockPrice(symbol);
          const formattedPrice = stockService.formatPriceDisplay(stockData, 'stock');
          
          console.log(`✅ Stock data retrieved for ${symbol}`);
          await sendBotResponse(msg, formattedPrice);
          
          // Auto-sentiment for significant changes
          if (Math.abs(stockData.changePercent) > 2) {
            console.log(`🧠 Auto-sentiment triggered for ${symbol} (${stockData.changePercent}% change)`);
            await sendBotResponse(msg, '🌐 Analyzing market sentiment with professional AI...\n📰 Fetching latest news...\n📊 Getting Fear & Greed Index...\nPlease wait...');
            
            try {
              const sentiment = await enhancedSentimentService.getEnhancedMarketSentiment(symbol, stockData);
              const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(sentiment);
              await sendBotResponse(msg, formattedSentiment);
              console.log('✅ ENHANCED SENTIMENT ANALYSIS SUCCESSFUL!');
            } catch (sentimentError) {
              console.log('❌ Enhanced sentiment analysis failed:', sentimentError.message);
              await sendBotResponse(msg, `⚠️ Sentiment analysis temporarily unavailable: ${sentimentError.message}`);
            }
          }
          
        } catch (error) {
          console.log(`❌ Stock fetch failed: ${error.message}`);
          await sendBotResponse(msg, `❌ Could not fetch stock data for ${symbol}\n\nError: ${error.message}\n\n💡 Try: AAPL, GOOGL, TSLA, MSFT`);
        }
      }
      
      // Crypto commands  
      else if (text.startsWith('!crypto ') || text.startsWith('!c ')) {
        const coin = text.replace('!crypto ', '').replace('!c ', '').toLowerCase().trim();
        console.log(`🪙 FETCHING CRYPTO: ${coin}`);
        
        try {
          await sendBotResponse(msg, `🔄 Fetching ${coin} crypto data...\n📊 Getting real-time prices...\nPlease wait...`);
          
          const cryptoData = await stockService.getCryptoPrice(coin);
          const formattedPrice = stockService.formatPriceDisplay(cryptoData, 'crypto');
          
          console.log(`✅ Crypto data retrieved for ${coin}`);
          await sendBotResponse(msg, formattedPrice);
          
          // Auto-sentiment for significant changes
          if (Math.abs(cryptoData.change24h) > 5) {
            console.log(`🧠 Auto-sentiment triggered for ${coin} (${cryptoData.change24h}% change)`);
            await sendBotResponse(msg, '🌐 Analyzing crypto sentiment with professional AI...\n📰 Fetching latest crypto news...\n📊 Getting Fear & Greed Index...\nPlease wait...');
            
            try {
              const sentiment = await enhancedSentimentService.getEnhancedMarketSentiment(coin.toUpperCase(), cryptoData);
              const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(sentiment);
              await sendBotResponse(msg, formattedSentiment);
              console.log('✅ ENHANCED CRYPTO SENTIMENT ANALYSIS SUCCESSFUL!');
            } catch (sentimentError) {
              console.log('❌ Enhanced sentiment analysis failed:', sentimentError.message);
              await sendBotResponse(msg, `⚠️ Sentiment analysis temporarily unavailable: ${sentimentError.message}`);
            }
          }
          
        } catch (error) {
          console.log(`❌ Crypto fetch failed: ${error.message}`);
          await sendBotResponse(msg, `❌ Could not fetch crypto data for ${coin}\n\nError: ${error.message}\n\n💡 Try: bitcoin, ethereum, dogecoin, solana`);
        }
      }
      
      // Enhanced sentiment commands
      else if (text.includes('!sentiment') || text.includes('!feeling')) {
        console.log('🧠 ENHANCED SENTIMENT ANALYSIS REQUEST');
        
        // Check if specific symbol requested
        const parts = text.split(' ');
        let symbol = null;
        if (parts.length > 1) {
          symbol = parts[1].toUpperCase();
        }
        
        try {
          await sendBotResponse(msg, '🌐 Analyzing market sentiment with professional AI...\n📰 Fetching latest news...\n📊 Getting Fear & Greed Index...\n🤖 Fentrix.Ai processing...\nPlease wait...');
          
          if (symbol) {
            // Get enhanced sentiment for specific symbol
            try {
              // First get price data
              let priceData;
              try {
                priceData = await stockService.getStockPrice(symbol);
              } catch {
                priceData = await stockService.getCryptoPrice(symbol.toLowerCase());
              }
              
              const sentiment = await enhancedSentimentService.getEnhancedMarketSentiment(symbol, priceData);
              const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(sentiment);
              await sendBotResponse(msg, formattedSentiment);
              console.log(`✅ ENHANCED SYMBOL-SPECIFIC SENTIMENT SUCCESSFUL: ${symbol}`);
            } catch (error) {
              console.log(`❌ Symbol-specific sentiment failed: ${error.message}`);
              await sendBotResponse(msg, `❌ Could not analyze sentiment for ${symbol}\n\nError: ${error.message}\n\nTrying general market sentiment...`);
              
              // Fall back to general sentiment
              try {
                const generalSentiment = await enhancedSentimentService.getEnhancedGeneralSentiment();
                const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(generalSentiment);
                await sendBotResponse(msg, formattedSentiment);
                console.log('✅ ENHANCED GENERAL SENTIMENT FALLBACK SUCCESSFUL!');
              } catch (fallbackError) {
                await sendBotResponse(msg, `❌ Sentiment analysis temporarily unavailable\n\nError: ${fallbackError.message}`);
              }
            }
          } else {
            // General market sentiment with enhanced analysis
            const sentiment = await enhancedSentimentService.getEnhancedGeneralSentiment();
            const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(sentiment);
            await sendBotResponse(msg, formattedSentiment);
            console.log('✅ ENHANCED GENERAL SENTIMENT ANALYSIS SUCCESSFUL!');
          }
          
        } catch (error) {
          console.log(`❌ Enhanced sentiment analysis failed: ${error.message}`);
          await sendBotResponse(msg, `❌ Sentiment analysis temporarily unavailable\n\nError: ${error.message}\n\n🔧 Please try again in a moment`);
        }
      }
      
      // Help command
      else if (text.includes('!help')) {
        console.log('❓ HELP COMMAND');
        const helpText = `🤖 *FENTRIX STOCK BOT* 🚀

👥 *EVERYONE CAN USE THESE COMMANDS:*

📊 *STOCK COMMANDS:*
• !stock AAPL - Get Apple stock price + auto-sentiment
• !s TSLA - Get Tesla stock (short command)

🪙 *CRYPTO COMMANDS:*
• !crypto bitcoin - Get Bitcoin price + auto-sentiment
• !c ethereum - Get Ethereum (short command)

🚨 *PRICE ALERT COMMANDS (STOCKS & CRYPTO):*
• !alert AAPL $187.50 - Set stock alert with LIVE monitoring
• !alert TSLA $200.00 - Set stock alert for Tesla at $200.00
• !alert bitcoin $45000 - Set crypto alert with LIVE monitoring
• !alert ethereum $2500 - Set crypto alert for Ethereum at $2,500
• !alert dogecoin $0.50 - Set crypto alert for Dogecoin at $0.50
• !alerts - List all active alerts in this chat
• !list - Show current monitoring status

🧠 *PROFESSIONAL SENTIMENT COMMANDS:*
• !sentiment - General market sentiment with web data
• !sentiment AAPL - Professional sentiment for specific stock
• !feeling bitcoin - Professional crypto sentiment

❓ *OTHER COMMANDS:*
• !help - Show this help
• !test - Test bot functionality

🔥 *ENHANCED FEATURES:*
✅ Real-time stock/crypto prices
✅ Professional sentiment analysis
✅ Real-time news integration
✅ Fear & Greed Index from web
✅ Clean professional responses
✅ Price alerts with LIVE monitoring (every 15s)
✅ Continuous background price checking
✅ Group notifications when targets hit
✅ Smart stock/crypto detection
✅ Group mode - anyone can use
✅ Auto-sentiment for big moves (>2% stocks, >5% crypto)
✅ 24/7 cloud hosting on Railway
✅ Powered by Fentrix.Ai

💡 *ALERT EXAMPLES:*
📈 !alert AAPL $187.50
🪙 !alert bitcoin $45000
📈 !alert GOOGL $150.00
🪙 !alert ethereum $2500
!alerts

👥 Anyone in this group can use ALL enhanced commands!
🚨 Set alerts for stocks AND crypto - get notified when targets are hit!
🤖 Powered by Fentrix.Ai - Professional market analysis!`;

        await sendBotResponse(msg, helpText);
      }
      
      // Unknown command
      else {
        console.log('❓ Unknown command');
        await sendBotResponse(msg, `❓ Unknown command: "${text}"\n\n📝 Type !help to see available commands\n\n💡 Examples:\n📈 !stock AAPL\n🪙 !crypto bitcoin\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000\n\n🤖 Powered by Fentrix.Ai`);
      }
    } else {
      // Regular message (not a command)
      console.log('📝 Regular message (not a command)');
    }
  } else {
    console.log('📱 Non-chat message type');
  }
});

// Function to send bot responses
async function sendBotResponse(originalMsg, responseText) {
  try {
    console.log('🤖 SENDING RESPONSE...');
    
    // Send response to the same chat
    const chat = await originalMsg.getChat();
    const sentMsg = await chat.sendMessage(responseText);
    
    // Track this as a bot response to avoid processing it again
    botResponses.add(sentMsg.id._serialized);
    
    console.log('✅ RESPONSE SENT!');
    console.log(`📤 Response: "${responseText.substring(0, 50)}..."`);
    
    // Clean up old response IDs after 1 minute
    setTimeout(() => {
      botResponses.delete(sentMsg.id._serialized);
    }, 60000);
    
  } catch (error) {
    console.log('❌ Response failed:', error.message);
  }
}

// Graceful shutdown handling for cloud deployment
process.on('SIGINT', () => {
  console.log('📴 Shutting down bot gracefully...');
  client.destroy();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  server.close();
  process.exit(0);
});

// Initialize
console.log('🚀 Starting Fentrix Stock Bot...');
client.initialize();

console.log('\n📋 FENTRIX STOCK BOT - RAILWAY CLOUD DEPLOYMENT');
console.log('🌐 Ready for 24/7 cloud hosting');
console.log('📱 Scan QR code with your dedicated bot WhatsApp account');
console.log('🤖 Professional market analysis bot powered by Fentrix.Ai');
console.log('🚀 ALL FEATURES OPERATIONAL!\n'); 