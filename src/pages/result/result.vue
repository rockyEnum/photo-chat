<template>
  <view class="container">
    <!-- Preview Tabs -->
    <view class="preview-header">
      <view class="tab-group">
        <view
          class="tab-item"
          :class="{ active: previewMode === 'single' }"
          @click="switchMode('single')"
        >
          <text class="tab-icon">🖼️</text>
          <text>单张</text>
        </view>
        <view
          class="tab-item"
          :class="{ active: previewMode === 'layout' }"
          @click="switchMode('layout')"
          v-if="canLayout"
        >
          <text class="tab-icon">🖨️</text>
          <text>排版</text>
        </view>
      </view>
    </view>

    <!-- Preview Area -->
    <view class="preview-section">
      <!-- Single Preview -->
      <view class="single-preview" v-if="previewMode === 'single'">
        <view class="photo-wrapper">
          <image
            class="photo-image"
            :src="processedImage"
            mode="aspectFit"
            @click="previewSingle"
          />
        </view>
        <text class="preview-hint">点击预览大图</text>
      </view>

      <!-- Layout Preview -->
      <view class="layout-preview" v-else>
        <view class="canvas-wrapper">
          <canvas
            type="2d"
            id="layoutCanvas"
            class="layout-canvas"
            :style="{ width: layoutWidth + 'px', height: layoutHeight + 'px' }"
          ></canvas>
        </view>
        <text class="preview-hint">6寸相纸排版 ({{ layoutConfig.cols }}×{{ layoutConfig.rows }})</text>
      </view>
    </view>

    <!-- Info Card -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-icon">📋</text>
        <text class="info-title">照片信息</text>
      </view>

      <view class="info-list">
        <view class="info-item">
          <text class="info-label">尺寸规格</text>
          <view class="info-value-wrapper">
            <text class="info-value">{{ currentSize.name }}</text>
            <text class="info-subvalue">{{ currentSize.pxSize }}px</text>
          </view>
        </view>
        <view class="divider"></view>

        <view class="info-item">
          <text class="info-label">毫米尺寸</text>
          <text class="info-value">{{ currentSize.mmSize }}</text>
        </view>
        <view class="divider"></view>

        <view class="info-item">
          <text class="info-label">背景颜色</text>
          <view class="color-value">
            <view class="color-dot" :style="{ background: bgColor }"></view>
            <text>{{ getColorName(bgColor) }}</text>
          </view>
        </view>
        <view class="divider"></view>

        <view class="info-item">
          <text class="info-label">分辨率</text>
          <text class="info-value highlight">{{ currentSize.dpi }} DPI</text>
        </view>
      </view>
    </view>

    <!-- Tips -->
    <view class="tips-card">
      <view class="tips-header">
        <text class="tips-icon">💡</text>
        <text class="tips-title">温馨提示</text>
      </view>
      <view class="tips-list">
        <text class="tip-item">• 保存的证件照可直接用于网上申请</text>
        <text class="tip-item">• 排版照片适合到照相馆打印</text>
        <text class="tip-item">• 如需冲印实体照片，建议选择专业相纸</text>
      </view>
    </view>

    <!-- Bottom Actions -->
    <view class="footer-bar safe-area-bottom">
      <button class="btn-secondary" @click="reedit">
        <text class="btn-icon">✏️</text>
        <text>重新编辑</text>
      </button>
      <button class="btn-accent" @click="savePhoto">
        <text class="btn-icon">💾</text>
        <text>保存照片</text>
      </button>
    </view>

    <!-- Save Modal -->
    <view class="modal-overlay" v-if="showSaveModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择保存方式</text>
          <text class="modal-close" @click="closeModal">✕</text>
        </view>

        <view class="modal-body">
          <view class="save-option" @click="saveSingle">
            <view class="option-icon">🖼️</view>
            <view class="option-info">
              <text class="option-title">保存单张</text>
              <text class="option-desc">电子版证件照，适合在线使用</text>
            </view>
            <text class="option-arrow">›</text>
          </view>

          <view class="save-option" @click="saveLayout" v-if="canLayout">
            <view class="option-icon">🖨️</view>
            <view class="option-info">
              <text class="option-title">保存排版</text>
              <text class="option-desc">6寸相纸排版，适合打印冲印</text>
            </view>
            <text class="option-arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReady } from '@dcloudio/uni-app';
import { BACKGROUND_COLORS, LAYOUT_CONFIG } from '@/utils/constants';
import { checkSaveAuth } from '@/utils/auth';
import { addHistory } from '@/utils/history';

