const { redisClient } = require('../config/redisConfig');

// Giám sát trạng thái kết nối Redis Cloud
const monitorRedisConnection = () => {
  // Thử kết nối lại sau 5 giây nếu mất kết nối
  redisClient.on('error', (err) => {
    console.error('Redis Cloud connection error. Attempting to reconnect...', err);
    setTimeout(async () => {
      try {
        if (!redisClient.isOpen) {
          await redisClient.connect();
        }
      } catch (error) {
        console.error('Failed to reconnect to Redis Cloud:', error);
      }
    }, 5000);
  });

  // Ping Redis mỗi 30 giây để giữ kết nối
  setInterval(async () => {
    try {
      if (redisClient.isOpen) {
        const result = await redisClient.ping();
        console.log('Redis Cloud ping:', result);
      } else {
        console.log('Redis Cloud connection closed. Attempting to reconnect...');
        try {
          await redisClient.connect();
        } catch (error) {
          console.error('Failed to reconnect to Redis Cloud:', error);
        }
      }
    } catch (error) {
      console.error('Error pinging Redis Cloud:', error);
    }
  }, 30000);
};

module.exports = { monitorRedisConnection };