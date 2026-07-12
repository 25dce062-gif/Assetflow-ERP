// Helper to get from local storage
const getStorage = (collection) => {
  const data = localStorage.getItem(`assetflow_${collection}`);
  return data ? JSON.parse(data) : [];
};

// Helper to save to local storage
const setStorage = (collection, data) => {
  localStorage.setItem(`assetflow_${collection}`, JSON.stringify(data));
  // Dispatch custom event for subscriptions
  window.dispatchEvent(new CustomEvent(`storage_update_${collection}`, { detail: data }));
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const localStorageDB = {
  async getAll(collection) {
    return getStorage(collection);
  },

  async getById(collection, id) {
    const data = getStorage(collection);
    return data.find(item => item.id === id) || null;
  },

  async getWhere(collection, field, operator, value) {
    const data = getStorage(collection);
    return data.filter(item => {
      if (operator === '==') return item[field] === value;
      if (operator === '!=') return item[field] !== value;
      if (operator === '>') return item[field] > value;
      if (operator === '<') return item[field] < value;
      if (operator === '>=') return item[field] >= value;
      if (operator === '<=') return item[field] <= value;
      return false;
    });
  },

  async add(collection, item) {
    const data = getStorage(collection);
    const newItem = { id: generateId(), ...item };
    if (!newItem.createdAt) {
      newItem.createdAt = new Date().toISOString();
    }
    data.push(newItem);
    setStorage(collection, data);
    return newItem;
  },

  async set(collection, id, item) {
    const data = getStorage(collection);
    const index = data.findIndex(i => i.id === id);
    if (index >= 0) {
      data[index] = { ...item, id };
    } else {
      data.push({ ...item, id });
    }
    setStorage(collection, data);
    return { ...item, id };
  },

  async update(collection, id, updates) {
    const data = getStorage(collection);
    const index = data.findIndex(i => i.id === id);
    if (index >= 0) {
      data[index] = { ...data[index], ...updates };
      setStorage(collection, data);
      return data[index];
    }
    throw new Error('Document not found');
  },

  async delete(collection, id) {
    let data = getStorage(collection);
    data = data.filter(item => item.id !== id);
    setStorage(collection, data);
    return true;
  },

  subscribe(collection, callback) {
    const handleLocalUpdate = (e) => callback(e.detail);
    const handleStorageEvent = (e) => {
      if (e.key === `assetflow_${collection}` && e.newValue) {
        callback(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener(`storage_update_${collection}`, handleLocalUpdate);
    window.addEventListener('storage', handleStorageEvent);
    
    // Call initially
    callback(getStorage(collection));

    return () => {
      window.removeEventListener(`storage_update_${collection}`, handleLocalUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }
};
