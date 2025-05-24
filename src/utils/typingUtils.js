const { redisClient, setexAsync, getAsync, delAsync, keysAsync } = require('../config/redisConfig');

// Tăng thời gian typing lên 5 giây để phù hợp với môi trường cloud
const TYPING_EXPIRATION = 5;

/**
 * Lưu trạng thái typing vào Redis Cloud
 */
const setTypingStatus = async (userId, conversationId, username) => {
  try {
    // Key format: typing:<conversationId>:<userId>
    const key = `typing:${conversationId}:${userId}`;
    await setexAsync(key, TYPING_EXPIRATION, JSON.stringify({ userId, username }));
    return true;
  } catch (error) {
    console.error('Redis Cloud - Error saving typing status:', error);
    return false;
  }
};

/**
 * Xóa trạng thái typing từ Redis Cloud
 */
const removeTypingStatus = async (userId, conversationId) => {
  try {
    const key = `typing:${conversationId}:${userId}`;
    await delAsync(key);
    return true;
  } catch (error) {
    console.error('Redis Cloud - Error removing typing status:', error);
    return false;
  }
};

/**
 * Lấy danh sách người dùng đang typing từ Redis Cloud
 */
const getTypingUsers = async (conversationId) => {
  try {
    const pattern = `typing:${conversationId}:*`;
    const keys = await keysAsync(pattern);

    if (!keys || keys.length === 0) {
      return [];
    }

    // Lấy dữ liệu từ Redis Cloud cho tất cả keys
    const typingUsers = await Promise.all(
      keys.map(async (key) => {
        try {
          const data = await getAsync(key);
          return data ? JSON.parse(data) : null;
        } catch (err) {
          console.error(`Error parsing data for key ${key}:`, err);
          return null;
        }
      })
    );

    return typingUsers.filter(Boolean);
  } catch (error) {
    console.error('Redis Cloud - Error getting typing users:', error);
    return [];
  }
};

module.exports = {
  setTypingStatus,
  removeTypingStatus,
  getTypingUsers
};