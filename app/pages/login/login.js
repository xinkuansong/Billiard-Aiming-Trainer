Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false
  },

  onLoad() {
    // 检查是否已经登录
    this.checkLoginStatus();
    
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
  },

  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', res.userInfo);
        
        // 初始化用户练习数据
        this.initUserPracticeData();
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // 延迟跳转到主页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      },
      fail: (res) => {
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        });
      }
    });
  },

  initUserPracticeData() {
    // 初始化用户练习数据结构
    const userStats = {
      totalPractices: 0,
      angleAccuracy: [],
      averageError: 0,
      bestStreak: 0,
      currentStreak: 0,
      practiceHistory: [],
      achievements: [],
      settings: {
        tableType: 'snooker',
        difficulty: 'normal',
        soundEnabled: true,
        vibrationEnabled: true
      }
    };
    
    wx.setStorageSync('poolTrainerStats', userStats);
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录将清除本地数据，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息和练习数据
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('poolTrainerStats');
          
          this.setData({
            userInfo: null,
            hasUserInfo: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  goToStats() {
    if (this.data.hasUserInfo) {
      wx.switchTab({
        url: '/pages/stats/stats'
      });
    } else {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
    }
  }
}); 