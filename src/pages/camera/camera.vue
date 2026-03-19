<template>
  <view class="container">
    <!-- Header Info -->
    <view class="size-header">
      <view class="size-badge">
        <text class="size-name">{{ currentSize.name }}</text>
        <text class="size-detail">{{ currentSize.mmSize }} · {{ currentSize.pxSize }}px</text>
      </view>
      <text class="size-desc">{{ currentSize.desc }}</text>
    </view>

    <!-- Photo Preview Area -->
    <view class="preview-card">
      <view v-if="!tempImage" class="empty-state">
        <view class="upload-icon">
          <text class="icon-text">📷</text>
        </view>
        <text class="empty-text">请选择或拍摄照片</text>
        <text class="empty-hint">建议正面拍摄，光线充足</text>
      </view>
      <image
        v-else
        class="preview-image"
        :src="tempImage"
        mode="aspectFit"
        @click="previewImage"
      />

      <!-- Retake Button -->
      <view v-if="tempImage" class="retake-btn" @click="retakePhoto">
        <text>重新选择</text>
      </view>
    </view>

    <!-- Action Buttons -->
    <view class="action-section" v-if="!tempImage">
      <view class="action-row">
        <view class="action-btn btn-camera" @click="openCamera">
          <view class="btn-icon-wrapper">
            <text class="btn-icon">📷</text>
          </view>
          <text class="btn-label">拍照</text>
          <text class="btn-sublabel">使用前置摄像头</text>
        </view>
        <view class="action-btn btn-album" @click="chooseFromAlbum">
          <view class="btn-icon-wrapper">
            <text class="btn-icon">🖼️</text>
          </view>
          <text class="btn-label">相册</text>
          <text class="btn-sublabel">从相册选择</text>
        </view>
      </view>
    </view>

    <!-- Photo Tips -->
    <view class="tips-card" v-if="!tempImage">
      <view class="tips-title">
        <text class="tips-icon">💡</text>
        <text>拍照要求</text>
      </view>
      <view class="tips-grid">
        <view class="tip-item">
          <text class="tip-check">✓</text>
          <text>正面免冠，露出双耳</text>
        </view>
        <view class="tip-item">
          <text class="tip-check">✓</text>
          <text>光线均匀，避免阴影</text>
        </view>
        <view class="tip-item">
          <text class="tip-check">✓</text>
          <text>背景纯色，避免复杂</text>
        </view>
        <view class="tip-item">
          <text class="tip-check">✓</text>
          <text>表情自然，双眼平视</text>
        </view>
      </view>
    </view>

    <!-- Footer Action -->
    <view class="footer-bar safe-area-bottom" v-if="tempImage">
      <button class="btn-primary btn-xl" @click="goToEdit">
        下一步：编辑照片
      </button>
    </view>

    <!-- Custom Camera Fullscreen Overlay -->
    <view v-if="isCameraOpen" class="camera-fullscreen">
      <camera
        :device-position="devicePosition"
        flash="off"
        class="camera-view"
        @error="onCameraError"
      >
        <cover-view class="camera-overlay">
          <cover-view class="face-frame"></cover-view>
          <cover-view class="camera-tips">请将人脸对准虚线框内</cover-view>
        </cover-view>

        <cover-view class="camera-bottom-bar safe-area-bottom">
          <cover-view class="camera-btn-text" @click="closeCamera">取消</cover-view>
          <cover-view class="capture-btn-outer" @click="doTakePhoto">
            <cover-view class="capture-btn-inner"></cover-view>
          </cover-view>
          <cover-view class="camera-btn-text" @click="switchCamera">翻转</cover-view>
        </cover-view>
      </camera>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { checkCameraAuth, checkAlbumAuth } from '@/utils/auth';

const currentSize = ref<any>({});
const tempImage = ref('');
const isCameraOpen = ref(false);
const devicePosition = ref('front');

onLoad((options) => {
  if (options?.size) {
    currentSize.value = JSON.parse(decodeURIComponent(options.size));
  }
});

// 打开自定义相机
const openCamera = async () => {
  const hasAuth = await checkCameraAuth();
  if (!hasAuth) return;
  isCameraOpen.value = true;
};

// 关闭相机
const closeCamera = () => {
  isCameraOpen.value = false;
};

// 切换前后摄像头
const switchCamera = () => {
  devicePosition.value = devicePosition.value === 'front' ? 'back' : 'front';
};

// 执行拍照
const doTakePhoto = () => {
  const ctx = uni.createCameraContext();
  ctx.takePhoto({
    quality: 'high',
    success: (res) => {
      isCameraOpen.value = false;
      processImage(res.tempImagePath);
    },
    fail: (err) => {
      console.error('拍照失败:', err);
      uni.showToast({ title: '拍照失败', icon: 'none' });
    }
  });
};

// 相机错误回调
const onCameraError = (e: any) => {
  console.error('相机启动失败:', e);
  uni.showToast({ title: '无法访问相机，请检查权限', icon: 'none' });
  isCameraOpen.value = false;
};

