// 证件照尺寸规格
export const PHOTO_SIZES = [
  {
    id: 'one-inch',
    name: '一寸',
    mmSize: '25×35mm',
    pxSize: '295×413',
    width: 295,
    height: 413,
    dpi: 300,
    isCommon: true,
    desc: '简历、证书'
  },
  {
    id: 'two-inch',
    name: '二寸',
    mmSize: '35×49mm',
    pxSize: '413×626',
    width: 413,
    height: 626,
    dpi: 300,
    isCommon: true,
    desc: '证书、护照'
  },
  {
    id: 'small-one-inch',
    name: '小一寸',
    mmSize: '22×32mm',
    pxSize: '260×378',
    width: 260,
    height: 378,
    dpi: 300,
    isCommon: false,
    desc: '驾驶证、体检'
  },
  {
    id: 'large-one-inch',
    name: '大一寸',
    mmSize: '33×48mm',
    pxSize: '390×567',
    width: 390,
    height: 567,
    dpi: 300,
    isCommon: true,
    desc: '护照、签证'
  },
  {
    id: 'small-two-inch',
    name: '小二寸',
    mmSize: '28×40mm',
    pxSize: '334×472',
    width: 334,
    height: 472,
    dpi: 300,
    isCommon: false,
    desc: '公务员考试'
  },
  {
    id: 'large-two-inch',
    name: '大二寸',
    mmSize: '35×45mm',
    pxSize: '413×531',
    width: 413,
    height: 531,
    dpi: 300,
    isCommon: false,
    desc: '护照'
  }
];

// 背景色选项
export const BACKGROUND_COLORS = [
  {
    id: 'white',
    name: '白色',
    color: '#FFFFFF',
    desc: '通用',
    isCommon: true
  },
  {
    id: 'blue',
    name: '蓝色',
    color: '#438EDB',
    desc: '简历、毕业证',
    isCommon: true
  },
  {
    id: 'red',
    name: '红色',
    color: '#D9534F',
    desc: '结婚证、证件照',
    isCommon: true
  },
  {
    id: 'light-blue',
    name: '浅蓝',
    color: '#87CEEB',
    desc: '护照、身份证',
    isCommon: false
  },
  {
    id: 'light-gray',
    name: '浅灰',
    color: '#F5F5F5',
    desc: '签证',
    isCommon: false
  },
  {
    id: 'navy',
    name: '深蓝',
    color: '#1E3A5F',
    desc: '毕业证',
    isCommon: false
  }
];

// 排版配置
export const LAYOUT_CONFIG = {
  // 1寸照片 3x3 排版 (6寸相纸)
  'one-inch': {
    cols: 3,
    rows: 3,
    paperWidth: 1200,  // 6寸相纸宽度
    paperHeight: 1800, // 6寸相纸高度
    gap: 20
  },
  // 2寸照片 2x2 排版 (6寸相纸)
  'two-inch': {
    cols: 2,
    rows: 2,
    paperWidth: 1200,
    paperHeight: 1800,
    gap: 30
  }
};

// 腾讯云AI配置
export const TENCENT_AI_CONFIG = {
  // 请替换为您的腾讯云API密钥
  secretId: '',
  secretKey: '',
  // 人像分割API地址
  segmentUrl: 'https://iai.tencentcloudapi.com/?Action=SegmentPortraitPic'
};

// 百度云API配置
export const BAIDU_AI_CONFIG = {
  apiKey: 'DOXPFIbVfmxHQtoabylMOR1v',
  secretKey: 'QSwMsMLVFiWvN0KLlov0pWALZRvZO7sy',
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  segmentUrl: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg'
};

// 默认导出
export default {
  PHOTO_SIZES,
  BACKGROUND_COLORS,
  LAYOUT_CONFIG,
  TENCENT_AI_CONFIG,
  BAIDU_AI_CONFIG
};
