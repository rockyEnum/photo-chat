// 图片处理工具函数

/**
 * 压缩图片
 */
export const compressImage = (src: string, quality: number = 80): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
};

/**
 * 获取图片信息
 */
export const getImageInfo = (src: string): Promise<UniApp.GetImageInfoSuccessData> => {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * AI抠图 - 使用腾讯云人像分割API
 * 注：需要配置腾讯云API密钥
 */
export const removeBackground = async (imagePath: string): Promise<string> => {
  // 这里应该调用腾讯云AI人像分割API
  // 由于需要服务端支持，这里返回原图作为降级方案

  // 实际实现流程：
  // 1. 上传图片到服务器
  // 2. 服务器调用腾讯云API
  // 3. 返回分割后的图片URL

  return new Promise((resolve) => {
    // 模拟AI处理延迟
    uni.showLoading({ title: 'AI处理中...' });

    setTimeout(() => {
      uni.hideLoading();
      // 返回原图（实际应该是AI分割后的图片）
      resolve(imagePath);
    }, 1500);
  });
};

/**
 * 图片合成 - 将人像与背景色合成
 */
export const compositeImage = async (
  portraitPath: string,
  bgColor: string,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#compositeCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;

        // 填充背景色
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // 加载并绘制人像
        const img = canvas.createImage();
        img.onload = () => {
          // 计算居中位置
          const scale = Math.max(width / img.width, height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const drawX = (width - drawWidth) / 2;
          const drawY = (height - drawHeight) / 2;

          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          // 导出图片
          uni.canvasToTempFilePath({
            canvas,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        };
        img.onerror = reject;
        img.src = portraitPath;
      });
  });
};

/**
 * 生成证件照排版
 */
export const generateLayout = async (
  photoPath: string,
  config: {
    cols: number;
    rows: number;
    paperWidth: number;
    paperHeight: number;
    gap: number;
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#layoutCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        const { cols, rows, paperWidth, paperHeight, gap } = config;

        canvas.width = paperWidth;
        canvas.height = paperHeight;

        // 获取照片尺寸
        uni.getImageInfo({
          src: photoPath,
          success: (info) => {
            const photoW = info.width;
            const photoH = info.height;

            // 计算边距
            const totalWidth = cols * photoW + (cols - 1) * gap;
            const totalHeight = rows * photoH + (rows - 1) * gap;
            const marginX = (paperWidth - totalWidth) / 2;
            const marginY = (paperHeight - totalHeight) / 2;

            // 填充白色背景
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, paperWidth, paperHeight);

            // 加载照片
            const img = canvas.createImage();
            img.onload = () => {
              // 绘制照片网格
              for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                  const x = marginX + col * (photoW + gap);
                  const y = marginY + row * (photoH + gap);
                  ctx.drawImage(img, x, y, photoW, photoH);
                }
              }

              // 导出排版图片
              uni.canvasToTempFilePath({
                canvas,
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              });
            };
            img.onerror = reject;
            img.src = photoPath;
          },
          fail: reject
        });
      });
  });
};

/**
 * 裁剪图片到指定比例
 */
export const cropImage = (
  src: string,
  cropInfo: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 使用canvas进行裁剪
    const query = uni.createSelectorQuery();
    query.select('#cropCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        canvas.width = cropInfo.width;
        canvas.height = cropInfo.height;

        const img = canvas.createImage();
        img.onload = () => {
          ctx.drawImage(
            img,
            cropInfo.x,
            cropInfo.y,
            cropInfo.width,
            cropInfo.height,
            0,
            0,
            cropInfo.width,
            cropInfo.height
          );

          uni.canvasToTempFilePath({
            canvas,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        };
        img.onerror = reject;
        img.src = src;
      });
  });
};

/**
 * 调整图片亮度/对比度
 */
export const adjustImage = (
  src: string,
  adjustments: {
    brightness?: number;  // -100 to 100
    contrast?: number;    // -100 to 100
    saturation?: number;  // -100 to 100
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 使用canvas滤镜API（微信小程序2.19.0+支持）
    const query = uni.createSelectorQuery();
    query.select('#adjustCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        uni.getImageInfo({
          src,
          success: (info) => {
            canvas.width = info.width;
            canvas.height = info.height;

            // 设置滤镜
            const filters: string[] = [];
            if (adjustments.brightness !== undefined) {
              filters.push(`brightness(${100 + adjustments.brightness}%)`);
            }
            if (adjustments.contrast !== undefined) {
              filters.push(`contrast(${100 + adjustments.contrast}%)`);
            }
            if (adjustments.saturation !== undefined) {
              filters.push(`saturate(${100 + adjustments.saturation}%)`);
            }

            if (filters.length > 0) {
              ctx.filter = filters.join(' ');
            }

            const img = canvas.createImage();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, info.width, info.height);

              uni.canvasToTempFilePath({
                canvas,
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              });
            };
            img.onerror = reject;
            img.src = src;
          },
          fail: reject
        });
      });
  });
};

