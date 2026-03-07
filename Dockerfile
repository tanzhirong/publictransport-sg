FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]
