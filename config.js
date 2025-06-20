require('dotenv').config();

module.exports = {
  // API Configuration (use environment variables in production)
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-e1f4fa835ce0404e830c1b557959f5ab',
  DEEPSEEK_API_BASE: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '18PO9ZL6HV4F00C6',
  
  // API Endpoints for services
  STOCK_API_BASE: 'https://www.alphavantage.co/query',
  CRYPTO_API_BASE: 'https://api.coingecko.com/api/v3',
  
  // Optional API (not required for basic functionality)
  FINANCIAL_MODELING_PREP_API_KEY: process.env.FINANCIAL_MODELING_PREP_API_KEY || '',
  
  // Bot Configuration
  BOT_NAME: process.env.BOT_NAME || 'Fentrix Stock Bot',
  COMMAND_PREFIX: process.env.COMMAND_PREFIX || '!',
  
  // Server Configuration for Railway
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Feature Flags
  ENABLE_SENTIMENT_ANALYSIS: process.env.ENABLE_SENTIMENT_ANALYSIS !== 'false',
  ENABLE_PRICE_ALERTS: process.env.ENABLE_PRICE_ALERTS !== 'false',
  ENABLE_AUTO_SENTIMENT: process.env.ENABLE_AUTO_SENTIMENT !== 'false',
  
  // Monitoring Configuration
  ALERT_CHECK_INTERVAL: parseInt(process.env.ALERT_CHECK_INTERVAL) || 15000, // 15 seconds
  MAX_ALERTS_PER_CHAT: parseInt(process.env.MAX_ALERTS_PER_CHAT) || 10,
  
  // Rate Limiting
  API_RATE_LIMIT_DELAY: parseInt(process.env.API_RATE_LIMIT_DELAY) || 1000, // 1 second
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_DEBUG_LOGS: process.env.ENABLE_DEBUG_LOGS === 'true',
  
  // WhatsApp Configuration
  SESSION_PATH: process.env.SESSION_PATH || './session',
  PUPPETEER_HEADLESS: process.env.PUPPETEER_HEADLESS !== 'false',
  
  // Health Check
  HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false',
  
  // Bot Identity
  BOT_VERSION: '2.0.0',
  BOT_AUTHOR: 'Fentrix.Ai',
  BOT_DESCRIPTION: 'Professional Stock & Crypto Bot with Live Monitoring'
}; 