// 逻辑尺寸
const LOGICAL_CANVAS_SIZE = 300;
const LOGICAL_CENTER_X = LOGICAL_CANVAS_SIZE / 2;
const LOGICAL_CENTER_Y = LOGICAL_CANVAS_SIZE / 2;
const LOGICAL_RADIUS = 120;

Page({
  data: {
    showAnswer: false,
    showReference: false,
    angleInfo: '',
    currentAngle: 0,
    // 练习统计
    stats: {
      total: 0,
      totalError: 0,
      averageError: 0,
    },
    averageErrorDisplay: '--' // 新增：用于显示的平均误差字符串
  },

  onLoad: function() {
    this.loadStats();
  },

  onReady: async function() {
    await this.initCanvas();
    this.generateNewAngle();
  },

  onUnload: function() {
    this.saveStats();
  },

  loadStats() {
    const stats = wx.getStorageSync('anglePracticeStats');
    if (stats) {
      this.setData({ 
        stats: stats,
        averageErrorDisplay: stats.averageError > 0 ? `${stats.averageError}°` : '--'
      });
    }
  },

  saveStats() {
    wx.setStorageSync('anglePracticeStats', this.data.stats);
  },

  initCanvas() {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('#angleCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getSystemInfoSync().pixelRatio;
            this.canvas = canvas;
            this.ctx = ctx;
            this.dpr = dpr;
            this.actualWidth = res[0].width;
            this.actualHeight = res[0].height;
            canvas.width = this.actualWidth * dpr;
            canvas.height = this.actualHeight * dpr;
            ctx.scale(dpr, dpr);
            resolve();
          }
        });
    });
  },

  generateNewAngle() {
    this.currentAngle = Math.random() * 80 + 5;
    this.setData({
      showAnswer: false,
      angleInfo: '',
      currentAngle: this.currentAngle
    });
    this.drawAngle();
  },

  drawAngle() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const scale = this.actualWidth / LOGICAL_CANVAS_SIZE;

    ctx.clearRect(0, 0, this.actualWidth, this.actualHeight);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, this.actualWidth, this.actualHeight);

    if (this.data.showReference) {
      this.drawReferenceLines(scale);
    }
    this.drawAngleLines(this.currentAngle, scale);
    this.drawAngleArc(this.currentAngle, scale);
  },

  drawReferenceLines(scale) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    const referenceAngles = [15, 30, 45, 60, 75];
    referenceAngles.forEach(angle => {
      const rad = angle * Math.PI / 180;
      const endX = (LOGICAL_CENTER_X + Math.cos(rad) * LOGICAL_RADIUS) * scale;
      const endY = (LOGICAL_CENTER_Y - Math.sin(rad) * LOGICAL_RADIUS) * scale;
      ctx.beginPath();
      ctx.moveTo(LOGICAL_CENTER_X * scale, LOGICAL_CENTER_Y * scale);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  },

  drawAngleLines(angle, scale) {
    const ctx = this.ctx;
    const rad = angle * Math.PI / 180;
    const centerX = LOGICAL_CENTER_X * scale;
    const centerY = LOGICAL_CENTER_Y * scale;
    const radius = LOGICAL_RADIUS * scale;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();

    const endX = centerX + Math.cos(rad) * radius;
    const endY = centerY - Math.sin(rad) * radius;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 * scale, 0, 2 * Math.PI);
    ctx.fill();
  },

  drawAngleArc(angle, scale) {
    const ctx = this.ctx;
    const rad = angle * Math.PI / 180;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(LOGICAL_CENTER_X * scale, LOGICAL_CENTER_Y * scale, 30 * scale, 0, -rad, true);
    ctx.stroke();

    if (this.data.showAnswer) {
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${16 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.currentAngle.toFixed(1) + '°', (LOGICAL_CENTER_X + 45) * scale, (LOGICAL_CENTER_Y - 10) * scale);
    }
  },

  showAngleValue() {
    // 仅在第一次显示答案时计算统计
    if (!this.data.showAnswer) {
      const predictedAngle = parseFloat(this.data.predictedAngle);
      if (isNaN(predictedAngle)) {
        wx.showToast({ title: '请输入角度', icon: 'none' });
        return;
      }

      const error = Math.abs(predictedAngle - this.currentAngle);
      const newTotal = this.data.stats.total + 1;
      const newTotalError = this.data.stats.totalError + error;
      const newAverageError = newTotalError / newTotal;

      this.setData({
        'stats.total': newTotal,
        'stats.totalError': newTotalError,
        'stats.averageError': newAverageError.toFixed(1),
        angleInfo: `真: ${this.currentAngle.toFixed(1)}° 错: ${error.toFixed(1)}°`,
        averageErrorDisplay: `${newAverageError.toFixed(1)}°` // 更新显示的字符串
      });
    }

    this.setData({ showAnswer: true });
    this.drawAngle();
  },

  onAngleInput(e) {
    this.setData({
      predictedAngle: e.detail.value
    });
  },

  toggleReference() {
    this.setData({ showReference: !this.data.showReference });
    this.drawAngle();
  },

  resetPractice() {
    this.setData({
      stats: {
        total: 0,
        totalError: 0,
        averageError: 0,
      },
      angleInfo: '',
      predictedAngle: '',
      averageErrorDisplay: '--' // 重置显示的字符串
    });
    this.saveStats(); // 重置后也保存
    this.generateNewAngle();
  },
  
  goBack() {
    wx.navigateBack();
  }
}); 