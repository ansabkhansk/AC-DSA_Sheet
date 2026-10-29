process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/dsa-test-placeholder';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.REDIS_ENABLED = 'false';
process.env.LOG_LEVEL = 'silent';
process.env.COOKIE_SECURE = 'false';
// Keep suite under the limiter; dedicated rate-limit tests use their own app + low max.
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_API_MAX = '10000';
process.env.RATE_LIMIT_AUTH_MAX = '10000';
process.env.SHEET_CACHE_TTL_SECONDS = '3600';
