FROM node:18-alpine

WORKDIR /app

# Install dos2unix for line ending conversion
RUN apk add --no-cache dos2unix bash

COPY package*.json ./

RUN npm install

COPY . .

# Convert line endings and make script executable
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

# Use shell form to work around Windows line ending issues
CMD ["sh", "-c", "/app/docker-entrypoint.sh npm run dev"]
