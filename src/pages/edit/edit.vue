<template>
  <view class="container">
    <!-- Preview Section -->
    <view class="preview-section">
      <view class="canvas-wrapper">
        <canvas
          type="2d"
          id="photoCanvas"
          class="photo-canvas"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        ></canvas>

        <!-- Face Guide -->
        <view class="face-guide" v-if="!processing">
          <view class="guide-frame"></view>
          <text class="guide-text">人脸居中，头部占画面2/3</text>
        </view>
      </view>

      <!-- Loading Overlay -->
      <view class="loading-overlay" v-if="processing">
        <view class="spinner"></view>
        <text class="loading-text">{{ processingText }}</text>
      </view>
    </view>

    <!-- Controls Section -->
    <scroll-view class="controls-section" scroll-y>
      <!-- Background Color -->
      <view class="control-group">
        <view class="control-label">
          <text class="label-icon">🎨</text>
          <text>背景颜色</text>
        </view>
        <view class="color-list">
          <view
            v-for="color in bgColors"
            :key="color.id"
            class="color-item"
            :class="{ active: selectedColor === color.color }"
            @click="selectColor(color)"
          >
            <view
              class="color-circle"
              :style="{ background: color.color, borderColor: selectedColor === color.color ? color.color : '#e2e8f0' }"
            ></view>
            <text class="color-name">{{ color.name }}</text>
            <view class="badge-primary popular-tag" v-if="color.isCommon">常用</view>
          </view>
        </view>
      </view>

      <!-- Beauty Controls -->
      <view class="control-group">
        <view class="control-label">
          <text class="label-icon">✨</text>
          <text>美颜调整</text>
        </view>

        <view class="beauty-presets">
          <view
            class="preset-item"
            :class="{ active: beautyPreset === 'none' }"
            @click="setBeautyPreset('none')"
          >
            <text>原图</text>
          </view>
          <view
            class="preset-item"
            :class="{ active: beautyPreset === 'natural' }"
            @click="setBeautyPreset('natural')"
          >
            <text>自然</text>
          </view>
          <view
            class="preset-item"
            :class="{ active: beautyPreset === 'light' }"
            @click="setBeautyPreset('light')"
          >
            <text>轻度</text>
          </view>
          <view
            class="preset-item"
            :class="{ active: beautyPreset === 'medium' }"
            @click="setBeautyPreset('medium')"
          >
            <text>中度</text>
          </view>
        </view>

        <view class="slider-control" v-if="beauty.smooth > 0">
          <view class="slider-header">
            <text class="slider-label">磨皮</text>
            <text class="slider-value">{{ beauty.smooth }}</text>
          </view>
          <slider
            class="custom-slider"
            :value="beauty.smooth"
            min="0"
            max="100"
            activeColor="#0891B2"
            backgroundColor="#E2E8F0"
            block-size="20"
            @change="onSmoothChange"
          />
        </view>

        <view class="slider-control" v-if="beauty.whiten > 0">
          <view class="slider-header">
            <text class="slider-label">美白</text>
            <text class="slider-value">{{ beauty.whiten }}</text>
          </view>
          <slider
            class="custom-slider"
            :value="beauty.whiten"
            min="0"
            max="100"
            activeColor="#0891B2"
            backgroundColor="#E2E8F0"
            block-size="20"
            @change="onWhitenChange"
          />
        </view>

        <view class="slider-control" v-if="beauty.ruddy > 0">
          <view class="slider-header">
            <text class="slider-label">红润</text>
            <text class="slider-value">{{ beauty.ruddy }}</text>
          </view>
          <slider
            class="custom-slider"
            :value="beauty.ruddy"
            min="0"
            max="100"
            activeColor="#0891B2"
            backgroundColor="#E2E8F0"
            block-size="20"
            @change="onRuddyChange"
          />
        </view>
      </view>

      <!-- Adjustments -->
      <view class="control-group">
        <view class="control-label">
          <text class="label-icon">⚙️</text>
          <text>位置调整</text>
        </view>

        <view class="slider-control">
          <view class="slider-header">
            <text class="slider-label">缩放</text>
            <text class="slider-value">{{ scale }}%</text>
          </view>
          <slider
            class="custom-slider"
            :value="scale"
            min="50"
            max="150"
            activeColor="#0891B2"
            backgroundColor="#E2E8F0"
            block-size="20"
            @change="onScaleChange"
          />
        </view>

        <view class="slider-control">
          <view class="slider-header">
            <text class="slider-label">垂直位置</text>
            <text class="slider-value">{{ offsetY > 0 ? '+' : '' }}{{ offsetY }}</text>
          </view>
          <slider
            class="custom-slider"
            :value="offsetY"
            min="-50"
            max="50"
            activeColor="#0891B2"
            backgroundColor="#E2E8F0"
            block-size="20"
            @change="onOffsetYChange"
          />
        </view>
      </view>

      <!-- Quick Actions -->
      <view class="quick-actions">
        <button class="btn-ghost" @click="reset">
          <text class="action-icon">↺</text>
          <text>重置</text>
        </button>
      </view>

      <!-- Bottom Padding -->
      <view style="height: 160rpx;"></view>
    </scroll-view>

    <!-- Footer -->
    <view class="footer-bar safe-area-bottom">
      <button class="btn-primary btn-xl" @click="generatePhoto">
        <text class="btn-icon">✓</text>
        <text>生成证件照</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReady } from '@dcloudio/uni-app';
