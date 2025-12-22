const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const initRedis = async () => {
  // Check if Redis is enabled
  if (process.env.REDIS_ENABLED !== 'true') {
    logger.info('Redis caching is disabled');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    logger.info('✅ Redis connection established successfully');
    
    return redisClient;
  } catch (error) {
    logger.warn('⚠️ Redis connection failed, running without cache:', error.message);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const isRedisConnected = () => {
  return redisClient && redisClient.isReady;
};

// Cache helper functions
const cacheGet = async (key) => {
  if (!isRedisConnected()) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis GET error:', error);
    return null;
  }
};

const cacheSet = async (key, value, expirationInSeconds = 3600) => {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis SET error:', error);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis DEL error:', error);
    return false;
  }
};

const cacheDelPattern = async (pattern) => {
  if (!isRedisConnected()) return false;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis DEL pattern error:', error);
    return false;
  }
};

const cacheFlush = async () => {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient.flushAll();
    logger.info('Redis cache flushed');
    return true;
  } catch (error) {
    logger.error('Redis FLUSH error:', error);
    return false;
  }
};

// Graceful shutdown
const closeRedis = async () => {
  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  cacheFlush,
  closeRedis
};




