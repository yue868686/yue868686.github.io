// PWA测试脚本 - 用于验证service worker是否正常工作

// 检查service worker是否注册成功
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      console.log('✅ Service Worker已成功注册');
      
      // 检查缓存状态
      caches.open('usdc-wallet-cache-v1.0.0').then(cache => {
        console.log('✅ 缓存已成功打开');
        cache.keys().then(keys => {
          console.log('💾 已缓存资源数量:', keys.length);
          keys.forEach(request => {
            console.log('📁 缓存的资源:', request.url);
          });
        }).catch(err => {
          console.error('❌ 读取缓存失败:', err);
        });
      }).catch(err => {
        console.error('❌ 打开缓存失败:', err);
      });
    } else {
      console.log('❌ Service Worker未注册，请刷新页面重试');
    }
  }).catch(err => {
    console.error('❌ 检查Service Worker失败:', err);
  });
}

// 提供手动测试离线功能的方法
window.testPWA = {
  checkOfflineCapability: function() {
    alert('要测试离线功能，请：\n1. 正常加载此页面\n2. 打开Chrome DevTools\n3. 切换到Application > Service Workers\n4. 勾选Offline选项\n5. 刷新页面，检查是否能正常加载');
  },
  clearAllCaches: function() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ 清除缓存:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        alert('✅ 所有缓存已清除，请刷新页面重新加载Service Worker');
      }).catch(err => {
        console.error('❌ 清除缓存失败:', err);
      });
    }
  },
  uninstallPWA: function() {
    // 检查浏览器是否支持PWA卸载API
    if ('getInstalledRelatedApps' in navigator && 'uninstall' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        if (apps.length > 0) {
          const app = apps[0];
          if ('uninstall' in app) {
            app.uninstall().then(success => {
              if (success) {
                alert('✅ PWA应用已成功卸载');
              } else {
                alert('❌ PWA应用卸载失败，请尝试手动卸载');
                this.showManualUninstallInstructions();
              }
            });
          } else {
            alert('❌ 当前浏览器不支持自动卸载功能，请尝试手动卸载');
            this.showManualUninstallInstructions();
          }
        } else {
          alert('⚠️ 未检测到已安装的PWA应用');
        }
      });
    } else {
      alert('❌ 当前浏览器不支持自动卸载功能，请尝试手动卸载');
      this.showManualUninstallInstructions();
    }
  },
  showManualUninstallInstructions: function() {
    const instructions = 
      '手动卸载PWA应用的方法：\n\n'
      + 'Chrome浏览器 (桌面端):\n'
      + '1. 打开应用窗口\n'
      + '2. 点击右上角菜单按钮（三个点）\n'
      + '3. 选择 "卸载USDC Wallet..."\n'
      + '4. 在确认对话框中点击 "卸载"\n\n'
      + 'Chrome浏览器 (Android):\n'
      + '1. 长按应用图标\n'
      + '2. 选择 "应用信息"\n'
      + '3. 点击 "卸载"\n\n'
      + 'Firefox浏览器:\n'
      + '1. 打开应用窗口\n'
      + '2. 点击右上角菜单按钮（三个横线）\n'
      + '3. 选择 "安装应用" 子菜单\n'
      + '4. 点击 "移除USDC Wallet"\n\n'
      + 'Safari浏览器 (iOS):\n'
      + '1. 长按主屏幕上的应用图标\n'
      + '2. 选择 "删除App"\n'
      + '3. 点击 "删除"\n\n'
      + 'Windows系统:\n'
      + '1. 打开 "设置" > "应用" > "应用和功能"\n'
      + '2. 在列表中找到 "USDC Wallet"\n'
      + '3. 点击 "卸载" 并确认\n\n'
      + 'macOS系统:\n'
      + '1. 打开 "启动台"\n'
      + '2. 找到 "USDC Wallet" 应用\n'
      + '3. 长按应用图标直到出现抖动\n'
      + '4. 点击应用图标上的 "x" 按钮并确认卸载';
    
    alert(instructions);
  }
};

console.log('PWA测试脚本已加载，可使用window.testPWA对象测试PWA功能');
console.log('例如: window.testPWA.checkOfflineCapability()');
console.log('      window.testPWA.clearAllCaches()');