/**
 * 人脸检测 - 使用腾讯云AI
 * 注：需要配置腾讯云API密钥
 */
export const detectFace = async (imagePath: string): Promise<any> => {
  // 这里应该调用腾讯云人脸检测API
  // 返回人脸位置信息

  return new Promise((resolve) => {
    // 模拟人脸检测结果
    resolve({
      faceRect: {
        x: 100,
        y: 80,
        width: 120,
        height: 140
      },
      confidence: 99
    });
  });
};

/**
 * 美颜处理 - 磨皮、美白、红润
 */
export const applyBeauty = (
  src: string,
  beautyOptions: {
    smooth?: number;    // 磨皮程度 0-100
    whiten?: number;    // 美白程度 0-100
    ruddy?: number;     // 红润程度 0-100
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#beautyCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        uni.getImageInfo({
          src,
          success: (info) => {
            canvas.width = info.width;
            canvas.height = info.height;

            const img = canvas.createImage();
            img.onload = () => {
              // 构建滤镜字符串
              const filters: string[] = [];

              // 磨皮 - 使用轻微模糊
              if (beautyOptions.smooth && beautyOptions.smooth > 0) {
                const blurAmount = (beautyOptions.smooth / 100) * 2;
                filters.push(`blur(${blurAmount}px)`);
              }

              // 美白 - 提高亮度
              if (beautyOptions.whiten && beautyOptions.whiten > 0) {
                const brightnessAmount = 100 + (beautyOptions.whiten * 0.3);
                filters.push(`brightness(${brightnessAmount}%)`);
              }

              // 红润 - 提高饱和度
              if (beautyOptions.ruddy && beautyOptions.ruddy > 0) {
                const saturateAmount = 100 + (beautyOptions.ruddy * 0.5);
                filters.push(`saturate(${saturateAmount}%)`);
              }

              // 应用滤镜
              if (filters.length > 0) {
                ctx.filter = filters.join(' ');
              }

              ctx.drawImage(img, 0, 0, info.width, info.height);

              uni.canvasToTempFilePath({
                canvas,
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              });
            };
            img.onerror = reject;
            img.src = src;
          },
          fail: reject
        });
      });
  });
};

/**
 * 智能美颜 - 自动调整
 */
export const autoBeauty = (src: string): Promise<string> => {
  return applyBeauty(src, {
    smooth: 30,    // 轻微磨皮
    whiten: 20,    // 自然美白
    ruddy: 15      // 微红润色
  });
};

/**
 * 人脸美颜 - 仅对人脸区域美颜（需要配合人脸检测）
 */
export const applyFaceBeauty = (
  src: string,
  faceRect: { x: number; y: number; width: number; height: number },
  beautyOptions: {
    smooth?: number;
    whiten?: number;
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery();
    query.select('#faceBeautyCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]?.node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        uni.getImageInfo({
          src,
          success: (info) => {
            canvas.width = info.width;
            canvas.height = info.height;

            const img = canvas.createImage();
            img.onload = () => {
              // 绘制原图
              ctx.drawImage(img, 0, 0, info.width, info.height);

              // 在人脸区域应用美颜效果
              ctx.save();

              // 创建人脸区域裁剪路径
              ctx.beginPath();
              ctx.rect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
              ctx.clip();

              // 应用美颜滤镜
              const filters: string[] = [];
              if (beautyOptions.smooth) {
                filters.push(`blur(${(beautyOptions.smooth / 100) * 2}px)`);
              }
              if (beautyOptions.whiten) {
                filters.push(`brightness(${100 + beautyOptions.whiten * 0.3}%)`);
              }

              if (filters.length > 0) {
                ctx.filter = filters.join(' ');
                ctx.drawImage(img, 0, 0, info.width, info.height);
              }

              ctx.restore();

              uni.canvasToTempFilePath({
                canvas,
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              });
            };
            img.onerror = reject;
            img.src = src;
          },
          fail: reject
        });
      });
  });
};

export default {
  compressImage,
  getImageInfo,
  removeBackground,
  compositeImage,
  generateLayout,
  cropImage,
  adjustImage,
  detectFace,
  applyBeauty,
  autoBeauty,
  applyFaceBeauty
};
