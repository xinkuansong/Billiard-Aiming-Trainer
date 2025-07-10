Page({
  data: {
    userStats: {
      totalPractices: 0,
      angleAccuracy: [],
      averageError: 0,
      bestStreak: 0,
      currentStreak: 0,
      practiceHistory: [],
      achievements: []
    },
    userInfo: null,
    chartData: [],
    recentPractices: [],
    achievements: [],
    currentTab: 'overview' // 'overview', 'detailed', 'achievements'
  },

  onLoad() {
    this.loadUserData();
    this.generateChartData();
    this.checkAchievements();
  },

  onShow() {
    this.loadUserData();
    this.generateChartData();
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo');
    const userStats = wx.getStorageSync('poolTrainerStats');
    
    if (!userInfo) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录以查看统计数据',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    this.setData({
      userInfo: userInfo,
      userStats: userStats || this.data.userStats
    });

    // 处理最近的练习记录
    if (userStats && userStats.angleAccuracy) {
      const recentPractices = userStats.angleAccuracy
        .slice(-10)
        .reverse()
        .map((practice, index) => ({
          id: index,
          error: practice.error,
          accuracy: this.calculateAccuracy(practice.error),
          timestamp: this.formatTime(practice.timestamp),
          grade: this.getGrade(practice.error)
        }));
      
      this.setData({ recentPractices });
    }
  },

  calculateAccuracy(error) {
    // 根据误差计算准确率
    if (error <= 2) return 95 + (2 - error) * 2.5;
    if (error <= 5) return 85 + (5 - error) * 3.33;
    if (error <= 10) return 70 + (10 - error) * 3;
    if (error <= 20) return 50 + (20 - error) * 2;
    return Math.max(20, 50 - error);
  },

  getGrade(error) {
    if (error <= 2) return 'S';
    if (error <= 5) return 'A';
    if (error <= 10) return 'B';
    if (error <= 20) return 'C';
    return 'D';
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  },

  generateChartData() {
    const { angleAccuracy } = this.data.userStats;
    if (!angleAccuracy || angleAccuracy.length === 0) return;

    // 生成最近7天的数据
    const chartData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      
      const dayPractices = angleAccuracy.filter(practice => {
        const practiceDate = new Date(practice.timestamp);
        return practiceDate.toLocaleDateString() === dateStr;
      });
      
      const avgError = dayPractices.length > 0 
        ? dayPractices.reduce((sum, p) => sum + p.error, 0) / dayPractices.length
        : 0;
      
      chartData.push({
        date: this.formatDate(date),
        count: dayPractices.length,
        avgError: avgError.toFixed(1),
        accuracy: dayPractices.length > 0 ? this.calculateAccuracy(avgError) : 0
      });
    }
    
    this.setData({ chartData });
  },

  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  },

  checkAchievements() {
    const { totalPractices, averageError, bestStreak } = this.data.userStats;
    const achievements = [];

    // 定义成就条件
    const achievementRules = [
      {
        id: 'first_practice',
        title: '初次尝试',
        desc: '完成第一次练习',
        condition: totalPractices >= 1,
        icon: '🎯'
      },
      {
        id: 'practice_10',
        title: '勤学苦练',
        desc: '完成10次练习',
        condition: totalPractices >= 10,
        icon: '📚'
      },
      {
        id: 'practice_50',
        title: '练习达人',
        desc: '完成50次练习',
        condition: totalPractices >= 50,
        icon: '🏆'
      },
      {
        id: 'accuracy_master',
        title: '精准射手',
        desc: '平均误差小于5度',
        condition: averageError < 5 && totalPractices >= 10,
        icon: '🎪'
      },
      {
        id: 'streak_master',
        title: '连击高手',
        desc: '最高连续成功10次',
        condition: bestStreak >= 10,
        icon: '⚡'
      }
    ];

    achievementRules.forEach(rule => {
      if (rule.condition) {
        achievements.push({
          ...rule,
          unlocked: true,
          unlockedAt: new Date().toLocaleDateString()
        });
      } else {
        achievements.push({
          ...rule,
          unlocked: false
        });
      }
    });

    this.setData({ achievements });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有统计数据吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const resetStats = {
            totalPractices: 0,
            angleAccuracy: [],
            averageError: 0,
            bestStreak: 0,
            currentStreak: 0,
            practiceHistory: [],
            achievements: []
          };
          
          wx.setStorageSync('poolTrainerStats', resetStats);
          this.setData({ 
            userStats: resetStats,
            recentPractices: [],
            chartData: [],
            achievements: []
          });
          
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  exportData() {
    const data = {
      userInfo: this.data.userInfo,
      userStats: this.data.userStats,
      exportTime: new Date().toISOString()
    };
    
    wx.showModal({
      title: '导出数据',
      content: '数据已生成，请联系开发者获取完整导出功能',
      success: () => {
        console.log('Export data:', data);
      }
    });
  },

  shareStats() {
    const { totalPractices, averageError } = this.data.userStats;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
}); 