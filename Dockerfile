# Use Puppeteer base image with Chrome pre-installed and configured
FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Set working directory
WORKDIR /app

# Switch back to root to install additional dependencies
USER root

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy application code
COPY . .

# Set environment variables for Railway
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Create necessary directories and set permissions
RUN mkdir -p /app/session \
    && chown -R pptruser:pptruser /app

# Expose port for Railway
EXPOSE 3000

# Switch back to non-root user (pptruser is already created in base image)
USER pptruser

# Start the application
CMD ["npm", "start"] 