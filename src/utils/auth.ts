// 权限检查与申请

/**
 * 检查并申请所有必要权限
 */
export const checkAuth = () => {
  // 检查相机权限
  checkCameraAuth();
  // 检查相册权限
  checkAlbumAuth();
  // 检查保存到相册权限
  checkSaveAuth();
};

/**
 * 检查相机权限
 */
export const checkCameraAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.camera',
      success: () => {
        console.log('相机权限已获取');
        resolve(true);
      },
      fail: () => {
        console.log('相机权限未获取');
        // 引导用户开启权限
        showAuthModal('相机', 'scope.camera');
        resolve(false);
      }
    });
  });
};

/**
 * 检查相册权限
 */
export const checkAlbumAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.writePhotosAlbum',
      success: () => {
        console.log('相册权限已获取');
        resolve(true);
      },
      fail: () => {
        console.log('相册权限未获取');
        showAuthModal('相册', 'scope.writePhotosAlbum');
        resolve(false);
      }
    });
  });
};

/**
 * 检查保存到相册权限
 */
export const checkSaveAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.writePhotosAlbum',
      success: () => {
        resolve(true);
      },
      fail: () => {
        showAuthModal('保存到相册', 'scope.writePhotosAlbum');
        resolve(false);
      }
    });
  });
};

/**
 * 显示权限申请弹窗
 */
const showAuthModal = (permissionName: string, scope: string) => {
  uni.getSetting({
    success: (res) => {
      if (!res.authSetting[scope]) {
        uni.showModal({
          title: '需要授权',
          content: `制作证件照需要${permissionName}权限，请在设置中开启`,
          confirmText: '去设置',
          success: (modalRes) => {
            if (modalRes.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting[scope]) {
                    uni.showToast({
                      title: '授权成功',
                      icon: 'success'
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  });
};

/**
 * 检查权限状态（不弹窗）
 */
export const checkAuthStatus = async (): Promise<{
  camera: boolean;
  album: boolean;
}> => {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => {
        resolve({
          camera: !!res.authSetting['scope.camera'],
          album: !!res.authSetting['scope.writePhotosAlbum']
        });
      },
      fail: () => {
        resolve({
          camera: false,
          album: false
        });
      }
    });
  });
};

/**
 * 进入小程序时的权限引导
 */
export const showAuthGuide = () => {
  const hasShown = uni.getStorageSync('authGuideShown');
  if (hasShown) return;

  uni.showModal({
    title: '欢迎使用证件照小程序',
    content: '为了给您提供更好的服务，我们需要以下权限：\n\n1. 相机权限 - 拍摄证件照\n2. 相册权限 - 选择照片和保存照片\n\n请点击确定授权',
    showCancel: false,
    confirmText: '确定',
    success: () => {
      uni.setStorageSync('authGuideShown', true);
      checkAuth();
    }
  });
};
