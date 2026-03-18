<template>
  <view class="container">
    <!-- Header with Gradient -->
    <view class="header-gradient">
      <view class="header-top">
        <view class="header-title" style="font-size: 36rpx; font-weight: 700; color: #FFFFFF;">智能证件照</view>
        <view class="history-btn" @click="goHistory">
          <view class="history-icon-wrap">
            <text class="history-icon">⏱</text>
          </view>
          <text class="history-text">历史</text>
        </view>
      </view>
      <view class="header-subtitle">一键制作专业证件照</view>
    </view>

    <!-- Main Content -->
    <view class="content-wrapper">
      <!-- Size Selection -->
      <view class="section-title">选择尺寸规格</view>
      <view class="size-grid">
        <view
          v-for="size in sizeList"
          :key="size.id"
          class="size-card"
          :class="{ 'card-selected': selectedSize?.id === size.id }"
          @click="selectSize(size)"
        >
          <view class="size-name">{{ size.name }}</view>
          <view class="size-mm">{{ size.mmSize }}</view>
          <view class="size-px">{{ size.pxSize }}</view>
          <view class="badge-accent size-tag" v-if="size.isCommon">常用</view>
        </view>
      </view>

      <!-- Recent Records -->
      <view class="section-title" v-if="recentList.length > 0">最近使用</view>
      <view class="card" v-if="recentList.length > 0">
        <view
          v-for="(item, index) in recentList"
          :key="index"
          class="list-item"
          @click="quickStart(item)"
        >
          <image class="recent-thumb" :src="item.thumb" mode="aspectFill" />
          <view class="recent-info">
            <text class="recent-size">{{ item.sizeName }}</text>
            <text class="recent-time">{{ item.time }}</text>
          </view>
          <view class="arrow-icon">›</view>
        </view>
      </view>

      <!-- Instructions -->
      <view class="section-title">使用说明</view>
      <view class="card instruction-card">
        <view class="instruction-item">
          <view class="step-badge">1</view>
          <text class="instruction-text">选择需要的证件照尺寸规格</text>
        </view>
        <view class="instruction-item">
          <view class="step-badge">2</view>
          <text class="instruction-text">拍照或从相册上传正面照片</text>
        </view>
        <view class="instruction-item">
          <view class="step-badge">3</view>
          <text class="instruction-text">调整位置，选择背景颜色</text>
        </view>
        <view class="instruction-item">
          <view class="step-badge">4</view>
          <text class="instruction-text">预览并保存单张或排版照片</text>
        </view>
      </view>
    </view>

    <!-- Bottom Action -->
    <view class="footer-bar safe-area-bottom" v-if="selectedSize">
      <button class="btn-accent btn-xl" @click="startMaking">
        开始制作 {{ selectedSize.name }}
      </button>
    </view>

    <!-- Safe Area -->
    <view class="safe-area-bottom" v-else></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PHOTO_SIZES } from '@/utils/constants';
import { checkAuthStatus } from '@/utils/auth';

const sizeList = ref(PHOTO_SIZES);
const recentList = ref<any[]>([]);
const selectedSize = ref<any>(null);

onMounted(() => {
  // 检查权限状态
  checkAuthStatus();
  // 加载最近记录
  loadRecentRecords();
  // 默认选择一寸
  selectedSize.value = PHOTO_SIZES[0];
});

// 加载最近使用记录
const loadRecentRecords = () => {
  const records = uni.getStorageSync('recentPhotos') || [];
  recentList.value = records.slice(0, 5);
};

// 选择尺寸
const selectSize = (size: any) => {
  selectedSize.value = size;
};

// 开始制作
const startMaking = () => {
  if (!selectedSize.value) {
    uni.showToast({ title: '请先选择尺寸', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/camera/camera?size=${encodeURIComponent(JSON.stringify(selectedSize.value))}`
  });
};

// 快速开始（从最近记录）
const quickStart = (item: any) => {
  const size = PHOTO_SIZES.find(s => s.id === item.sizeId);
  if (size) {
    selectedSize.value = size;
    startMaking();
  }
};

// 前往历史记录页
const goHistory = () => {
  uni.navigateTo({
    url: '/pages/history/history'
  });
};
</script>

<style scoped>
.container {
  height: 100vh;
  background: #ECFEFF;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  padding: 0 24rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 1;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.header-top .history-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999rpx;
  backdrop-filter: blur(8rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.header-top .history-btn .history-icon-wrap {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-top .history-btn .history-icon {
  font-size: 28rpx;
  line-height: 1;
}

.header-top .history-btn .history-text {
  font-size: 24rpx;
  color: var(--text-inverse);
  font-weight: 500;
}

.header-top .history-btn:active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.95);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #164E63;
  margin: 20rpx 0 16rpx;
}

.section-header {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 36rpx;
  margin-bottom: 24rpx;
  padding-left: 20rpx;
  border-left: 6rpx solid var(--primary-500);
  letter-spacing: 1rpx;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  padding: 8rpx 4rpx;
}

.size-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  position: relative;
  cursor: pointer;
  border: 3rpx solid #E2E8F0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  min-height: 160rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.size-card.card-selected {
  border: 3rpx solid #0891B2;
  background: #FFFFFF;
  box-shadow: 0 4rpx 16rpx rgba(8, 145, 178, 0.2);
}

.size-card:active {
  transform: scale(0.96);
}

.size-card .size-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 16rpx;
  line-height: 1.2;
}

.size-card .size-mm {
  font-size: 24rpx;
  color: #64748B;
  margin-bottom: 8rpx;
  line-height: 1.3;
}

.size-card .size-px {
  font-size: 22rpx;
  color: #94A3B8;
  line-height: 1.3;
}

.size-card .size-tag {
  position: absolute;
  top: -12rpx;
  right: -8rpx;
  font-size: 18rpx;
  padding: 6rpx 16rpx;
  background: #22C55E;
  color: #FFFFFF;
  border-radius: 9999rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(34, 197, 94, 0.4);
  z-index: 10;
}

.recent-thumb {
  width: 80rpx;
  height: 100rpx;
  border-radius: 12rpx;
  background: var(--neutral-100);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.recent-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.recent-info .recent-size {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8rpx;
}

.recent-info .recent-time {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.arrow-icon {
  font-size: 28rpx;
  color: var(--text-tertiary);
}

.instruction-card .instruction-item {
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
  padding: 8rpx 0;
}

.instruction-card .instruction-item:last-child {
  margin-bottom: 0;
}

.instruction-card .instruction-item .step-badge {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: var(--text-inverse);
  border-radius: 9999rpx;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(8, 145, 178, 0.25);
}

.instruction-card .instruction-item .instruction-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 40rpx;
  background: #FFFFFF;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.btn-accent {
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%) !important;
  color: #FFFFFF !important;
  border: none;
  border-radius: 9999rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  width: 100%;
  box-shadow: 0 8rpx 24rpx rgba(34, 197, 94, 0.3);
}

.btn-accent:active {
  background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%) !important;
}
</style>
