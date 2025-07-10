Page({
  data: {
    userInfo: null,
    userStats: {
      totalPractices: 0,
      averageError: 0,
      bestScore: null
    }
  },

  onLoad() {
    this.loadUserStats();
    this.checkUserLogin();
  },

  onShow() {
    // 每次显示页面时刷新统计数据
    this.loadUserStats();
  },

  // 检查用户登录状态
  checkUserLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 加载用户统计数据
  loadUserStats() {
    try {
      const stats = wx.getStorageSync('poolTrainerStats');
      if (stats) {
        this.setData({ userStats: stats });
      }
    } catch (e) {
      console.log('加载用户数据失败', e);
    }
  },

  // 页面跳转方法
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  goToStats() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 练习模式跳转
  goToChinese8Practice() {
    wx.navigateTo({
      url: '/pages/practice-chinese8/practice-chinese8'
    });
  },

  goToSnookerPractice() {
    wx.navigateTo({
      url: '/pages/practice-snooker/practice-snooker'
    });
  },

  goToAnglePractice() {
    wx.navigateTo({
      url: '/pages/practice-angle/practice-angle'
    });
  }
}); 