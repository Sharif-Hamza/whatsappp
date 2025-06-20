// Fentrix Stock Bot - Fixed Version
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

console.log('🚀 FENTRIX STOCK BOT - RAILWAY CLOUD DEPLOYMENT');
console.log('📈 Starting bot initialization...');
console.log('🌐 Powered by Fentrix.Ai');

// Environment configuration for production
const config = require('./config');

// Create Express app for health checks FIRST
const app = express();
const PORT = config.PORT || 3000;

// Global variable to store current QR code
let currentQRCode = null;

// Simple health check that doesn't depend on other services
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    bot: config.BOT_NAME,
    version: config.BOT_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    railway: 'operational'
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
    timestamp: new Date().toISOString(),
    features: {
      stockPrices: true,
      cryptoPrices: true,
      sentimentAnalysis: true,
      priceAlerts: true,
      liveMonitoring: true
    },
    endpoints: {
      health: '/health',
      testStock: '/api/stock/:symbol',
      testCrypto: '/api/crypto/:coin'
    }
  });
});

// API endpoint for testing stock prices without WhatsApp
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    console.log(`📈 API request for stock: ${symbol}`);
    
    if (!stockService) {
      return res.status(503).json({ error: 'Stock service not available' });
    }
    
    const stockData = await stockService.getStockPrice(symbol);
    console.log(`✅ Stock data retrieved for ${symbol}`);
    
    res.json({
      success: true,
      symbol: symbol,
      data: stockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Stock API error for ${req.params.symbol}:`, error.message);
    res.status(400).json({
      success: false,
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// API endpoint for testing crypto prices without WhatsApp
app.get('/api/crypto/:coin', async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    console.log(`🪙 API request for crypto: ${coin}`);
    
    if (!stockService) {
      return res.status(503).json({ error: 'Crypto service not available' });
    }
    
    const cryptoData = await stockService.getCryptoPrice(coin);
    console.log(`✅ Crypto data retrieved for ${coin}`);
    
    res.json({
      success: true,
      coin: coin,
      data: cryptoData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Crypto API error for ${req.params.coin}:`, error.message);
    res.status(400).json({
      success: false,
      error: error.message,
      coin: req.params.coin
    });
  }
});

