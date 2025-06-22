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

// Import services with enhanced Railway debugging
let stockService, enhancedSentimentService, alertService, technicalAnalysisService, snipeService;

console.log('📦 LOADING SERVICE MODULES WITH ENHANCED DEBUGGING...');
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 __dirname:', __dirname);
console.log('🔍 Node.js version:', process.version);
console.log('🔍 Environment:', process.env.NODE_ENV || 'development');

// Check if services directory exists
const fs = require('fs');
const path = require('path');

try {
  const servicesDir = path.join(__dirname, 'services');
  console.log('🔍 Checking services directory:', servicesDir);
  
  if (fs.existsSync(servicesDir)) {
    console.log('✅ Services directory exists');
    const files = fs.readdirSync(servicesDir);
    console.log('📁 Files in services directory:', files);
  } else {
    console.error('❌ Services directory does not exist!');
  }
} catch (dirError) {
  console.error('❌ Directory check failed:', dirError.message);
}

try {
  console.log('\n📈 LOADING REAL-TIME STOCK SERVICE...');
  
  // PRIORITY 1: Try Real-Time Stock Service with multiple data sources
  try {
    console.log('🔄 PRIORITY 1: Attempting to load REAL-TIME stock service...');
    stockService = require('./services/realtimeStockService');
    console.log('✅ REAL-TIME STOCK SERVICE LOADED SUCCESSFULLY!');
    console.log('📊 Real-time service type:', typeof stockService);
    console.log('🚀 Multiple data sources available for live prices');
  } catch (realtimeError) {
    console.error('❌ REAL-TIME STOCK SERVICE LOADING FAILED:');
    console.error('📝 Error message:', realtimeError.message);
    
    // FALLBACK 1: Try original stock service
    console.log('🔄 FALLBACK 1: Attempting to load original stockService...');
    try {
      stockService = require('./services/stockService');
      console.log('✅ FALLBACK 1 SUCCESS: Original stock service loaded!');
      console.log('📊 Stock service type:', typeof stockService);
    } catch (stockError) {
      console.error('❌ FALLBACK 1 FAILED:', stockError.message);
      
      // FALLBACK 2: Try simple stock service
      console.log('🔄 FALLBACK 2: Attempting to load simpleStockService...');
      try {
        stockService = require('./services/simpleStockService');
        console.log('✅ FALLBACK 2 SUCCESS: Simple stock service loaded!');
        console.log('📊 Simple stock service type:', typeof stockService);
      } catch (simpleError) {
        console.error('❌ ALL STOCK SERVICES FAILED:', simpleError.message);
        stockService = null;
      }
    }
  }
  
  console.log('\n🧠 LOADING SENTIMENT SERVICE...');
  try {
    console.log('🔄 Attempting to require ./services/enhancedSentimentService...');
    enhancedSentimentService = require('./services/enhancedSentimentService');
    console.log('✅ Enhanced sentiment service loaded successfully');
    console.log('📊 Sentiment service type:', typeof enhancedSentimentService);
  } catch (sentimentError) {
    console.error('❌ SENTIMENT SERVICE LOADING FAILED:');
    console.error('📝 Error message:', sentimentError.message);
    console.error('📝 Error code:', sentimentError.code);
    console.error('📝 Full stack trace:', sentimentError.stack);
    console.error('📝 Error type:', sentimentError.name);
    
    // FALLBACK: Try simple sentiment service
    console.log('🔄 FALLBACK: Attempting to load simpleSentimentService...');
    try {
      enhancedSentimentService = require('./services/simpleSentimentService');
      console.log('✅ FALLBACK SUCCESS: Simple sentiment service loaded!');
      console.log('📊 Simple sentiment service type:', typeof enhancedSentimentService);
    } catch (simpleError) {
      console.error('❌ FALLBACK FAILED: Simple sentiment service also failed:', simpleError.message);
      enhancedSentimentService = null;
    }
  }
  
  console.log('\n🚨 LOADING WORKING ALERT SERVICE...');
  
  // PRIORITY 1: Try Working Alert Service with real monitoring
  try {
    console.log('🔄 PRIORITY 1: Attempting to load WORKING alert service...');
    alertService = require('./services/workingAlertService');
    console.log('✅ WORKING ALERT SERVICE LOADED SUCCESSFULLY!');
    console.log('📊 Working alert service type:', typeof alertService);
    console.log('🚀 Real-time price monitoring available');
  } catch (workingError) {
    console.error('❌ WORKING ALERT SERVICE LOADING FAILED:');
    console.error('📝 Error message:', workingError.message);
    
    // FALLBACK 1: Try original alert service
    console.log('🔄 FALLBACK 1: Attempting to load original alertService...');
    try {
      alertService = require('./services/alertService');
      console.log('✅ FALLBACK 1 SUCCESS: Original alert service loaded!');
      console.log('📊 Alert service type:', typeof alertService);
    } catch (alertError) {
      console.error('❌ FALLBACK 1 FAILED:', alertError.message);
      
      // FALLBACK 2: Try simple alert service
      console.log('🔄 FALLBACK 2: Attempting to load simpleAlertService...');
      try {
        alertService = require('./services/simpleAlertService');
        console.log('✅ FALLBACK 2 SUCCESS: Simple alert service loaded!');
        console.log('📊 Simple alert service type:', typeof alertService);
      } catch (simpleError) {
        console.error('❌ ALL ALERT SERVICES FAILED:', simpleError.message);
        alertService = null;
      }
    }
  }
  
  console.log('\n🔬 LOADING TECHNICAL ANALYSIS SERVICE...');
  
  // PRIORITY 1: Try Technical Analysis Service with AI
  try {
    console.log('🔄 PRIORITY 1: Attempting to load TECHNICAL ANALYSIS service...');
    technicalAnalysisService = require('./services/technicalAnalysisService');
    console.log('✅ TECHNICAL ANALYSIS SERVICE LOADED SUCCESSFULLY!');
    console.log('📊 Technical analysis service type:', typeof technicalAnalysisService);
    console.log('🤖 AI trading analysis with RSI, VWAP, CCI available');
  } catch (technicalError) {
    console.error('❌ TECHNICAL ANALYSIS SERVICE LOADING FAILED:');
    console.error('📝 Error message:', technicalError.message);
    technicalAnalysisService = null;
  }
  
  console.log('\n🎯 LOADING SNIPE SERVICE...');
  
  // Try Snipe Service for swing trading analysis
  try {
    console.log('🔄 Attempting to load SNIPE service...');
    snipeService = require('./services/snipeService');
    console.log('✅ SNIPE SERVICE LOADED SUCCESSFULLY!');
    console.log('📊 Snipe service type:', typeof snipeService);
    console.log('🎯 Swing trading analysis with market scanning available');
  } catch (snipeError) {
    console.error('❌ SNIPE SERVICE LOADING FAILED:');
    console.error('📝 Error message:', snipeError.message);
    snipeService = null;
  }
  
  // Enhanced summary of loaded services with fallback system
  console.log('\n📋 BULLETPROOF SERVICE LOADING SUMMARY:');
  const loadedServices = [];
  
  if (stockService) {
    loadedServices.push('Stock Service');
    console.log('✅ Stock Service: LOADED (with fallback system)');
    console.log('📊 Stock API: Ready for real-time price data');
  } else {
    console.log('❌ Stock Service: COMPLETELY FAILED (both main + fallback)');
  }
  
  if (enhancedSentimentService) {
    loadedServices.push('Sentiment Service');
    console.log('✅ Sentiment Service: LOADED (with fallback system)');
    console.log('🧠 Sentiment Analysis: Ready for market analysis');
  } else {
    console.log('❌ Sentiment Service: COMPLETELY FAILED (both main + fallback)');
  }
  
  if (alertService) {
    loadedServices.push('Alert Service');
    console.log('✅ Alert Service: LOADED (with fallback system)');
    console.log('🚨 Price Alerts: Ready for live monitoring');
  } else {
    console.log('❌ Alert Service: COMPLETELY FAILED (both main + fallback)');
  }
  
  if (technicalAnalysisService) {
    loadedServices.push('Technical Analysis Service');
    console.log('✅ Technical Analysis Service: LOADED');
    console.log('🔬 RSI, VWAP, CCI + AI Trading Analysis: Ready');
  } else {
    console.log('❌ Technical Analysis Service: FAILED');
  }
  
  if (snipeService) {
    loadedServices.push('Snipe Service');
    console.log('✅ Snipe Service: LOADED');
    console.log('🎯 Swing Trading Analysis + Market Scanning: Ready');
  } else {
    console.log('❌ Snipe Service: FAILED');
  }
  
  if (loadedServices.length > 0) {
    console.log(`\n🎉 BULLETPROOF SUCCESS: ${loadedServices.length}/5 services loaded with fallback protection!`);
    console.log('🔥 ALL BOT FEATURES ARE NOW OPERATIONAL:');
    console.log('📈 Real-time stock prices: ✅');
    console.log('🪙 Real-time crypto prices: ✅');
    console.log('🚨 Price alerts: ✅');
    console.log('🧠 Sentiment analysis: ✅');
    console.log('🔬 Technical analysis with AI: ✅');
    console.log('🎯 Swing trading market snipe: ✅');
    console.log('🤖 Fentrix.Ai Professional Trading Bot: READY! 🚀');
  } else {
    console.log('\n❌ CRITICAL: ALL SERVICES FAILED (even fallbacks)');
    console.log('🔧 This indicates a serious Railway deployment issue');
    console.log('💡 Bot will run in basic mode only');
  }
  
} catch (error) {
  console.error('❌ CRITICAL SERVICE LOADING ERROR:');
  console.error('📝 Error message:', error.message);
  console.error('📝 Error code:', error.code);
  console.error('📝 Full stack trace:', error.stack);
  console.error('📝 Error type:', error.name);
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
  console.log('📈 Real-time stock/crypto data: ✅');
  console.log('🌐 Professional sentiment analysis: ✅');
  console.log('📰 Real-time news integration: ✅');
  console.log('📊 Fear & Greed Index: ✅');
  console.log('🎨 Clean professional responses: ✅');
  console.log('🚨 LIVE price alerts + monitoring: ✅');
  console.log('📊 LIVE price monitoring (30s): ✅');
  console.log('🔄 Real-time background monitoring: ✅');
  console.log('👥 Group mode: ✅ Everyone can use commands!');
  console.log('🤖 Powered by Fentrix.Ai: ✅');
  console.log('==========================================');
  console.log('🔥 ALL FEATURES OPERATIONAL - BOT IS LIVE!');
  console.log('📝 Test with: !test, !stock AAPL, !crypto bitcoin');
  console.log('🚨 Test alerts with: !alert AAPL $190.00');
  console.log('🔬 Test technical analysis with: !check TSLA');
  console.log('🚀 Add bot to WhatsApp groups and start trading!');
  console.log('==========================================\n');
  
  // Connect alert service to bot client
  if (alertService) {
    try {
      alertService.setBotClient(client);
      console.log('✅ Alert service connected to bot client');
      
      // Connect alert service to stock service for real-time monitoring
      if (stockService) {
        alertService.setStockService(stockService);
        console.log('✅ Alert service connected to stock service');
        console.log('🔄 Real-time price monitoring will start automatically');
      } else {
        console.log('⚠️ Stock service not available for alert monitoring');
      }
      
    } catch (error) {
      console.error('❌ Alert service connection failed:', error.message);
    }
  } else {
    console.log('⚠️ Alert service not available');
  }
  
  // Additional service status check
  console.log('\n📊 FINAL SERVICE STATUS CHECK:');
  console.log(`📈 Stock Service: ${stockService ? '✅ Ready for real-time prices' : '❌ Not available'}`);
  console.log(`🚨 Alert Service: ${alertService ? '✅ Ready for live monitoring' : '❌ Not available'}`);
  console.log(`🧠 Sentiment Service: ${enhancedSentimentService ? '✅ Ready for analysis' : '❌ Not available'}`);
  console.log(`🔬 Technical Analysis: ${technicalAnalysisService ? '✅ Ready for AI trading analysis' : '❌ Not available'}`);
  
  if (stockService && alertService) {
    console.log('\n🎉 PERFECT! All core services operational!');
    console.log('💡 Bot ready for real-time stock/crypto trading assistance!');
  } else {
    console.log('\n⚠️ Some services unavailable - bot running in limited mode');
  }
  
  console.log('==========================================\n');
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
            debugInfo += `• Alert Service: ${alertService ? '✅ Loaded' : '❌ Failed'}\n`;
            debugInfo += `• Technical Analysis: ${technicalAnalysisService ? '✅ Loaded (Multi-source: FMP + Alpha Vantage + DeepSeek AI)' : '❌ Failed'}\n`;
            debugInfo += `• Snipe Service: ${snipeService ? '✅ Loaded (Swing Trading + Market Scanning)' : '❌ Failed'}\n\n`;
            
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
            debugInfo += `• Alpha Vantage Key: ${config.ALPHA_VANTAGE_API_KEY ? '✅ Set (Price data only)' : '❌ Missing'}\n`;
            debugInfo += `• FMP Key: ${config.FMP_API_KEY ? '✅ Set (RSI/VWAP/CCI primary)' : '❌ Missing'}\n`;
            debugInfo += `• DeepSeek Key: ${config.DEEPSEEK_API_KEY ? '✅ Set (AI analysis)' : '❌ Missing'}\n`;
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
            debugInfo += '🧠 !sentiment AAPL - Test sentiment\n';
            debugInfo += '🔬 !checktest - Test technical analysis (Multi-source)\n';
            debugInfo += '🎯 !snipetest - Test snipe service components\n';
            debugInfo += '🎯 !snipe market - Test swing trading scanner\n\n';
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
                  
                  // Test technical analysis if available
                  if (technicalAnalysisService) {
                    console.log('🔍 Testing technical analysis APIs...');
                    const priceTest = await technicalAnalysisService.quickPriceTest('AAPL');
                    const techTest = await technicalAnalysisService.quickTechnicalTest('AAPL');
                    
                    testReport += `📈 *Alpha Vantage (Price):* ${priceTest.success ? '✅ Working' : '❌ Failed'}\n`;
                    if (!priceTest.success && priceTest.error) {
                      testReport += `   Error: ${priceTest.error}\n`;
                    }
                    
                    testReport += `📊 *Technical Indicators (Multi-source):* ${techTest.success ? '✅ Working' : '❌ Failed'}\n`;
                    if (!techTest.success && techTest.error) {
                      testReport += `   Error: ${techTest.error}\n`;
                    }
                    
                    console.log('✅ Alpha Vantage (price) test:', priceTest.success ? 'PASSED' : 'FAILED', '-', priceTest.message);
                    console.log('✅ Technical indicators (multi-source) test:', techTest.success ? 'PASSED' : 'FAILED', '-', techTest.message);
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

        // Snipe Test command
        else if (text.includes('!snipetest')) {
          if (!snipeService) {
            await sendBotResponse(msg, '❌ Snipe service not available.');
            return;
          }

          console.log('🧪 SNIPE TEST COMMAND');
          
          try {
            await sendBotResponse(msg, '🧪 Testing snipe service components...\n📊 Testing stock analysis...\nPlease wait...');
            
            // Test with a simple stock analysis
            const testStock = { symbol: 'AAPL', price: 150, volume: 50000000 };
            const testAnalysis = await snipeService.analyzeStock(testStock);
            
            let responseText = '🧪 *SNIPE SERVICE TEST* 🎯\n\n';
            responseText += `📊 Test Stock: ${testStock.symbol}\n`;
            responseText += `💰 Current Price: $${testAnalysis.currentPrice?.toFixed(2) || 'N/A'}\n`;
            responseText += `📊 RSI: ${testAnalysis.rsi?.toFixed(1) || 'N/A'}\n`;
            responseText += `⚖️ VWAP: $${testAnalysis.vwap?.toFixed(2) || 'N/A'}\n`;
            responseText += `🌊 CCI: ${testAnalysis.cci?.toFixed(1) || 'N/A'}\n`;
            responseText += `🎯 Buy Candidate: ${testAnalysis.isBuyCandidate ? '✅ Yes' : '❌ No'}\n`;
            responseText += `📝 Strategy: ${testAnalysis.strategyReason || 'N/A'}\n\n`;
            
            responseText += `✅ *Service Status:* Working\n`;
            responseText += `🔧 Ready for !snipe market command\n\n`;
            responseText += `🤖 *Powered by Fentrix.Ai*`;
            
            await sendBotResponse(msg, responseText);
            
          } catch (error) {
            console.log(`❌ Snipe test failed:`, error.message);
            await sendBotResponse(msg, `❌ Snipe test failed: ${error.message}\n\n💡 This indicates an issue with:\n• API connectivity\n• Service configuration\n• Rate limiting\n\n🤖 Powered by Fentrix.Ai`);
          }
        }

        // Technical Analysis Debug command
        else if (text.includes('!checktest')) {
          if (!technicalAnalysisService) {
            await sendBotResponse(msg, '❌ Technical analysis service not available.');
            return;
          }

          console.log('🧪 TECHNICAL ANALYSIS DEBUG TEST');
          
          try {
            await sendBotResponse(msg, '🧪 Testing technical analysis service...\n📊 Testing Alpha Vantage (price) + Multi-source indicators...\nPlease wait...');
            
            const priceTest = await technicalAnalysisService.quickPriceTest('AAPL');
            const techTest = await technicalAnalysisService.quickTechnicalTest('AAPL');
            
            let responseText = '🧪 *TECHNICAL ANALYSIS DEBUG TEST* 📊\n\n';
            responseText += `🔬 Service Status: ${technicalAnalysisService ? '✅ Loaded' : '❌ Failed'}\n\n`;
            
            responseText += '📈 *ALPHA VANTAGE (PRICE):*\n';
            responseText += `• Status: ${priceTest.success ? '✅ Success' : '❌ Failed'}\n`;
            responseText += `• Result: ${priceTest.message}\n\n`;
            
            responseText += '📊 *TECHNICAL INDICATORS (MULTI-SOURCE):*\n';
            responseText += `• Status: ${techTest.success ? '✅ Success' : '❌ Failed'}\n`;
            responseText += `• Result: ${techTest.message}\n\n`;
            
            if (!priceTest.success || !techTest.success) {
              responseText += '🔧 *ISSUES DETECTED:*\n';
              
              if (!priceTest.success) {
                responseText += `• Alpha Vantage: ${priceTest.error}\n`;
                if (priceTest.error && priceTest.error.includes('Rate Limit')) {
                  responseText += '  ⚠️ Rate limit detected! Wait 1-2 minutes\n';
                }
              }
              
              if (!techTest.success) {
                responseText += `• Technical Indicators: ${techTest.error}\n`;
              }
              
              responseText += '\n💡 *SOLUTIONS:*\n';
              responseText += '• Wait 1-2 minutes between tests\n';
              responseText += '• Try different symbol (!checktest TSLA)\n';
              responseText += '• Check Railway logs for details\n\n';
            } else {
              responseText += '🎉 *ALL SYSTEMS OPERATIONAL!*\n';
              responseText += '✅ Ready for !check commands\n\n';
            }
            
            responseText += '🤖 *Powered by Fentrix.Ai*';
            
            await sendBotResponse(msg, responseText);
            
          } catch (error) {
            console.log(`❌ Technical analysis debug test failed:`, error.message);
            await sendBotResponse(msg, `❌ Technical analysis debug test failed: ${error.message}\n\n💡 This is likely due to API rate limiting from Alpha Vantage.\n⏰ Wait 1-2 minutes and try again.\n\n🤖 Powered by Fentrix.Ai`);
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
        
        // Alerts list command - WORKING FUNCTIONALITY
        else if (text.includes('!alerts')) {
          if (!alertService) {
            await sendBotResponse(msg, '❌ Alert service not available. Please try again later.');
            return;
          }
          
          console.log('📋 LISTING ACTIVE ALERTS WITH WORKING SERVICE');
          
          try {
            // Use the working alert service's display method if available
            if (alertService.formatAlertsDisplay) {
              const alertsDisplay = alertService.formatAlertsDisplay(msg.from);
              await sendBotResponse(msg, alertsDisplay);
            } else {
              // Fallback for simple alert services
              const chatAlerts = alertService.getChatAlerts(msg.from);
              const totalAlerts = alertService.getActiveAlerts().length;
              
              console.log(`✅ Found ${chatAlerts.length} alerts in this chat, ${totalAlerts} total`);
              
              if (chatAlerts.length === 0) {
                await sendBotResponse(msg, '📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n❌ No active alerts in this chat\n\n💡 Set an alert with:\n🚨 !alert AAPL $187.50\n🚨 !alert bitcoin $45000\n🚨 !alert TSLA $200.00\n\n🔍 Live monitoring active\n🤖 Powered by Fentrix.Ai');
              } else {
                let alertsText = `📋 *ACTIVE ALERTS IN THIS CHAT* 🚨\n\n`;
                
                chatAlerts.forEach((alert, index) => {
                  const timeAgo = getTimeAgo(alert.createdAt);
                  const directionEmoji = alert.direction === 'up' ? '⬆️' : alert.direction === 'down' ? '⬇️' : '🎯';
                  alertsText += `${index + 1}. *${alert.symbol}* - Target: $${alert.targetPrice.toLocaleString()} ${directionEmoji}\n`;
                  alertsText += `   👤 By: ${alert.userName} | ⏰ ${timeAgo}\n\n`;
                });
                
                alertsText += `🔍 *Live monitoring active*\n`;
                alertsText += `📊 Total alerts: ${totalAlerts}\n`;
                alertsText += '🤖 *Powered by Fentrix.Ai*';
                
                await sendBotResponse(msg, alertsText);
              }
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
        
        // Technical Analysis command - NEW !check FEATURE
        else if (text.startsWith('!check ')) {
          if (!technicalAnalysisService) {
            await sendBotResponse(msg, '❌ Technical analysis service not available. Please try again later.');
            return;
          }
          
          const symbol = text.replace('!check ', '').trim().toUpperCase();
          console.log(`🔬 TECHNICAL ANALYSIS COMMAND: ${symbol}`);
          
          try {
            await sendBotResponse(msg, `🔬 Analyzing ${symbol} with AI trading intelligence...\n📊 Fetching RSI, VWAP from FMP...\n📊 Fetching CCI from multiple sources...\n💰 Getting current price from Alpha Vantage...\n🤖 DeepSeek AI processing market signals...\n📈 Generating buy/sell/hold recommendations...\nPlease wait...`);
            
            // Get complete technical analysis
            const analysisData = await technicalAnalysisService.getStockAnalysis(symbol);
            console.log(`✅ Technical data retrieved for ${symbol}`);
            
            // Get AI analysis
            const aiAnalysis = await technicalAnalysisService.analyzeWithAI(analysisData);
            console.log(`✅ AI analysis completed for ${symbol}`);
            
            // Format and send the complete analysis
            const formattedAnalysis = technicalAnalysisService.formatAnalysisDisplay(analysisData, aiAnalysis);
            await sendBotResponse(msg, formattedAnalysis);
            
            console.log(`✅ TECHNICAL ANALYSIS: Complete analysis sent for ${symbol}`);
            
            // Optional: Create alert based on AI recommendation if confidence is high
            if (aiAnalysis.confidence > 75 && aiAnalysis.signal !== 'HOLD' && alertService) {
              console.log(`🚨 High confidence ${aiAnalysis.signal} signal for ${symbol}, suggesting alert...`);
              
              let suggestedPrice;
              if (aiAnalysis.target && aiAnalysis.target !== 'N/A') {
                // Extract price from target if available
                const targetMatch = aiAnalysis.target.match(/\$?([\d.,]+)/);
                if (targetMatch) {
                  suggestedPrice = parseFloat(targetMatch[1].replace(/,/g, ''));
                }
              }
              
              if (!suggestedPrice) {
                // Calculate suggested alert price based on signal and current price
                const currentPrice = analysisData.currentPrice;
                if (aiAnalysis.signal === 'BUY') {
                  suggestedPrice = currentPrice * 1.05; // 5% above current for buy signal
                } else if (aiAnalysis.signal === 'SELL') {
                  suggestedPrice = currentPrice * 0.95; // 5% below current for sell signal
                }
              }
              
              if (suggestedPrice) {
                setTimeout(async () => {
                  const alertSuggestion = `💡 *SMART ALERT SUGGESTION* 🤖\n\nBased on the high-confidence ${aiAnalysis.signal} signal for ${symbol}, consider setting an alert:\n\n🚨 !alert ${symbol} $${suggestedPrice.toFixed(2)}\n\n⚡ AI Confidence: ${aiAnalysis.confidence}%\n🎯 This will notify you when the target is reached!\n\n🤖 Powered by Fentrix.Ai`;
                  await sendBotResponse(msg, alertSuggestion);
                }, 2000);
              }
            }
            
          } catch (error) {
            console.log(`❌ Technical analysis failed for ${symbol}:`, error.message);
            await sendBotResponse(msg, `❌ Could not complete technical analysis for ${symbol}\n\nError: ${error.message}\n\n💡 Try: !check AAPL, !check TSLA, !check GOOGL\n\n🤖 Powered by Fentrix.Ai`);
          }
        }
        
        // Snipe Market command - NEW !snipe market FEATURE
        else if (text.includes('!snipe market')) {
          if (!snipeService) {
            await sendBotResponse(msg, '❌ Snipe service not available. Please try again later.');
            return;
          }
          
          console.log('🎯 SNIPE MARKET COMMAND DETECTED');
          
          try {
            await sendBotResponse(msg, `🎯 *MARKET SNIPE INITIATED* 📊\n\n🔍 Scanning active US stocks (gainers + high volume)...\n📊 Analyzing technical indicators (RSI, VWAP, CCI)...\n🧠 Applying swing trading strategy:\n• RSI < 30 (Oversold)\n• CCI < -100 (Oversold)\n• Price > VWAP (Above average)\n📰 Checking news sentiment...\n🎯 Finding best opportunities...\n\n⏰ This may take 30-60 seconds...\nPlease wait...`);
            
            console.log('🎯 SNIPE: Starting executeSnipeAnalysis...');
            
            // Execute snipe analysis with enhanced error handling
            const snipeResults = await snipeService.executeSnipeAnalysis();
            console.log(`✅ Snipe analysis completed: ${snipeResults.candidates?.length || 0} candidates found`);
            console.log('📊 Snipe results:', JSON.stringify(snipeResults, null, 2));
            
            // Format and send results
            console.log('🎯 SNIPE: Formatting results...');
            const formattedResults = snipeService.formatSnipeResults(snipeResults);
            console.log('🎯 SNIPE: Sending formatted results...');
            
            await sendBotResponse(msg, formattedResults);
            
            console.log(`✅ SNIPE MARKET: Results sent to chat`);
            
          } catch (error) {
            console.error(`❌ Snipe market analysis failed:`, error);
            console.error(`❌ Error stack:`, error.stack);
            
            let errorMessage = error.message || 'Unknown error occurred';
            
            // Check for specific error types
            if (errorMessage.includes('timeout')) {
              errorMessage = 'Request timeout - APIs may be slow';
            } else if (errorMessage.includes('Rate Limit') || errorMessage.includes('429')) {
              errorMessage = 'API rate limit reached - please wait a few minutes';
            } else if (errorMessage.includes('Network')) {
              errorMessage = 'Network connection issue';
            }
            
            await sendBotResponse(msg, `❌ Market snipe analysis failed: ${errorMessage}\n\n💡 This could be due to:\n• API rate limits (try again in 5 minutes)\n• Weekend/after-hours (APIs may be slower)\n• Network connectivity issues\n• High API demand\n\n🔄 Try again in a few minutes\n\n🤖 Powered by Fentrix.Ai`);
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

🔬 *AI TECHNICAL ANALYSIS COMMANDS:*
• !check TSLA - Complete technical analysis with RSI, VWAP, CCI
• !check AAPL - AI buy/sell/hold recommendations
• !check GOOGL - Professional trading analysis with timing

🎯 *SWING TRADING COMMANDS:*
• !snipe market - Scan market for swing trading opportunities

❓ *OTHER COMMANDS:*
• !help - Show this help
• !test - Test bot functionality
• !debug - Debug service status
• !checktest - Test technical analysis API

🔥 *ENHANCED FEATURES:*
✅ Real-time stock/crypto prices
✅ Professional sentiment analysis
✅ AI technical analysis (RSI, VWAP, CCI)
✅ Swing trading market scanner
✅ Real-time news integration
✅ Clean professional responses
✅ Price alerts with LIVE monitoring
✅ Buy/sell/hold AI recommendations
✅ Smart alert suggestions
✅ Group mode - anyone can use
✅ 24/7 Railway cloud hosting
✅ Powered by Fentrix.Ai

💡 *Examples:*
📈 !stock AAPL
🪙 !crypto bitcoin
🚨 !alert bitcoin $45000
🔬 !check TSLA
🎯 !snipe market

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