const processedImage = ref('');
const currentSize = ref<any>({});
const bgColor = ref('#FFFFFF');
const previewMode = ref<'single' | 'layout'>('single');
const beautySettings = ref<any>(null);

// Layout
const layoutWidth = ref(300);
const layoutHeight = ref(450);
const layoutConfig = ref<any>({ cols: 1, rows: 1 });
const canLayout = ref(false);

const showSaveModal = ref(false);

let layoutCanvas: any = null;
let layoutImagePath = '';

onLoad((options) => {
  if (options?.image) {
    processedImage.value = decodeURIComponent(options.image);
  }
  if (options?.size) {
    currentSize.value = JSON.parse(decodeURIComponent(options.size));
    const config = LAYOUT_CONFIG[currentSize.value.id as keyof typeof LAYOUT_CONFIG];
    if (config) {
      layoutConfig.value = config;
      canLayout.value = true;
      layoutWidth.value = config.paperWidth / 4;
      layoutHeight.value = config.paperHeight / 4;
    }
  }
  if (options?.bg) {
    bgColor.value = options.bg;
  }
  if (options?.beauty) {
    try {
      beautySettings.value = JSON.parse(decodeURIComponent(options.beauty));
    } catch (e) {
      console.error('解析美颜设置失败:', e);
    }
  }
});

onReady(() => {
  if (canLayout.value) {
    setTimeout(() => {
      initLayoutCanvas();
    }, 100);
  }
});

// Initialize layout canvas
const initLayoutCanvas = () => {
  const query = uni.createSelectorQuery();
  query.select('#layoutCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res[0]?.node) {
        layoutCanvas = res[0].node;
        const ctx = layoutCanvas.getContext('2d');
        const config = layoutConfig.value;
        layoutCanvas.width = config.paperWidth;
        layoutCanvas.height = config.paperHeight;
        drawLayout(ctx, config);
      }
    });
};

// Draw layout
const drawLayout = (ctx: any, config: any) => {
  const { cols, rows, paperWidth, paperHeight, gap } = config;
  const photoW = currentSize.value.width;
  const photoH = currentSize.value.height;

  const totalWidth = cols * photoW + (cols - 1) * gap;
  const totalHeight = rows * photoH + (rows - 1) * gap;
  const marginX = (paperWidth - totalWidth) / 2;
  const marginY = (paperHeight - totalHeight) / 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, paperWidth, paperHeight);

  const img = layoutCanvas.createImage();
  img.onload = () => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = marginX + col * (photoW + gap);
        const y = marginY + row * (photoH + gap);
        ctx.drawImage(img, x, y, photoW, photoH);
      }
    }
    setTimeout(() => {
      exportLayoutImage();
    }, 100);
  };
  img.src = processedImage.value;
};

// Export layout image
const exportLayoutImage = () => {
  if (!layoutCanvas) return;
  uni.canvasToTempFilePath({
    canvas: layoutCanvas,
    success: (res) => {
      layoutImagePath = res.tempFilePath;
    },
    fail: (err) => {
      console.error('导出排版失败:', err);
    }
  });
};

// Switch preview mode
const switchMode = (mode: 'single' | 'layout') => {
  previewMode.value = mode;
};

// Get color name
const getColorName = (color: string) => {
  const found = BACKGROUND_COLORS.find(c => c.color === color);
  return found ? found.name : '自定义';
};

// Preview single
const previewSingle = () => {
  uni.previewImage({
    urls: [processedImage.value],
    current: processedImage.value
  });
};

// Re-edit
const reedit = () => {
  uni.navigateBack();
};

// Save photo
const savePhoto = async () => {
  const hasAuth = await checkSaveAuth();
  if (!hasAuth) return;
  showSaveModal.value = true;
};

// Save single
const saveSingle = () => {
  uni.saveImageToPhotosAlbum({
    filePath: processedImage.value,
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showSaveModal.value = false;
      saveRecentRecord();
    },
    fail: (err) => {
      console.error('保存失败:', err);
      uni.showToast({ title: '保存失败', icon: 'none' });
    }
  });
};

// Save layout
const saveLayout = () => {
  if (!layoutImagePath) {
    uni.showToast({ title: '排版生成中，请稍候', icon: 'none' });
    return;
  }
  uni.saveImageToPhotosAlbum({
    filePath: layoutImagePath,
    success: () => {
      uni.showToast({ title: '排版保存成功', icon: 'success' });
      showSaveModal.value = false;
    },
    fail: (err) => {
      console.error('保存失败:', err);
      uni.showToast({ title: '保存失败', icon: 'none' });
    }
  });
};

// Close modal
const closeModal = () => {
  showSaveModal.value = false;
};