// 从相册选择
const chooseFromAlbum = async () => {
  const hasAuth = await checkAlbumAuth();
  if (!hasAuth) return;

  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album'],
    success: (res: any) => {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      processImage(tempFilePath);
    },
    fail: (err) => {
      console.error('选择图片失败:', err);
    }
  });
};

// 图片预处理
const processImage = (filePath: string) => {
  uni.showLoading({ title: '处理中...' });

  uni.compressImage({
    src: filePath,
    quality: 85,
    success: (res) => {
      tempImage.value = res.tempFilePath;
      uni.hideLoading();
    },
    fail: () => {
      tempImage.value = filePath;
      uni.hideLoading();
    }
  });
};

// 重新拍照
const retakePhoto = () => {
  uni.showModal({
    title: '重新选择',
    content: '确定要重新选择照片吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        tempImage.value = '';
      }
    }
  });
};

// 预览图片
const previewImage = () => {
  if (!tempImage.value) return;
  uni.previewImage({
    urls: [tempImage.value],
    current: tempImage.value
  });
};

// 前往编辑页面
const goToEdit = () => {
  if (!tempImage.value) {
    uni.showToast({ title: '请先选择照片', icon: 'none' });
    return;
  }

  uni.navigateTo({
    url: `/pages/edit/edit?image=${encodeURIComponent(tempImage.value)}&size=${encodeURIComponent(JSON.stringify(currentSize.value))}`
  });
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 180rpx;
}

.size-header {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  padding: 30rpx;
  padding-bottom: 36rpx;
}

.size-header .size-badge {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
  display: inline-flex;
  flex-direction: column;
  margin-bottom: 16rpx;
}

.size-header .size-badge .size-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-inverse);
}

.size-header .size-badge .size-detail {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.size-header .size-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.preview-card {
  margin: -30rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 32rpx;
  min-height: 520rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 20rpx 60rpx rgba(8, 145, 178, 0.15);
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}

.preview-card .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
}

.preview-card .empty-state .upload-icon {
  width: 160rpx;
  height: 160rpx;
  background: var(--primary-50);
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.preview-card .empty-state .upload-icon .icon-text {
  font-size: 72rpx;
}

.preview-card .empty-state .empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
}

.preview-card .empty-state .empty-hint {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.preview-card .preview-image {
  width: 100%;
  height: 500rpx;
  border-radius: 28rpx;
}

.preview-card .retake-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: rgba(0, 0, 0, 0.6);
  color: var(--text-inverse);
  padding: 14rpx 24rpx;
  border-radius: 9999rpx;
  font-size: 24rpx;
  font-weight: 500;
  backdrop-filter: blur(12rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.preview-card .retake-btn:active {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(0.95);
}

.action-section {
  margin: 30rpx;
}

.action-section .action-row {
  display: flex;
  gap: 24rpx;
}

.action-section .action-btn {
  flex: 1;
  background: var(--bg-card);
  border-radius: 28rpx;
  padding: 36rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
  cursor: pointer;
  border: 1rpx solid rgba(0, 0, 0, 0.03);
}

.action-section .action-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.action-section .action-btn .btn-icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.action-section .action-btn .btn-icon-wrapper .btn-icon {
  font-size: 48rpx;
}

.action-section .action-btn .btn-label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.action-section .action-btn .btn-sublabel {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.action-section .action-btn.btn-camera .btn-icon-wrapper {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
}

.action-section .action-btn.btn-album .btn-icon-wrapper {
  background: linear-gradient(135deg, var(--accent-100) 0%, var(--accent-50) 100%);
}

.tips-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: var(--shadow-md);
}

.tips-card .tips-title {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
}

.tips-card .tips-title .tips-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.tips-card .tips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.tips-card .tips-grid .tip-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.tips-card .tips-grid .tip-item .tip-check {
  width: 32rpx;
  height: 32rpx;
  background: var(--accent-100);
  color: var(--accent-600);
  border-radius: 9999rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  font-weight: 700;
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

.btn-primary {
  background: linear-gradient(135deg, #0891B2 0%, #0E7490 100%) !important;
  color: #FFFFFF !important;
  border: none;
  border-radius: 9999rpx;
  font-size: 30rpx;
  font-weight: 600;
  height: 92rpx;
  line-height: 92rpx;
  width: 100%;
  box-shadow: 0 8rpx 24rpx rgba(8, 145, 178, 0.3);
}

.btn-primary:active {
  background: linear-gradient(135deg, #0E7490 0%, #0891B2 100%) !important;
}

/* Custom Camera Styles */
.camera-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: #000;
}

.camera-view {
  width: 100vw;
  height: 100vh;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.face-frame {
  width: 440rpx;
  height: 580rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 220rpx; /* Creates a capsule shape */
  box-sizing: border-box;
}

.camera-tips {
  margin-top: 60rpx;
  color: #fff;
  font-size: 28rpx;
  background: rgba(0, 0, 0, 0.5);
  padding: 16rpx 40rpx;
  border-radius: 999rpx;
}

.camera-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 240rpx;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  pointer-events: auto;
}

.camera-btn-text {
  color: #fff;
  font-size: 32rpx;
  padding: 20rpx 40rpx;
}

.capture-btn-outer {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.capture-btn-inner {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: #fff;
}
</style>

