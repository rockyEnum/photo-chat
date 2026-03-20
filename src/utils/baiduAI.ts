/**
 * 百度云 AI 人像分割模块
 * 接口文档：https://ai.baidu.com/ai-doc/BODY/Fk3cpyxua
 *
 * body_seg 接口要求：
 *   - POST https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg?access_token=xxx
 *   - Content-Type: application/x-www-form-urlencoded
 *   - Body: image=<base64 后 urlencode>&type=foreground
 *   - 图片最短边>=50px，最长边<=4096px，base64+urlencode后<=4MB
 */

import { BAIDU_AI_CONFIG } from './constants';

const API_KEY = BAIDU_AI_CONFIG.apiKey;
const SECRET_KEY = BAIDU_AI_CONFIG.secretKey;
const TOKEN_URL = BAIDU_AI_CONFIG.tokenUrl;
const BODY_SEG_URL = BAIDU_AI_CONFIG.segmentUrl;

// 缓存 token
let cachedToken = '';
let tokenExpireTime = 0;

/**
 * 获取百度云 Access Token
 */
function getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        // 如果 token 还没过期就复用
        if (cachedToken && Date.now() < tokenExpireTime) {
            return resolve(cachedToken);
        }

        const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
        console.log('[baiduAI] 正在获取 access_token...');

        uni.request({
            url,
            method: 'POST',
            success: (res: any) => {
                if (res.data && res.data.access_token) {
                    cachedToken = res.data.access_token;
                    // token 有效期 30 天，这里保守设 25 天
                    tokenExpireTime = Date.now() + 25 * 24 * 60 * 60 * 1000;
                    console.log('[baiduAI] access_token 获取成功');
                    resolve(cachedToken);
                } else {
                    console.error('[baiduAI] access_token 获取失败:', res.data);
                    reject(new Error('获取 access_token 失败'));
                }
            },
            fail: (err) => {
                console.error('[baiduAI] token 请求网络错误:', err);
                reject(new Error('网络请求失败'));
            }
        });
    });
}

/**
 * 读取图片文件转为 base64 字符串（不含 data:image 头）
 */
function readFileAsBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const fs = uni.getFileSystemManager();
        fs.readFile({
            filePath,
            encoding: 'base64',
            success: (res) => {
                // 清除可能存在的换行符
                const clean = (res.data as string).replace(/[\r\n\s]/g, '');
                console.log('[baiduAI] base64 长度:', clean.length, '约', Math.round(clean.length / 1024), 'KB');
                resolve(clean);
            },
            fail: (err) => {
                console.error('[baiduAI] 读取文件失败:', err);
                reject(new Error('读取文件失败'));
            }
        });
    });
}

/**
 * 将 base64 写入临时 png 文件
 */
function saveBase64ToFile(base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const fs = uni.getFileSystemManager();
        // @ts-ignore - uni.env.USER_DATA_PATH 运行时可用
        const filePath = `${uni.env.USER_DATA_PATH}/seg_${Date.now()}.png`;

        fs.writeFile({
            filePath,
            data: base64,
            encoding: 'base64',
            success: () => {
                console.log('[baiduAI] 抠图结果已保存:', filePath);
                resolve(filePath);
            },
            fail: (err) => {
                console.error('[baiduAI] 保存文件失败:', err);
                reject(new Error('保存抠图结果失败'));
            }
        });
    });
}

/**
 * 压缩图片到安全尺寸
 * 使用 uni.compressImage 控制质量，确保 base64 不超 4MB
 */
function compressToSafeSize(filePath: string): Promise<string> {
    return new Promise((resolve) => {
        uni.compressImage({
            src: filePath,
            quality: 30, // 极低质量，保证文件体积小
            success: (res) => {
                console.log('[baiduAI] 图片压缩完成');
                resolve(res.tempFilePath);
            },
            fail: () => {
                // 压缩失败就用原图
                console.warn('[baiduAI] 压缩失败，使用原图');
                resolve(filePath);
            }
        });
    });
}

/**
 * 调用百度云人像分割 API
 */
function callBodySeg(token: string, base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log('[baiduAI] 正在调用 body_seg API...');

        // 按照文档要求：base64 编码后进行 urlencode
        // 手动拼接 body 字符串确保 +/= 等特殊字符被正确编码
        const encodedImage = encodeURIComponent(base64);
        const bodyString = `image=${encodedImage}&type=foreground`;

        console.log('[baiduAI] 请求 body 长度:', bodyString.length);

        uni.request({
            url: `${BODY_SEG_URL}?access_token=${token}`,
            method: 'POST',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: bodyString,
            success: (res: any) => {
                console.log('[baiduAI] API 响应状态码:', res.statusCode);

                if (!res.data) {
                    reject(new Error('API 返回为空'));
                    return;
                }

                // 如果有错误
                if (res.data.error_code) {
                    console.error('[baiduAI] API 错误:', res.data.error_code, res.data.error_msg);
                    reject(new Error(`API错误(${res.data.error_code}): ${res.data.error_msg}`));
                    return;
                }

                // 成功返回
                if (res.data.foreground) {
                    console.log('[baiduAI] body_seg 成功！person_num:', res.data.person_num);
                    resolve(res.data.foreground);
                } else {
                    console.error('[baiduAI] 返回数据中无 foreground 字段:', Object.keys(res.data));
                    reject(new Error('返回数据异常'));
                }
            },
            fail: (err) => {
                console.error('[baiduAI] 请求网络错误:', err);
                reject(new Error('网络请求失败'));
            }
        });
    });
}

/**
 * 人像分割主入口
 * @param imagePath 原始图片路径（本地临时文件）
 * @returns 抠图后的透明背景 PNG 文件路径
 */
export async function segmentPortrait(imagePath: string): Promise<string> {
    console.log('[baiduAI] ===== 开始人像分割 =====');
    console.log('[baiduAI] 输入图片:', imagePath);

    // Step 1: 压缩图片
    const compressed = await compressToSafeSize(imagePath);

    // Step 2: 读取 base64
    const base64 = await readFileAsBase64(compressed);

    // 校验：base64 长度（原始 base64 不超 ~2.7MB 为安全，urlencode 后约 x1.33）
    if (base64.length > 2500000) {
        console.warn('[baiduAI] base64 过大:', base64.length, '尝试进一步压缩');
        // 进一步压缩
        const moreCompressed = await compressToSafeSize(compressed);
        const smallerBase64 = await readFileAsBase64(moreCompressed);
        if (smallerBase64.length > 2500000) {
            throw new Error('图片过大，请选择更小的图片');
        }
        // 使用更小的 base64
        return doSegment(smallerBase64);
    }

    return doSegment(base64);
}

async function doSegment(base64: string): Promise<string> {
    // Step 3: 获取 token
    const token = await getAccessToken();

    // Step 4: 调用分割 API
    const foregroundBase64 = await callBodySeg(token, base64);

    // Step 5: 保存为文件
    const resultPath = await saveBase64ToFile(foregroundBase64);

    console.log('[baiduAI] ===== 人像分割完成 =====');
    return resultPath;
}
