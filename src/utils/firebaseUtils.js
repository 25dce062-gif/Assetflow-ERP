import { localStorageDB } from '../services/localStorageDB';

export const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please check your database connection or Firebase configuration.')), ms)
    )
  ]);
};

export const logActivity = async (currentUser, module, action, details = '') => {
  if (!currentUser) return;
  try {
    const userName = currentUser.name || currentUser.displayName || 'Unknown';
    await localStorageDB.add('activityLogs', {
      user: userName,
      uid: currentUser.uid,
      role: currentUser.role || 'Unknown',
      module,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const createNotification = async (targetUid, title, message, type = 'info') => {
  try {
    await localStorageDB.add('notifications', {
      targetUid,
      title,
      message,
      type, // info, success, warning, error
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
