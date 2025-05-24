const redis = require('redis');

// Tạo kết nối Redis Cloud
const redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

// Xử lý sự kiện kết nối
redisClient.on('error', (err) => {
  console.error('Redis Cloud Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis Cloud Successfully');
});

// Khởi động kết nối
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis Cloud:', error);
  }
})();

// Helper functions cho Redis v4+
module.exports = {
  redisClient,
  getAsync: async (key) => await redisClient.get(key),
  setAsync: async (key, value) => await redisClient.set(key, value),
  setexAsync: async (key, seconds, value) => await redisClient.setEx(key, seconds, value),
  delAsync: async (key) => await redisClient.del(key),
  keysAsync: async (pattern) => await redisClient.keys(pattern)
};