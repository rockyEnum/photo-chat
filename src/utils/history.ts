// 历史记录管理工具

const HISTORY_KEY = 'id_photo_history';
const MAX_HISTORY_COUNT = 50;

export interface HistoryItem {
  id: string;
  sizeId: string;
  sizeName: string;
  mmSize: string;
  pxSize: string;
  bgColor: string;
  bgColorName: string;
  imagePath: string;
  thumbPath: string;
  createTime: number;
  createTimeStr: string;
  beauty?: {
    smooth: number;
    whiten: number;
    ruddy: number;
  };
}

/**
 * 添加历史记录
 */
export const addHistory = (item: Omit<HistoryItem, 'id' | 'createTime' | 'createTimeStr'>): HistoryItem => {
  const history = getHistory();

  const newItem: HistoryItem = {
    ...item,
    id: generateId(),
    createTime: Date.now(),
    createTimeStr: formatDateTime(new Date())
  };

  // 去重：如果相同尺寸和背景色的记录已存在，先删除旧的
  const filtered = history.filter(h =>
    !(h.sizeId === item.sizeId && h.bgColor === item.bgColor &&
      Math.abs(h.createTime - newItem.createTime) < 60000) // 1分钟内的重复
  );

  // 添加到开头
  filtered.unshift(newItem);

  // 限制数量
  const limited = filtered.slice(0, MAX_HISTORY_COUNT);

  // 保存
  uni.setStorageSync(HISTORY_KEY, limited);

  return newItem;
};

/**
 * 获取历史记录
 */
export const getHistory = (): HistoryItem[] => {
  try {
    return uni.getStorageSync(HISTORY_KEY) || [];
  } catch (e) {
    console.error('获取历史记录失败:', e);
    return [];
  }
};

/**
 * 删除单条历史记录
 */
export const deleteHistoryItem = (id: string): boolean => {
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    uni.setStorageSync(HISTORY_KEY, filtered);
    return true;
  } catch (e) {
    console.error('删除历史记录失败:', e);
    return false;
  }
};

/**
 * 清空历史记录
 */
export const clearHistory = (): boolean => {
  try {
    uni.setStorageSync(HISTORY_KEY, []);
    return true;
  } catch (e) {
    console.error('清空历史记录失败:', e);
    return false;
  }
};

/**
 * 根据ID获取历史记录
 */
export const getHistoryById = (id: string): HistoryItem | null => {
  const history = getHistory();
  return history.find(h => h.id === id) || null;
};

/**
 * 获取最近N条记录
 */
export const getRecentHistory = (count: number = 5): HistoryItem[] => {
  const history = getHistory();
  return history.slice(0, count);
};

/**
 * 按尺寸筛选历史记录
 */
export const getHistoryBySize = (sizeId: string): HistoryItem[] => {
  const history = getHistory();
  return history.filter(h => h.sizeId === sizeId);
};

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 格式化日期时间
 */
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export default {
  addHistory,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  getHistoryById,
  getRecentHistory,
  getHistoryBySize
};
