process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/skillventures_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-min-32-chars-long!!';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars-long!';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.BCRYPT_COST = process.env.BCRYPT_COST ?? '12';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? 'false';
process.env.RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET ?? 'test_webhook_secret';
