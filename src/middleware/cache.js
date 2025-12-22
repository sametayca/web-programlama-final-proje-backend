const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Cache middleware for GET requests
 * @param {number} expirationInSeconds - Cache expiration time in seconds (default: 1 hour)
 * @param {function} keyGenerator - Optional function to generate cache key
 */
const cacheMiddleware = (expirationInSeconds = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        // Default key: method + url + query params + user id
        const userId = req.user?.id || 'anonymous';
        const queryString = JSON.stringify(req.query);
        cacheKey = `cache:${req.method}:${req.path}:${queryString}:${userId}`;
      }

      // Try to get cached data
      const cachedData = await cacheGet(cacheKey);
      
      if (cachedData) {
        logger.info(`Cache HIT for key: ${cacheKey}`);
        return res.status(200).json({
          ...cachedData,
          _cached: true,
          _cacheKey: cacheKey
        });
      }

      logger.info(`Cache MISS for key: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        // Only cache successful responses (200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(cacheKey, data, expirationInSeconds)
            .then(() => {
              logger.info(`Cached response for key: ${cacheKey}`);
            })
            .catch((error) => {
              logger.error(`Failed to cache response for key ${cacheKey}:`, error);
            });
        }

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Don't break the request if cache fails
      next();
    }
  };
};

/**
 * Invalidate cache for specific patterns
 * Use this in middleware after POST, PUT, PATCH, DELETE operations
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const { cacheDelPattern } = require('../config/redis');
    
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = function (data) {
      // Only invalidate cache on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (Array.isArray(patterns)) {
          patterns.forEach(pattern => {
            cacheDelPattern(pattern)
              .then(() => logger.info(`Invalidated cache pattern: ${pattern}`))
              .catch(error => logger.error(`Failed to invalidate cache pattern ${pattern}:`, error));
          });
        } else {
          cacheDelPattern(patterns)
            .then(() => logger.info(`Invalidated cache pattern: ${patterns}`))
            .catch(error => logger.error(`Failed to invalidate cache pattern ${patterns}:`, error));
        }
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache
};




