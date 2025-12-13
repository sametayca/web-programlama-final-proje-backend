FROM node:18-alpine

WORKDIR /app

# Install bash for entrypoint script
RUN apk add --no-cache bash

COPY package*.json ./

RUN npm install

COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

