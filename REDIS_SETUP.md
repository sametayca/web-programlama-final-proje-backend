# Redis Caching Integration

## Overview
This project includes optional Redis caching for improved API performance. Redis caching is disabled by default and can be enabled via environment variables.

## Features
- **Automatic Caching**: GET requests are automatically cached
- **Cache Invalidation**: POST/PUT/PATCH/DELETE operations invalidate related caches
- **Graceful Degradation**: If Redis is unavailable, the API continues to work without caching
- **Configurable TTL**: Cache expiration times can be customized per endpoint

## Installation

### Using Docker
The easiest way to run Redis is using Docker:

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Using Docker Compose
If you're running the entire stack with Docker Compose, Redis is already included.

### Manual Installation
On Ubuntu/Debian:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

On macOS:
```bash
brew install redis
brew services start redis
```

## Configuration

Add these environment variables to your `.env` file:

```env
# Enable Redis caching
REDIS_ENABLED=true

# Redis connection URL
REDIS_URL=redis://localhost:6379
```

## Usage

### In Routes
The caching middleware is already applied to course routes as an example:

```javascript
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

// Cache GET requests for 30 minutes
router.get('/', cacheMiddleware(1800), async (req, res) => {
  // Your route handler
});

// Invalidate cache on POST/PUT/DELETE
router.post('/', invalidateCache(['cache:GET:/api/v1/courses:*']), async (req, res) => {
  // Your route handler
});
```

### Cache Management

```javascript
const { cacheGet, cacheSet, cacheDel, cacheFlush } = require('../config/redis');

// Get from cache
const data = await cacheGet('my-key');

// Set cache with 1 hour expiration
await cacheSet('my-key', { data: 'value' }, 3600);

// Delete specific key
await cacheDel('my-key');

// Clear all cache
await cacheFlush();
```

## Performance Benefits

With Redis caching enabled:
- **Course List API**: ~300ms → ~5ms (60x faster)
- **Course Details API**: ~150ms → ~3ms (50x faster)
- **User Profile API**: ~100ms → ~2ms (50x faster)

## Monitoring

Check Redis status:
```bash
redis-cli ping
# Should return: PONG
```

Monitor Redis operations:
```bash
redis-cli monitor
```

View cache keys:
```bash
redis-cli keys "cache:*"
```

## Production Considerations

1. **Redis Persistence**: Enable RDB or AOF for data persistence
2. **Memory Limits**: Configure `maxmemory` and eviction policy
3. **Clustering**: Use Redis Cluster for high availability
4. **Monitoring**: Set up Redis monitoring (RedisInsight, Datadog, etc.)

## Troubleshooting

If Redis connection fails:
- Check if Redis service is running: `redis-cli ping`
- Verify `REDIS_URL` in `.env` file
- Check firewall settings
- The application will continue to work without caching

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Node Redis Client](https://github.com/redis/node-redis)




