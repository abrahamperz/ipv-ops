FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application for production
RUN npm run build

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'if [ "$NODE_ENV" = "production" ]; then' >> /start.sh && \
    echo '  nginx -g "daemon off;"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  npm start' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Start script
CMD ["/start.sh"]