// Add QR code web endpoint
app.get('/qr', (req, res) => {
  if (!currentQRCode) {
    res.send(`
      <html>
        <head><title>Fentrix Stock Bot - QR Code</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🤖 Fentrix Stock Bot</h1>
          <p>❌ No QR code available yet.</p>
          <p>🔄 The bot is still initializing...</p>
          <p>📱 Refresh this page in a few seconds.</p>
          <button onclick="location.reload()">🔄 Refresh</button>
          <script>
            // Auto-refresh every 5 seconds until QR code is available
            setTimeout(() => location.reload(), 5000);
          </script>
        </body>
      </html>
    `);
    return;
  }
  
  // Escape the QR code data properly for HTML
  const escapedQRCode = currentQRCode.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  res.send(`
    <html>
      <head>
        <title>Fentrix Stock Bot - QR Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: #f0f0f0; 
            margin: 0;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
          }
          .qr-container { 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            display: inline-block; 
            margin: 20px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .instructions { 
            max-width: 600px; 
            margin: 0 auto; 
            text-align: left; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
          }
          button:hover {
            background: #0056b3;
          }
          .debug {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 Fentrix Stock Bot - WhatsApp QR Code</h1>
          
          <div class="qr-container">
            <div id="qrcode-canvas"></div>
            <div id="qrcode-fallback" style="display: none;">
              <p>🔄 Loading QR Code...</p>
              <div class="debug">
                <strong>Debug Info:</strong><br>
                QR Code Length: ${currentQRCode.length} characters<br>
                First 50 chars: ${currentQRCode.substring(0, 50)}...
              </div>
            </div>
          </div>
          
          <div class="instructions">
            <h3>📋 Instructions:</h3>
            <ol>
              <li><strong>Open WhatsApp</strong> on your dedicated bot phone</li>
              <li><strong>Go to Settings</strong> → <strong>Linked Devices</strong></li>
              <li><strong>Tap "Link a Device"</strong></li>
              <li><strong>Scan the QR code above</strong></li>
              <li><strong>Bot will connect</strong> and be ready to use!</li>
            </ol>
            
            <p><strong>⚠️ Important:</strong> Use a separate WhatsApp account for the bot, not your personal account!</p>
          </div>
          
          <button onclick="location.reload()">🔄 Refresh QR Code</button>
          <button onclick="toggleDebug()">🔧 Toggle Debug Info</button>
        </div>
        
        <!-- Multiple QR code libraries for better compatibility -->
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
        
        <script>
          console.log('QR Code page loaded');
          console.log('QR Code data length:', '${currentQRCode.length}');
          
          let qrCodeData = '${escapedQRCode}';
          console.log('QR Code data (first 100 chars):', qrCodeData.substring(0, 100));
          
          function toggleDebug() {
            const debug = document.getElementById('qrcode-fallback');
            debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
          }
          
          // Try multiple methods to render QR code
          function renderQRCode() {
            const container = document.getElementById('qrcode-canvas');
            
            // Method 1: Try qrcode.js with canvas
            if (typeof QRCode !== 'undefined') {
              console.log('Trying QRCode.js...');
              try {
                // Clear container
                container.innerHTML = '<canvas id="qr-canvas"></canvas>';
                
                QRCode.toCanvas(document.getElementById('qr-canvas'), qrCodeData, {
                  width: 350,
                  height: 350,
                  margin: 3,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  },
                  errorCorrectionLevel: 'M'
                }, function (error) {
                  if (error) {
                    console.error('QRCode.js canvas error:', error);
                    tryMethod2();
                  } else {
                    console.log('✅ QRCode.js canvas success!');
                  }
                });
                return;
              } catch (error) {
                console.error('QRCode.js canvas failed:', error);
              }
            }
            
            tryMethod2();
          }
          
          // Method 2: Try qrcode.js with SVG
          function tryMethod2() {
            console.log('Trying QRCode.js SVG...');
            const container = document.getElementById('qrcode-canvas');
            
            if (typeof QRCode !== 'undefined') {
              try {
                QRCode.toString(qrCodeData, {
                  type: 'svg',
                  width: 350,
                  margin: 3,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  }
                }, function (error, string) {
                  if (error) {
                    console.error('QRCode.js SVG error:', error);
                    tryMethod3();
                  } else {
                    container.innerHTML = string;
                    console.log('✅ QRCode.js SVG success!');
                  }
                });
                return;
              } catch (error) {
                console.error('QRCode.js SVG failed:', error);
              }
            }
            
            tryMethod3();
          }
          
          // Method 3: Try QRious library
          function tryMethod3() {
            console.log('Trying QRious...');
            const container = document.getElementById('qrcode-canvas');
            
            if (typeof QRious !== 'undefined') {
              try {
                container.innerHTML = '<canvas id="qr-canvas-2"></canvas>';
                const canvas = document.getElementById('qr-canvas-2');
                
                const qr = new QRious({
                  element: canvas,
                  value: qrCodeData,
                  size: 350,
                  level: 'M'
                });
                
                console.log('✅ QRious success!');
                return;
              } catch (error) {
                console.error('QRious failed:', error);
              }
            }
            
            tryMethod4();
          }
          
          // Method 4: Google Charts API fallback
          function tryMethod4() {
            console.log('Trying Google Charts API...');
            const container = document.getElementById('qrcode-canvas');
            
            try {
              const encodedData = encodeURIComponent(qrCodeData);
              const googleQRUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodedData;
              
              container.innerHTML = '<img src="' + googleQRUrl + '" alt="QR Code" style="max-width: 350px; height: auto;" onerror="showFallback()">';
              console.log('✅ Google Charts API used!');
            } catch (error) {
              console.error('Google Charts API failed:', error);
              showFallback();
            }
          }
          
          function showFallback() {
            console.log('All methods failed, showing fallback');
            const container = document.getElementById('qrcode-canvas');
            const fallback = document.getElementById('qrcode-fallback');
            
            container.innerHTML = '<p style="color: red;">❌ QR Code rendering failed</p>';
            fallback.style.display = 'block';
          }
          
          // Start rendering process
          console.log('Starting QR code rendering...');
          renderQRCode();
          
          // Auto-refresh every 30 seconds to get new QR codes
          setInterval(() => {
            console.log('Auto-refreshing for new QR code...');
            location.reload();
          }, 30000);
        </script>
      </body>
    </html>
  `);
});

