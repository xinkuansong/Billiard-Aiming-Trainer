Page({
  data: {
    userInfo: null,
    settings: {
      tableType: 'snooker',
      difficulty: 'normal',
      soundEnabled: true,
      vibrationEnabled: true,
      showHints: true,
      autoSave: true
    }
  },

  onLoad() {
    this.loadUserData();
    this.loadSettings();
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  loadSettings() {
    const settings = wx.getStorageSync('poolTrainerSettings');
    if (settings) {
      this.setData({ settings });
    }
  },

  onTableTypeChange(e) {
    const tableType = e.detail.value === 0 ? 'snooker' : 'eightball';
    this.setData({
      'settings.tableType': tableType
    });
    this.saveSettings();
  },

  onDifficultyChange(e) {
    const difficulties = ['easy', 'normal', 'hard'];
    const difficulty = difficulties[e.detail.value];
    this.setData({
      'settings.difficulty': difficulty
    });
    this.saveSettings();
  },

  onSoundToggle(e) {
    this.setData({
      'settings.soundEnabled': e.detail.value
    });
    this.saveSettings();
  },

  onVibrationToggle(e) {
    this.setData({
      'settings.vibrationEnabled': e.detail.value
    });
    this.saveSettings();
  },

  onHintsToggle(e) {
    this.setData({
      'settings.showHints': e.detail.value
    });
    this.saveSettings();
  },

  onAutoSaveToggle(e) {
    this.setData({
      'settings.autoSave': e.detail.value
    });
    this.saveSettings();
  },

  saveSettings() {
    wx.setStorageSync('poolTrainerSettings', this.data.settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1000
    });
  },

  resetSettings() {
    wx.showModal({
      title: '重置设置',
      content: '确定要恢复默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          const defaultSettings = {
            tableType: 'snooker',
            difficulty: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
            showHints: true,
            autoSave: true
          };
          
          this.setData({ settings: defaultSettings });
          wx.setStorageSync('poolTrainerSettings', defaultSettings);
          
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  aboutApp() {
    wx.showModal({
      title: '关于应用',
      content: '台球瞄准训练器 v1.0\n\n专为台球爱好者设计的角度练习工具，帮助提高瞄准精度和比赛表现。\n\n开发者：你的名字',
      showCancel: false
    });
  },

  contactDeveloper() {
    wx.showModal({
      title: '联系开发者',
      content: '如有问题或建议，请通过以下方式联系：\n\n微信：your_wechat\n邮箱：your_email@example.com',
      showCancel: false
    });
  }
}); 