import { BACKGROUND_COLORS } from '@/utils/constants';
import { segmentPortrait } from '@/utils/baiduAI';
import { applyBeauty } from '@/utils/imageProcessor';

const bgColors = ref(BACKGROUND_COLORS);
const selectedColor = ref('#FFFFFF');
const processing = ref(false);
const processingText = ref('处理中...');

// Image params
const originalImage = ref('');
const currentSize = ref<any>({});
const scale = ref(100);
const offsetY = ref(0);

// Beauty settings
const beauty = ref({
  smooth: 0,
  whiten: 0,
  ruddy: 0
});
const beautyPreset = ref('none');

// Beauty presets
const beautyPresets = {
  none: { smooth: 0, whiten: 0, ruddy: 0 },
  natural: { smooth: 20, whiten: 15, ruddy: 10 },
  light: { smooth: 40, whiten: 30, ruddy: 20 },
  medium: { smooth: 60, whiten: 45, ruddy: 30 }
};

// Canvas
const canvasWidth = ref(300);
const canvasHeight = ref(400);
let canvasCtx: any = null;

onLoad((options) => {
  if (options?.image) {
    originalImage.value = decodeURIComponent(options.image);
  }
  if (options?.size) {
    currentSize.value = JSON.parse(decodeURIComponent(options.size));
    canvasWidth.value = currentSize.value.width;
    canvasHeight.value = currentSize.value.height;
  }
});

onReady(() => {
  initCanvas();
  setTimeout(() => {
    loadAndProcessImage();
  }, 100);
});

// Initialize Canvas
const initCanvas = () => {
  const query = uni.createSelectorQuery();
  query.select('#photoCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res[0]) {
        const canvas = res[0].node;
        canvasCtx = canvas.getContext('2d');
        canvas.width = canvasWidth.value;
        canvas.height = canvasHeight.value;
      }
    });
};

// Load and process image
const loadAndProcessImage = async () => {
  if (!originalImage.value || !canvasCtx) return;
  processing.value = true;
  processingText.value = 'AI智能抠图中...';

  try {
    // 调用百度云 API 进行人像分割（压缩和 base64 处理都在 baiduAI 模块内完成）
    const mattedImagePath = await segmentPortrait(originalImage.value);
    
    // 将抠像结果作为画布新的原图素材
    originalImage.value = mattedImagePath;

    // 渲染带有透明图层的图片并显示后续的背景
    const imageInfo = await getImageInfo(mattedImagePath);
    await drawPhoto(imageInfo);
    
    processing.value = false;
    processingText.value = '处理中...';
  } catch (error: any) {
    console.error('Image processing failed:', error);
    processing.value = false;
    processingText.value = '处理中...';
    uni.showToast({ title: error.message || '抠图失败', icon: 'none', duration: 3000 });
  }
};

// Get image info
const getImageInfo = (src: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({ src, success: resolve, fail: reject });
  });
};

// Draw photo
const drawPhoto = async (imageInfo: any) => {
  const ctx = canvasCtx;
  const canvasW = canvasWidth.value;
  const canvasH = canvasHeight.value;

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = selectedColor.value;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const img = await createImage(originalImage.value);
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;

  let drawWidth, drawHeight, drawX, drawY;
  const scaleFactor = scale.value / 100;

  if (imgRatio > canvasRatio) {
    drawHeight = canvasH * scaleFactor;
    drawWidth = drawHeight * imgRatio;
  } else {
    drawWidth = canvasW * scaleFactor;
    drawHeight = drawWidth / imgRatio;
  }

  drawX = (canvasW - drawWidth) / 2;
  drawY = (canvasH - drawHeight) / 2 + offsetY.value;

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

// Create image object
const createImage = (src: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#photoCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const img = canvas.createImage();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        } else {
          reject(new Error('Canvas not found'));
        }
      });
  });
};

// Select background color
const selectColor = (color: any) => {
  selectedColor.value = color.color;
  if (originalImage.value) {
    getImageInfo(originalImage.value).then(drawPhoto);
  }
};

// Scale adjustment
const onScaleChange = (e: any) => {
  scale.value = e.detail.value;
  if (originalImage.value) {
    getImageInfo(originalImage.value).then(drawPhoto);
  }
};

// Vertical position adjustment
const onOffsetYChange = (e: any) => {
  offsetY.value = e.detail.value;
  if (originalImage.value) {
    getImageInfo(originalImage.value).then(drawPhoto);
  }
};

// Reset
const reset = () => {
  scale.value = 100;
  offsetY.value = 0;
  selectedColor.value = '#FFFFFF';
  setBeautyPreset('none');
  if (originalImage.value) {
    getImageInfo(originalImage.value).then(drawPhoto);
  }
};

