# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local dev)

## Docker Deployment (Production-like)
1. **Build Images:**
   ```bash
   docker-compose build
   ```
2. **Start Services:**
   ```bash
   docker-compose up -d
   ```
3. **Database Migration:**
   Container automatically runs migrations on startup via `docker-entrypoint.sh`.

## Local Development
1. **Backend:**
   ```bash
   cd web-programlama-final-proje-backend
   npm install
   npm run dev
   ```
2. **Frontend:**
   ```bash
   cd web-programlama-final-proje-frontend
   npm install
   npm run dev
   ```

## Environment Variables
Create a `.env` file based on `.env.example`. Key variables:
- `DATABASE_URL`: Postgres connection string.
- `JWT_SECRET`: Secret key for tokens.
- `REDIS_URL`: Redis connection.
