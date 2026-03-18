<template>
  <view class="container">
    <!-- 统计卡片 -->
    <view class="stats-card" v-if="historyList.length > 0">
      <view class="stat-item">
        <text class="stat-num">{{ historyList.length }}</text>
        <text class="stat-label">总记录</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ uniqueSizes }}</text>
        <text class="stat-label">尺寸种类</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ todayCount }}</text>
        <text class="stat-label">今日制作</text>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-section" v-if="historyList.length > 0">
      <scroll-view class="filter-scroll" scroll-x>
        <view
          class="filter-item"
          :class="{ active: currentFilter === 'all' }"
          @click="setFilter('all')"
        >
          全部
        </view>
        <view
          v-for="size in availableSizes"
          :key="size.id"
          class="filter-item"
          :class="{ active: currentFilter === size.id }"
          @click="setFilter(size.id)"
        >
          {{ size.name }}
        </view>
      </scroll-view>
    </view>

    <!-- 历史列表 -->
    <view class="history-list" v-if="filteredList.length > 0">
      <view
        v-for="item in filteredList"
        :key="item.id"
        class="history-card"
        @click="previewItem(item)"
        @longpress="showActions(item)"
      >
        <image class="history-thumb" :src="item.thumbPath" mode="aspectFill" />

        <view class="history-info">
          <view class="info-row">
            <text class="size-name">{{ item.sizeName }}</text>
            <view class="color-tag" :style="{ background: item.bgColor }"></view>
          </view>

          <view class="info-row">
            <text class="size-detail">{{ item.mmSize }}</text>
            <text class="create-time">{{ item.createTimeStr }}</text>
          </view>

          <view class="beauty-tags" v-if="item.beauty">
            <text class="beauty-tag" v-if="item.beauty.smooth > 0">磨皮</text>
            <text class="beauty-tag" v-if="item.beauty.whiten > 0">美白</text>
            <text class="beauty-tag" v-if="item.beauty.ruddy > 0">红润</text>
          </view>
        </view>

        <view class="action-btns">
          <view class="action-btn reuse" @click.stop="reuseItem(item)">
            <text>使用</text>
          </view>
          <view class="action-btn delete" @click.stop="deleteItem(item)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="filteredList.length === 0">
      <text class="empty-icon">📷</text>
      <text class="empty-text">暂无历史记录</text>
      <text class="empty-hint">制作证件照后会自动保存到这里</text>
      <button class="btn-primary empty-btn" @click="goMake">去制作</button>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-bar safe-area-bottom" v-if="historyList.length > 0">
      <button class="btn-secondary" @click="clearAll">
        <text>清空记录</text>
      </button>
      <button class="btn-primary" @click="goMake">
        <text>制作新证件照</text>
      </button>
    </view>

    <!-- 确认弹窗 -->
    <view class="modal-overlay" v-if="showConfirmModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <text class="modal-title">确认删除</text>
        <text class="modal-desc">确定要删除这条历史记录吗？</text>
        <view class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-error" @click="confirmDelete">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  type HistoryItem
} from '@/utils/history';
import { PHOTO_SIZES } from '@/utils/constants';

const historyList = ref<HistoryItem[]>([]);
const currentFilter = ref('all');
const showConfirmModal = ref(false);
const itemToDelete = ref<HistoryItem | null>(null);

// 计算属性
const filteredList = computed(() => {
  if (currentFilter.value === 'all') {
    return historyList.value;
  }
  return historyList.value.filter(item => item.sizeId === currentFilter.value);
});

const availableSizes = computed(() => {
  const sizeIds = [...new Set(historyList.value.map(item => item.sizeId))];
  return sizeIds.map(id => PHOTO_SIZES.find(s => s.id === id)).filter(Boolean);
});

const uniqueSizes = computed(() => {
  return new Set(historyList.value.map(item => item.sizeId)).size;
});

const todayCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return historyList.value.filter(item => item.createTime >= today.getTime()).length;
});

onMounted(() => {
  loadHistory();
});

const loadHistory = () => {
  historyList.value = getHistory();
};

const setFilter = (filter: string) => {
  currentFilter.value = filter;
};

const previewItem = (item: HistoryItem) => {
  uni.previewImage({
    urls: [item.imagePath],
    current: item.imagePath
  });
};