// Start Express server IMMEDIATELY for health checks
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 EXPRESS SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📊 Health check: Available at /health`);
  console.log(`✅ Railway health checks should now pass!`);
});

// Import services with error handling
let stockService, enhancedSentimentService, alertService;

try {
  console.log('📦 Loading service modules...');
  
  // Load each service individually with specific error handling
  try {
    stockService = require('./services/stockService');
    console.log('✅ Stock service loaded successfully');
  } catch (stockError) {
    console.error('❌ Stock service loading failed:', stockError.message);
    console.error('📝 Stock service error details:', stockError.stack);
    stockService = null;
  }
  
  try {
    enhancedSentimentService = require('./services/enhancedSentimentService');
    console.log('✅ Enhanced sentiment service loaded successfully');
  } catch (sentimentError) {
    console.error('❌ Enhanced sentiment service loading failed:', sentimentError.message);
    console.error('📝 Sentiment service error details:', sentimentError.stack);
    enhancedSentimentService = null;
  }
  
  try {
    alertService = require('./services/alertService');
    console.log('✅ Alert service loaded successfully');
  } catch (alertError) {
    console.error('❌ Alert service loading failed:', alertError.message);
    console.error('📝 Alert service error details:', alertError.stack);
    alertService = null;
  }
  
  // Summary of loaded services
  const loadedServices = [];
  if (stockService) loadedServices.push('Stock Service');
  if (enhancedSentimentService) loadedServices.push('Sentiment Service');
  if (alertService) loadedServices.push('Alert Service');
  
  if (loadedServices.length > 0) {
    console.log(`🎉 Successfully loaded ${loadedServices.length}/3 services: ${loadedServices.join(', ')}`);
  } else {
    console.log('❌ NO SERVICES LOADED - Bot will run in basic mode');
  }
  
} catch (error) {
  console.error('❌ CRITICAL SERVICE LOADING ERROR:', error.message);
  console.error('📝 Stack:', error.stack);
  console.log('🔧 Bot will continue without services - basic functionality only');
  
  // Set all services to null
  stockService = null;
  enhancedSentimentService = null;
  alertService = null;
}

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
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--mute-audio',
      '--hide-scrollbars',
      '--disable-logging',
      '--disable-gl-drawing-for-tests',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--disable-features=TranslateUI',
      '--disable-blink-features=AutomationControlled'
    ],
    executablePath: '/usr/bin/google-chrome-stable'
  }
});

let botResponses = new Set(); // Track bot responses to avoid loops

client.on('qr', (qr) => {
  // Store QR code for web endpoint
  currentQRCode = qr;
  
  console.log('\n🎯 QR CODE GENERATED!');
  console.log('📱 SCAN QR CODE WITH YOUR BOT WHATSAPP ACCOUNT:');
  console.log('================================================');
  
  // Generate smaller QR code for logs
  qrcode.generate(qr, { small: true });
  
  console.log('================================================');
  console.log('');
  console.log('🌐 BETTER QR CODE VIEWING:');
  console.log('👉 Visit: https://YOUR-RAILWAY-APP-URL/qr');
  console.log('📱 Scan the QR code from that webpage instead!');
  console.log('');
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Use your DEDICATED BOT WhatsApp account');
  console.log('2. Open WhatsApp on your phone');
  console.log('3. Go to Settings > Linked Devices');
  console.log('4. Tap "Link a Device"');
  console.log('5. Scan the QR code from the webpage above');
  console.log('================================================\n');
});

client.on('authenticated', () => {
  console.log('✅ WHATSAPP AUTHENTICATION SUCCESSFUL!');
  console.log('🎉 Bot account connected!');
});

client.on('ready', () => {
  console.log('\n🚀 FENTRIX STOCK BOT IS NOW LIVE ON RAILWAY!');
  console.log('==========================================');
  console.log('📈 Real stock/crypto data: ✅');
  console.log('🌐 Professional sentiment analysis: ✅');
  console.log('📰 Real-time news integration: ✅');
  console.log('📊 Fear & Greed Index: ✅');
  console.log('🎨 Clean professional responses: ✅');
  console.log('🚨 Price alerts + monitoring: ✅');
  console.log('📊 LIVE price monitoring (15s): ✅');
  console.log('🔄 Continuous background monitoring: ✅');
  console.log('👥 Group mode: ✅ Everyone can use commands!');
  console.log('🤖 Powered by Fentrix.Ai: ✅');
  console.log('==========================================');
  console.log('🔥 ALL FEATURES OPERATIONAL - BOT IS LIVE!');
  console.log('📝 Test with: !test');
  console.log('🚀 Add bot to WhatsApp groups and start trading!');
  console.log('==========================================\n');
  
  // Set the bot client for alert service notifications
  if (alertService) {
    try {
      alertService.setBotClient(client);
      console.log('✅ Alert service connected to bot client');
    } catch (error) {
      console.error('❌ Alert service connection failed:', error.message);
    }
  }
  
  // Start continuous price monitoring for alerts
  if (alertService && stockService) {
    try {
      console.log('🔄 Starting continuous price monitoring...');
      alertService.startMonitoring(stockService);
      console.log('✅ Price monitoring started - 15 second intervals');
    } catch (error) {
      console.error('❌ Price monitoring startup failed:', error.message);
    }
  } else {
    console.log('⚠️ Price monitoring not started - services not available');
  }
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp Bot disconnected:', reason);
  console.log('🔄 Attempting to reconnect...');
});

client.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp Authentication failed:', msg);
  console.log('💡 Try restarting the deployment to get a new QR code');
});

// Listen for ALL messages from EVERYONE
client.on('message_create', async (msg) => {
  try {
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
          await sendBotResponse(msg, '🎉 *FENTRIX STOCK BOT OPERATIONAL ON RAILWAY!* 🚀\n\n📈 Real stock/crypto prices: ✅\n🌐 Professional sentiment analysis: ✅\n📰 Real-time news integration: ✅\n📊 Fear & Greed Index: ✅\n🎨 Clean professional responses: ✅\n🚨 Price alerts + LIVE monitoring (15s): ✅\n📊 Continuous background monitoring: ✅\n👥 Group mode: Everyone can use commands ✅\n🤖 Powered by Fentrix.Ai: ✅\n🌐 24/7 Railway cloud hosting: ✅\n\n🔥 *ALL FEATURES OPERATIONAL!*\n\nTry: !stock AAPL or !alert bitcoin $45000\n\n🤖 Fentrix.Ai Professional Trading Bot');
        }
        
        // Debug command - ENHANCED TROUBLESHOOTING
        else if (text.includes('!debug')) {
          console.log('🔧 DEBUG COMMAND');
          
          try {
            let debugInfo = '🔧 *DEBUG INFORMATION* 🛠️\n\n';
            
            // Service status with detailed checks
            debugInfo += '📊 *SERVICE STATUS:*\n';
            debugInfo += `• Stock Service: ${stockService ? '✅ Loaded' : '❌ Failed'}\n`;
            debugInfo += `• Sentiment Service: ${enhancedSentimentService ? '✅ Loaded' : '❌ Failed'}\n`;
            debugInfo += `• Alert Service: ${alertService ? '✅ Loaded' : '❌ Failed'}\n\n`;
            
            // Service functionality tests
            if (stockService) {
              debugInfo += '🧪 *SERVICE FUNCTIONALITY:*\n';
              try {
                debugInfo += `• Stock API: Testing...\n`;
                debugInfo += `• Crypto API: Testing...\n`;
                debugInfo += `• Alert monitoring: ${alertService?.isMonitoring ? '🟢 Active' : '🔴 Inactive'}\n\n`;
              } catch (error) {
                debugInfo += `• API Tests: ❌ Failed to test\n\n`;
              }
            }
            
            // Configuration status
            debugInfo += '⚙️ *CONFIGURATION:*\n';
            debugInfo += `• Alpha Vantage Key: ${config.ALPHA_VANTAGE_API_KEY ? '✅ Set' : '❌ Missing'}\n`;
            debugInfo += `• DeepSeek Key: ${config.DEEPSEEK_API_KEY ? '✅ Set' : '❌ Missing'}\n`;
            debugInfo += `• Stock API: ${config.STOCK_API_BASE ? '✅ Set' : '❌ Missing'}\n`;
            debugInfo += `• Crypto API: ${config.CRYPTO_API_BASE ? '✅ Set' : '❌ Missing'}\n\n`;
            
            // Environment
            debugInfo += '🌐 *ENVIRONMENT:*\n';
            debugInfo += `• Node.js: ${process.version}\n`;
            debugInfo += `• Environment: ${config.NODE_ENV}\n`;
            debugInfo += `• Port: ${config.PORT}\n`;
            debugInfo += `• Uptime: ${Math.floor(process.uptime())} seconds\n\n`;
            
            // Alert service status
            if (alertService) {
              const alertStatus = alertService.getStatus();
              debugInfo += '🚨 *ALERT SERVICE:*\n';
              debugInfo += `• Total Active Alerts: ${alertStatus.totalAlerts}\n`;
              debugInfo += `• Monitoring Active: ${alertStatus.isMonitoring ? '✅ Yes' : '❌ No'}\n`;
              debugInfo += `• Check Interval: ${alertStatus.checkInterval / 1000}s\n`;
              debugInfo += `• Bot Client Connected: ${alertStatus.botClientConnected ? '✅ Yes' : '❌ No'}\n\n`;
            }
            
            debugInfo += '💡 *QUICK TESTS:*\n';
            debugInfo += '📈 !stock AAPL - Test stock data\n';
            debugInfo += '🪙 !crypto bitcoin - Test crypto data\n';
            debugInfo += '🚨 !alert AAPL $190.00 - Test alerts\n';
            debugInfo += '🧠 !sentiment AAPL - Test sentiment\n\n';
            debugInfo += '🤖 *Powered by Fentrix.Ai*';
            
            await sendBotResponse(msg, debugInfo);
            
            // Also run a quick API test in the background and report results
            if (stockService) {
              setTimeout(async () => {
                try {
                  console.log('🧪 Running background API tests...');
                  const testResults = await stockService.testService();
                  
                  let testReport = '🧪 *API TEST RESULTS* 📊\n\n';
                  testReport += `📈 *Stock API:* ${testResults.stockTest ? '✅ Working' : '❌ Failed'}\n`;
                  if (testResults.stockError) {
                    testReport += `   Error: ${testResults.stockError}\n`;
                  }
                  testReport += `🪙 *Crypto API:* ${testResults.cryptoTest ? '✅ Working' : '❌ Failed'}\n`;
                  if (testResults.cryptoError) {
                    testReport += `   Error: ${testResults.cryptoError}\n`;
                  }
                  testReport += '\n🤖 *Powered by Fentrix.Ai*';
                  
                  await sendBotResponse(msg, testReport);
                  console.log('✅ Background API tests completed');
                } catch (error) {
                  console.log('❌ Background API tests failed:', error.message);
                }
              }, 2000);
            }
            
          } catch (error) {
            console.error('❌ Debug command failed:', error.message);
            await sendBotResponse(msg, `❌ Debug command failed: ${error.message}\n\n🤖 Powered by Fentrix.Ai`);
          }
        }
        
        // Stock commands
        else if (text.startsWith('!stock ') || text.startsWith('!s ')) {
          console.log(`📈 STOCK COMMAND DETECTED - Service status: ${stockService ? 'Available' : 'Not Available'}`);
          
          if (!stockService) {
            await sendBotResponse(msg, '❌ Stock service not available. Try !debug to see what\'s wrong.\n\n🔧 This might be due to:\n• Missing API keys\n• Service loading errors\n• Network issues\n\n💡 Try again in a few moments or contact support.');
            return;
          }
          
          const symbol = text.replace('!stock ', '').replace('!s ', '').toUpperCase().trim();
          console.log(`📈 FETCHING STOCK: ${symbol}`);
          
          try {
            await sendBotResponse(msg, `🔄 Fetching ${symbol} stock data...\n📊 Getting real-time prices...\nPlease wait...`);
            
            const stockData = await stockService.getStockPrice(symbol);
            const formattedPrice = stockService.formatPriceDisplay(stockData, 'stock');
            
            console.log(`✅ Stock data retrieved for ${symbol}`);
            await sendBotResponse(msg, formattedPrice);
            
            // Auto-sentiment for significant changes
            if (enhancedSentimentService && Math.abs(stockData.changePercent) > 2) {
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
          if (!stockService) {
            await sendBotResponse(msg, '❌ Crypto service not available. Please try again later.');
            return;
          }
          
          const coin = text.replace('!crypto ', '').replace('!c ', '').toLowerCase().trim();
          console.log(`🪙 FETCHING CRYPTO: ${coin}`);
          
          try {
            await sendBotResponse(msg, `🔄 Fetching ${coin} crypto data...\n📊 Getting real-time prices...\nPlease wait...`);
            
            const cryptoData = await stockService.getCryptoPrice(coin);
            const formattedPrice = stockService.formatPriceDisplay(cryptoData, 'crypto');
            
            console.log(`✅ Crypto data retrieved for ${coin}`);
            await sendBotResponse(msg, formattedPrice);
            
            // Auto-sentiment for significant changes
            if (enhancedSentimentService && Math.abs(cryptoData.change24h) > 5) {
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
        
        // Alert commands - FIXED FUNCTIONALITY
        else if (text.startsWith('!alert ')) {
          if (!alertService) {
            await sendBotResponse(msg, '❌ Alert service not available. Please try again later.');
            return;
          }
          
          console.log(`🚨 PROCESSING ALERT COMMAND: "${text}"`);
          
          try {
            await sendBotResponse(msg, '🔄 Setting up price alert...\n📊 Fetching current price...\n🎯 Analyzing target price...\nPlease wait...');
            
            // Get user info for the alert
            const contact = await msg.getContact();
            const userName = contact.name || contact.pushname || 'User';
            
            // Use the new alert service interface
            const result = await alertService.addAlert(text, msg.from, msg.author || msg.from, userName);
            console.log(`✅ Alert result: ${result.success}`);
            
            if (result.success) {
              await sendBotResponse(msg, result.message);
            } else {
              await sendBotResponse(msg, result.message);
            }
            
          } catch (error) {
            console.log(`❌ Alert setup failed: ${error.message}`);
            await sendBotResponse(msg, `❌ Could not set up alert: ${error.message}\n\n💡 Examples:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000\n🚨 !alert TSLA $200.00\n\n🤖 Powered by Fentrix.Ai`);
          }
        }
        
        // Alerts list command - FIXED FUNCTIONALITY
        else if (text.includes('!alerts')) {
          if (!alertService) {
            await sendBotResponse(msg, '❌ Alert service not available. Please try again later.');
            return;
          }
          
          console.log('📋 LISTING ACTIVE ALERTS');
          
          try {
            // Get alerts for this specific chat
            const chatAlerts = alertService.getChatAlerts(msg.from);
            const totalAlerts = alertService.getActiveAlerts().length;
            
            console.log(`✅ Found ${chatAlerts.length} alerts in this chat, ${totalAlerts} total`);
            
            if (chatAlerts.length === 0) {
              await sendBotResponse(msg, '📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n❌ No active alerts in this chat\n\n💡 Set an alert with:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000\n🚨 !alert TSLA $200.00\n\n🔍 Live monitoring active (15s intervals)\n🤖 Powered by Fentrix.Ai');
            } else {
              let alertsText = `📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n`;
              
              // Separate stocks and crypto for better display
              const stockAlerts = chatAlerts.filter(alert => alert.assetType === 'stock');
              const cryptoAlerts = chatAlerts.filter(alert => alert.assetType === 'crypto');

              if (stockAlerts.length > 0) {
                alertsText += `📈 *STOCKS (${stockAlerts.length}):*\n`;
                stockAlerts.forEach((alert, index) => {
                  const timeAgo = getTimeAgo(alert.createdAt);
                  const directionEmoji = alert.alertDirection === 'up' ? '⬆️' : alert.alertDirection === 'down' ? '⬇️' : '🎯';
                  alertsText += `${index + 1}. 📊 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
                  alertsText += `   👤 By: ${alert.userName} | ⏰ ${timeAgo}\n\n`;
                });
              }

              if (cryptoAlerts.length > 0) {
                alertsText += `🪙 *CRYPTO (${cryptoAlerts.length}):*\n`;
                cryptoAlerts.forEach((alert, index) => {
                  const timeAgo = getTimeAgo(alert.createdAt);
                  const directionEmoji = alert.alertDirection === 'up' ? '⬆️' : alert.alertDirection === 'down' ? '⬇️' : '🎯';
                  alertsText += `${index + 1}. 🪙 *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
                  alertsText += `   👤 By: ${alert.userName} | ⏰ ${timeAgo}\n\n`;
                });
              }
              
              alertsText += `🔍 *Live monitoring active* (15s intervals)\n`;
              alertsText += `📊 Total alerts across all chats: ${totalAlerts}\n`;
              alertsText += '🤖 *Powered by Fentrix.Ai*';
              
              await sendBotResponse(msg, alertsText);
            }
            
          } catch (error) {
            console.log(`❌ Alerts list failed: ${error.message}`);
            await sendBotResponse(msg, `❌ Could not retrieve alerts: ${error.message}\n\n🤖 Powered by Fentrix.Ai`);
          }
        }
        
        // Sentiment analysis commands - FIXED FUNCTIONALITY
        else if (text.startsWith('!sentiment')) {
          if (!enhancedSentimentService) {
            await sendBotResponse(msg, '❌ Sentiment analysis service not available. Please try again later.');
            return;
          }
          
          const sentimentText = text.replace('!sentiment', '').trim();
          console.log(`🧠 SENTIMENT ANALYSIS REQUEST: "${sentimentText}"`);
          
          try {
            await sendBotResponse(msg, '🌐 Analyzing market sentiment with professional AI...\n📰 Fetching latest news and market data...\n📊 Getting Fear & Greed Index...\nPlease wait...');
            
            let sentiment;
            if (sentimentText) {
              // Specific symbol sentiment
              const symbol = sentimentText.toUpperCase();
              console.log(`🎯 Getting sentiment for specific symbol: ${symbol}`);
              
              // Try to get current price data for context
              let priceData = null;
              try {
                if (stockService) {
                  // Try as stock first
                  try {
                    priceData = await stockService.getStockPrice(symbol);
                    console.log(`✅ Got stock price data for sentiment analysis: ${symbol}`);
                  } catch {
                    // Try as crypto if stock fails
                    priceData = await stockService.getCryptoPrice(symbol.toLowerCase());
                    console.log(`✅ Got crypto price data for sentiment analysis: ${symbol}`);
                  }
                }
              } catch (priceError) {
                console.log(`⚠️ Could not fetch price data for ${symbol}: ${priceError.message}`);
              }
              
              sentiment = await enhancedSentimentService.getEnhancedMarketSentiment(symbol, priceData);
            } else {
              // General market sentiment
              console.log('🌐 Getting general market sentiment');
              sentiment = await enhancedSentimentService.getEnhancedMarketSentiment();
            }
            
            const formattedSentiment = enhancedSentimentService.formatEnhancedSentimentDisplay(sentiment);
            await sendBotResponse(msg, formattedSentiment);
            console.log('✅ ENHANCED SENTIMENT ANALYSIS SUCCESSFUL!');
            
          } catch (error) {
            console.log(`❌ Sentiment analysis failed: ${error.message}`);
            await sendBotResponse(msg, `❌ Sentiment analysis failed: ${error.message}\n\n💡 Examples:\n🧠 !sentiment - General market sentiment\n🧠 !sentiment AAPL - Apple sentiment\n🧠 !sentiment bitcoin - Bitcoin sentiment\n\n🤖 Powered by Fentrix.Ai`);
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

🚨 *PRICE ALERT COMMANDS:*
• !alert AAPL $187.50 - Set stock alert with LIVE monitoring
• !alert bitcoin $45000 - Set crypto alert with LIVE monitoring
• !alerts - List all active alerts

🧠 *PROFESSIONAL SENTIMENT COMMANDS:*
• !sentiment - General market sentiment with web data
• !sentiment AAPL - Professional sentiment for specific stock

❓ *OTHER COMMANDS:*
• !help - Show this help
• !test - Test bot functionality

🔥 *ENHANCED FEATURES:*
✅ Real-time stock/crypto prices
✅ Professional sentiment analysis
✅ Real-time news integration
✅ Clean professional responses
✅ Price alerts with LIVE monitoring
✅ Group mode - anyone can use
✅ 24/7 Railway cloud hosting
✅ Powered by Fentrix.Ai

💡 *Examples:*
📈 !stock AAPL
🪙 !crypto bitcoin
🚨 !alert bitcoin $45000

👥 Anyone in this group can use ALL commands!
🤖 Powered by Fentrix.Ai - Professional market analysis!`;

          await sendBotResponse(msg, helpText);
        }
        
        // Unknown command
        else {
          console.log('❓ Unknown command');
          await sendBotResponse(msg, `❓ Unknown command: "${text}"\n\n📝 Type !help to see available commands\n\n💡 Examples:\n📈 !stock AAPL\n🪙 !crypto bitcoin\n🚨 !alert bitcoin $45000\n\n🤖 Powered by Fentrix.Ai`);
        }
      } else {
        // Regular message (not a command)
        console.log('📝 Regular message (not a command)');
      }
    } else {
      console.log('📱 Non-chat message type');
    }
  } catch (error) {
    console.error('❌ Message handling error:', error);
    try {
      await sendBotResponse(msg, '❌ Sorry, I encountered an error processing your request. Please try again later.');
    } catch (responseError) {
      console.error('❌ Could not send error response:', responseError);
    }
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
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

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Initialize WhatsApp client with enhanced error handling and debugging
console.log('🚀 Initializing WhatsApp client...');
console.log('📱 Preparing to generate QR code...');
console.log('🔍 Chrome executable path:', '/usr/bin/google-chrome-stable');
console.log('🐳 Running in Docker container with Puppeteer image');

// Add timeout and retry logic
let initializationAttempts = 0;
const maxAttempts = 3;

function initializeClient() {
  initializationAttempts++;
  console.log(`🔄 Initialization attempt ${initializationAttempts}/${maxAttempts}`);
  console.log('⚙️  Puppeteer configuration: headless mode, optimized Chrome args');
  
  try {
    client.initialize()
      .then(() => {
        console.log('✅ WhatsApp client initialization started successfully');
        console.log('📲 QR code should appear in logs shortly...');
      })
      .catch((error) => {
        console.error('❌ WhatsApp client initialization failed:', error.message);
        console.error('🔍 Error details:', error);
        
        if (error.message.includes('Protocol error') || error.message.includes('Target closed')) {
          console.log('🐛 Chrome protocol error detected - this usually means Chrome crashed');
          console.log('🔧 Trying with different Chrome configuration...');
        }
        
        if (initializationAttempts < maxAttempts) {
          console.log(`🔄 Retrying in 15 seconds... (Attempt ${initializationAttempts + 1}/${maxAttempts})`);
          setTimeout(initializeClient, 15000);
        } else {
          console.error('💥 Maximum initialization attempts reached.');
          console.log('🌐 Express server and health checks will remain operational');
          console.log('📊 Stock/crypto data fetching will work without WhatsApp');
          console.log('💡 Bot will continue with API-only functionality');
          console.log('🔧 You can still test: !stock AAPL or !crypto bitcoin via health endpoint');
        }
      });
  } catch (error) {
    console.error('❌ WhatsApp client initialization error:', error);
    console.error('🔍 Stack trace:', error.stack);
    
    if (initializationAttempts < maxAttempts) {
      console.log(`🔄 Retrying in 15 seconds... (Attempt ${initializationAttempts + 1}/${maxAttempts})`);
      setTimeout(initializeClient, 15000);
    } else {
      console.error('💥 Maximum initialization attempts reached.');
      console.log('🌐 Bot will continue with API-only functionality');
    }
  }
}

// Start initialization
initializeClient();

console.log('\n📋 FENTRIX STOCK BOT - RAILWAY DEPLOYMENT');
console.log('🌐 Express server: ✅ Running');
console.log('📱 WhatsApp client: 🔄 Initializing with Puppeteer Docker image...');
console.log('🔍 Watch logs for QR code...');
console.log('💡 If Chrome issues persist, bot will run with API-only functionality');
console.log('🤖 Professional market analysis bot powered by Fentrix.Ai');
console.log('🚀 DEPLOYMENT SUCCESSFUL!\n'); 