// Beauty presets
const setBeautyPreset = (preset: string) => {
  beautyPreset.value = preset;
  const settings = beautyPresets[preset as keyof typeof beautyPresets];
  if (settings) {
    beauty.value = { ...settings };
  }
};

const onSmoothChange = (e: any) => {
  beauty.value.smooth = e.detail.value;
  beautyPreset.value = 'custom';
};

const onWhitenChange = (e: any) => {
  beauty.value.whiten = e.detail.value;
  beautyPreset.value = 'custom';
};

const onRuddyChange = (e: any) => {
  beauty.value.ruddy = e.detail.value;
  beautyPreset.value = 'custom';
};

// Generate ID photo
const generatePhoto = async () => {
  if (!canvasCtx) {
    uni.showToast({ title: '请稍后再试', icon: 'none' });
    return;
  }

  processing.value = true;
  processingText.value = '正在生成...';

  try {
    const canvas = await getCanvasNode();
    let tempFilePath = await canvasToTempFile(canvas);

    // Apply beauty if enabled
    if (beauty.value.smooth > 0 || beauty.value.whiten > 0 || beauty.value.ruddy > 0) {
      processingText.value = '美颜处理中...';
      tempFilePath = await applyBeauty(tempFilePath, {
        smooth: beauty.value.smooth,
        whiten: beauty.value.whiten,
        ruddy: beauty.value.ruddy
      });
    }

    // Pass beauty settings to result page
    const beautyParam = encodeURIComponent(JSON.stringify(beauty.value));
    uni.navigateTo({
      url: `/pages/result/result?image=${encodeURIComponent(tempFilePath)}&size=${encodeURIComponent(JSON.stringify(currentSize.value))}&bg=${selectedColor.value}&beauty=${beautyParam}`
    });

    processing.value = false;
  } catch (error) {
    console.error('Generation failed:', error);
    processing.value = false;
    uni.showToast({ title: '生成失败，请重试', icon: 'none' });
  }
};

// Get Canvas node
const getCanvasNode = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#photoCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (res[0]?.node) {
          resolve(res[0].node);
        } else {
          reject(new Error('Canvas not found'));
        }
      });
  });
};

// Canvas to temp file
const canvasToTempFile = (canvas: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.preview-section {
  background: linear-gradient(135deg, var(--neutral-800) 0%, var(--neutral-900) 100%);
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 480rpx;
}

.preview-section .canvas-wrapper {
  position: relative;
}

.preview-section .photo-canvas {
  background: var(--bg-card);
  border-radius: 12rpx;
  box-shadow: var(--shadow-xl);
}

.preview-section .face-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.preview-section .face-guide .guide-frame {
  width: 180rpx;
  height: 240rpx;
  border: 2rpx dashed rgba(255, 255, 255, 0.4);
  border-radius: 90rpx 90rpx 70rpx 70rpx;
}

.preview-section .face-guide .guide-text {
  position: absolute;
  top: -50rpx;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
  white-space: nowrap;
}

.preview-section .loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-section .loading-overlay .spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary-400);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-section .loading-overlay .loading-text {
  color: var(--text-inverse);
  font-size: 22rpx;
  margin-top: 16rpx;
}

.controls-section {
  flex: 1;
  padding: 30rpx;
}

.control-group {
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-sm);
}

.control-group .control-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
}

.control-group .control-label .label-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.color-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.beauty-presets {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.beauty-presets .preset-item {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
  background: var(--bg-elevated);
  border-radius: 12rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
  border: 2rpx solid transparent;
}

.beauty-presets .preset-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
  border-color: var(--primary-500);
  font-weight: 500;
}

.beauty-presets .preset-item:active {
  transform: scale(0.98);
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120rpx;
  position: relative;
}

.color-item .color-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  border: 4rpx solid transparent;
  box-shadow: var(--shadow-sm);
  margin-bottom: 12rpx;
  transition: all 0.2s ease;
}

.color-item.active .color-circle {
  transform: scale(1.1);
  box-shadow: var(--shadow-glow);
}

.color-item .color-name {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.color-item .popular-tag {
  position: absolute;
  top: -8rpx;
  right: 0;
  font-size: 18rpx;
  padding: 2rpx 8rpx;
}

.slider-control {
  margin-bottom: 24rpx;
}

.slider-control:last-child {
  margin-bottom: 0;
}

.slider-control .slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.slider-control .slider-header .slider-label {
  font-size: 26rpx;
  color: var(--text-primary);
}

.slider-control .slider-header .slider-value {
  font-size: 22rpx;
  color: var(--primary-600);
  font-weight: 600;
  background: var(--primary-50);
  padding: 8rpx 16rpx;
  border-radius: 9999rpx;
}

.slider-control .custom-slider {
  margin: 0;
}

.quick-actions {
  display: flex;
  justify-content: center;
  margin-top: 12rpx;
}

.quick-actions .btn-ghost {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 30rpx;
}

.quick-actions .btn-ghost .action-icon {
  font-size: 28rpx;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 30rpx;
  background: var(--bg-card);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.footer-bar .btn-xl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.footer-bar .btn-xl .btn-icon {
  font-size: 28rpx;
}
</style>