const showActions = (item: HistoryItem) => {
  uni.showActionSheet({
    itemList: ['查看原图', '重新编辑', '删除记录'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          previewItem(item);
          break;
        case 1:
          reuseItem(item);
          break;
        case 2:
          itemToDelete.value = item;
          showConfirmModal.value = true;
          break;
      }
    }
  });
};

const reuseItem = (item: HistoryItem) => {
  // 跳转到结果页，使用历史记录的数据
  const size = PHOTO_SIZES.find(s => s.id === item.sizeId);
  if (size) {
    uni.navigateTo({
      url: `/pages/result/result?image=${encodeURIComponent(item.imagePath)}&size=${encodeURIComponent(JSON.stringify(size))}&bg=${item.bgColor}`
    });
  }
};

const deleteItem = (item: HistoryItem) => {
  itemToDelete.value = item;
  showConfirmModal.value = true;
};

const confirmDelete = () => {
  if (itemToDelete.value) {
    deleteHistoryItem(itemToDelete.value.id);
    loadHistory();
  }
  closeModal();
};

const closeModal = () => {
  showConfirmModal.value = false;
  itemToDelete.value = null;
};

const clearAll = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？此操作不可恢复。',
    confirmText: '清空',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        clearHistory();
        loadHistory();
        uni.showToast({ title: '已清空', icon: 'success' });
      }
    }
  });
};

const goMake = () => {
  uni.switchTab({
    url: '/pages/index/index'
  });
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 160rpx;
}

.stats-card {
  margin: 24rpx;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  border-radius: 28rpx;
  padding: 36rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stats-card .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-card .stat-item .stat-num {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--text-inverse);
}

.stats-card .stat-item .stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.stats-card .stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.2);
}

.filter-section {
  margin-bottom: 24rpx;
}

.filter-section .filter-scroll {
  white-space: nowrap;
  padding: 0 24rpx;
}

.filter-section .filter-scroll .filter-item {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
  background: var(--bg-card);
  border-radius: 9999rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
  border: 2rpx solid var(--border-light);
}

.filter-section .filter-scroll .filter-item.active {
  background: var(--primary-500);
  color: var(--text-inverse);
  border-color: var(--primary-500);
}

.history-list {
  padding: 0 24rpx;
}

.history-card {
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.history-card:active {
  transform: scale(0.995);
}

.history-card .history-thumb {
  width: 120rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: var(--neutral-100);
}

.history-card .history-info {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-card .history-info .info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-card .history-info .info-row .size-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.history-card .history-info .info-row .color-tag {
  width: 32rpx;
  height: 32rpx;
  border-radius: 9999rpx;
  border: 2rpx solid var(--border-light);
}

.history-card .history-info .info-row .size-detail {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.history-card .history-info .info-row .create-time {
  font-size: 20rpx;
  color: var(--text-tertiary);
}

.history-card .history-info .beauty-tags {
  display: flex;
  gap: 12rpx;
}

.history-card .history-info .beauty-tags .beauty-tag {
  font-size: 20rpx;
  padding: 8rpx 12rpx;
  background: var(--accent-100);
  color: var(--accent-600);
  border-radius: 9999rpx;
}

.history-card .action-btns {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-left: 20rpx;
}

.history-card .action-btns .action-btn {
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  text-align: center;
}

.history-card .action-btns .action-btn.reuse {
  background: var(--primary-50);
  color: var(--primary-600);
}

.history-card .action-btns .action-btn.delete {
  background: var(--neutral-100);
  color: var(--text-tertiary);
}

.history-card .action-btns .action-btn:active {
  opacity: 0.7;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72rpx 36rpx;
}

.empty-state .empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-state .empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.empty-state .empty-hint {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-bottom: 36rpx;
}

.empty-state .empty-btn {
  padding: 24rpx 48rpx;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 30rpx;
  background: var(--bg-card);
  display: flex;
  gap: 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.footer-bar button {
  flex: 1;
  height: 88rpx;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay .modal-content {
  width: 80%;
  max-width: 600rpx;
  background: var(--bg-card);
  border-radius: 28rpx;
  padding: 36rpx;
}

.modal-overlay .modal-content .modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-overlay .modal-content .modal-desc {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 36rpx;
}

.modal-overlay .modal-content .modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-overlay .modal-content .modal-actions button {
  flex: 1;
  height: 80rpx;
}

.modal-overlay .modal-content .modal-actions .btn-error {
  background: var(--error);
  color: var(--text-inverse);
  border-radius: 9999rpx;
  font-size: 26rpx;
  font-weight: 500;
}
</style>
