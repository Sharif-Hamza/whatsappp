# Use Node.js 18 on Ubuntu for better Chrome support
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Install Chrome dependencies and tools
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libgconf-2-4 \
    libxss1 \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcb1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy application code
COPY . .

# Create a non-root user for running Chrome
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Set display for virtual display
ENV DISPLAY=:99

# Expose port for Railway
EXPOSE 3000

# Switch to non-root user
USER pptruser

# Start the application
CMD ["npm", "start"] 