// Save history record
const saveRecentRecord = () => {
  const colorName = getColorName(bgColor.value);

  addHistory({
    sizeId: currentSize.value.id,
    sizeName: currentSize.value.name,
    mmSize: currentSize.value.mmSize,
    pxSize: currentSize.value.pxSize,
    bgColor: bgColor.value,
    bgColorName: colorName,
    imagePath: processedImage.value,
    thumbPath: processedImage.value,
    beauty: beautySettings.value || undefined
  });
};

// Format time
const formatTime = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 160rpx;
}

.preview-header {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  padding: 30rpx;
  padding-bottom: 60rpx;
}

.tab-group {
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999rpx;
  padding: 6rpx;
}

.tab-group .tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 9999rpx;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-group .tab-item .tab-icon {
  font-size: 28rpx;
}

.tab-group .tab-item.active {
  background: var(--bg-card);
  color: var(--primary-600);
  font-weight: 600;
}

.preview-section {
  margin-top: -40rpx;
  padding: 0 24rpx;
}

.preview-section .single-preview {
  background: var(--bg-card);
  border-radius: 28rpx;
  padding: 36rpx;
  box-shadow: var(--shadow-lg);
}

.preview-section .single-preview .photo-wrapper {
  background: var(--neutral-100);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
}

.preview-section .single-preview .photo-image {
  max-width: 300rpx;
  max-height: 400rpx;
  border-radius: 12rpx;
  box-shadow: var(--shadow-md);
}

.preview-section .single-preview .preview-hint {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.preview-section .layout-preview {
  background: var(--bg-card);
  border-radius: 28rpx;
  padding: 36rpx;
  box-shadow: var(--shadow-lg);
}

.preview-section .layout-preview .canvas-wrapper {
  background: var(--neutral-100);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.preview-section .layout-preview .layout-canvas {
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.preview-section .layout-preview .preview-hint {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.info-card {
  margin: 30rpx;
  background: var(--bg-card);
  border-radius: 28rpx;
  padding: 30rpx;
  box-shadow: var(--shadow-sm);
}

.info-card .info-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid var(--border-light);
}

.info-card .info-header .info-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.info-card .info-header .info-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.info-card .info-list .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.info-card .info-list .info-item .info-label {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.info-card .info-list .info-item .info-value-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-card .info-list .info-item .info-value-wrapper .info-value {
  font-size: 26rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.info-card .info-list .info-item .info-value-wrapper .info-subvalue {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.info-card .info-list .info-item .info-value {
  font-size: 26rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.info-card .info-list .info-item .info-value.highlight {
  color: var(--accent-600);
}

.info-card .info-list .info-item .color-value {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: var(--text-primary);
}

.info-card .info-list .info-item .color-value .color-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 9999rpx;
  border: 2rpx solid var(--border-light);
}

.info-card .info-list .divider {
  height: 2rpx;
  background: var(--border-light);
}

.tips-card {
  margin: 0 30rpx 30rpx;
  background: linear-gradient(135deg, var(--accent-50) 0%, var(--primary-50) 100%);
  border-radius: 28rpx;
  padding: 30rpx;
  border: 2rpx solid var(--accent-100);
}

.tips-card .tips-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.tips-card .tips-header .tips-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.tips-card .tips-header .tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.tips-card .tips-list .tip-item {
  display: block;
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
  line-height: 1.6;
}

.tips-card .tips-list .tip-item:last-child {
  margin-bottom: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.footer-bar button .btn-icon {
  font-size: 28rpx;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay .modal-content {
  width: 100%;
  background: var(--bg-card);
  border-radius: 28rpx 28rpx 0 0;
  padding: 30rpx;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-overlay .modal-content .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-overlay .modal-content .modal-header .modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-overlay .modal-content .modal-header .modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: var(--text-tertiary);
  background: var(--neutral-100);
  border-radius: 9999rpx;
}

.modal-overlay .modal-content .modal-header .modal-close:active {
  background: var(--neutral-200);
}

.modal-overlay .modal-content .save-option {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: var(--bg-elevated);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-overlay .modal-content .save-option:active {
  transform: scale(0.98);
  background: var(--primary-50);
}

.modal-overlay .modal-content .save-option .option-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.modal-overlay .modal-content .save-option .option-info {
  flex: 1;
}

.modal-overlay .modal-content .save-option .option-info .option-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.modal-overlay .modal-content .save-option .option-info .option-desc {
  display: block;
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.modal-overlay .modal-content .save-option .option-arrow {
  font-size: 36rpx;
  color: var(--text-tertiary);
}
</style>
