# Use Puppeteer base image with Chrome pre-installed and configured
FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Set working directory
WORKDIR /app

# Switch to root to install dependencies and copy files
USER root

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy application code
COPY . .

# Set environment variables for Railway
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Create necessary directories and set proper permissions
RUN mkdir -p /app/session \
    && chown -R pptruser:pptruser /app

# Expose port for Railway
EXPOSE 3000

# Switch back to non-root user (pptruser is already created in base image)
USER pptruser

# Start the application
CMD ["npm", "start"] 