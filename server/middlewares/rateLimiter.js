const redis = require('redis');
let redisClient = null;

const getRedisClient = async () => {
    if (redisClient) return redisClient;
    
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    const password = process.env.REDIS_PASSWORD;
    
    // Upstash requires TLS/SSL connection (rediss:// instead of redis://)
    const isUpstash = host.includes('upstash.io');
    const protocol = isUpstash ? 'rediss' : 'redis';
    const url = password 
        ? `${protocol}://default:${password}@${host}:${port}`
        : `${protocol}://${host}:${port}`;
        
    redisClient = redis.createClient({ 
        url,
        socket: isUpstash ? { tls: true } : undefined
    });
    
    redisClient.on('error', (err) => console.error('[Redis Client Error]', err));
    redisClient.on('connect', () => console.log('[Redis] Connecting...'));
    redisClient.on('ready', () => console.log('[Redis] Client ready and connected successfully.'));
    
    await redisClient.connect();
    return redisClient;
};

// Rate limiter middleware builder
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // Default: 15 minutes
    const max = options.max || 100; // Default: 100 requests per windowMs
    
    return async (req, res, next) => {
        try {
            const client = await getRedisClient();
            
            // Derive unique key using client IP address
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const key = `rate-limit:${ip}`;
            
            const currentRequests = await client.incr(key);
            
            if (currentRequests === 1) {
                // If it is the first request in the window, set the TTL
                await client.expire(key, Math.ceil(windowMs / 1000));
            }
            
            const remaining = Math.max(0, max - currentRequests);
            
            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', remaining);
            
            if (currentRequests > max) {
                const ttl = await client.ttl(key);
                res.setHeader('Retry-After', ttl);
                return res.status(429).json({
                    message: 'Too many requests. Please try again later.',
                    retryAfter: ttl
                });
            }
            
            next();
        } catch (error) {
            console.error('[RateLimiter Error]', error);
            // Fail open: If Redis fails, let requests proceed so we don't bring down the app
            next();
        }
    };
};

module.exports = { rateLimiter, getRedisClient };
