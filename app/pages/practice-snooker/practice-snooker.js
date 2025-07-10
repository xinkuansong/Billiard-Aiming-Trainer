// 斯诺克台球桌逻辑尺寸
const LOGICAL_TABLE_WIDTH = 800;
const LOGICAL_TABLE_HEIGHT = 400; 
// 逻辑球径
const LOGICAL_BALL_RADIUS = 11;

Page({
  data: {
    showAiming: false,
    showAngle: false,
    angleInfo: '请先点击下方球袋',
    distanceInfo: '',
    practiceCount: 0,
    targetPocket: '请点击球袋',
    selectedPocketIndex: -1,
    stats: { total: 0, success: 0, totalError: 0 },
    successRate: 0 // 新增：成功率，由JS计算
  },

  onReady: async function() {
    await this.initCanvas();
    this.initTable();
    this.generateNewPosition();
    this.loadStats(); // 加载统计数据
  },

  initCanvas() {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('#poolTable')
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

  initTable() {
    this.pockets = [
      { x: 25, y: 25, name: '左上角袋' },
      { x: LOGICAL_TABLE_WIDTH / 2, y: 15, name: '顶中袋' },
      { x: LOGICAL_TABLE_WIDTH - 25, y: 25, name: '右上角袋' },
      { x: 25, y: LOGICAL_TABLE_HEIGHT - 25, name: '左下角袋' },
      { x: LOGICAL_TABLE_WIDTH / 2, y: LOGICAL_TABLE_HEIGHT - 15, name: '底中袋' },
      { x: LOGICAL_TABLE_WIDTH - 25, y: LOGICAL_TABLE_HEIGHT - 25, name: '右下角袋' }
    ];
  },

  generateNewPosition() {
    this.cueBall = { x: Math.random() * (LOGICAL_TABLE_WIDTH - 200) + 100, y: Math.random() * (LOGICAL_TABLE_HEIGHT - 100) + 50 };
    this.targetBall = { x: Math.random() * (LOGICAL_TABLE_WIDTH - 200) + 100, y: Math.random() * (LOGICAL_TABLE_HEIGHT - 100) + 50 };
    if (Math.hypot(this.cueBall.x - this.targetBall.x, this.cueBall.y - this.targetBall.y) < LOGICAL_BALL_RADIUS * 3) {
      this.generateNewPosition(); 
      return;
    }

    // 自动寻找最佳袋口
    const bestPocket = this.findBestPocket();
    
    if (bestPocket) {
      const { angle, distance } = this.calculateAngle(bestPocket.index);
      this.setData({
        showResult: false,
        predictedAngle: '',
        angleInfo: `角度: ${angle.toFixed(1)}°`,
        distanceInfo: `距离: ${distance}cm`,
        selectedPocketIndex: bestPocket.index,
        targetPocketName: POCKET_NAMES[bestPocket.index]
      });
    } else {
      // 如果没有找到合适的袋口，重新生成球位
      this.generateNewPosition();
      return;
    }

    this.drawScene();
    this.clearGhostBallView();
  },

  drawScene() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const scaleX = this.actualWidth / LOGICAL_TABLE_WIDTH;
    const scaleY = this.actualHeight / LOGICAL_TABLE_HEIGHT;

    ctx.clearRect(0, 0, this.actualWidth, this.actualHeight);
    ctx.fillStyle = '#0f5132';
    ctx.fillRect(0, 0, this.actualWidth, this.actualHeight);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.actualWidth - 4, this.actualHeight - 4);

    this.pockets.forEach((pocket, index) => {
      ctx.fillStyle = index === this.data.selectedPocketIndex ? '#ffd700' : '#000';
      ctx.beginPath();
      ctx.arc(pocket.x * scaleX, pocket.y * scaleY, 18 * scaleX, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (this.data.showAiming && this.data.selectedPocketIndex !== -1) {
      this.drawAimingLines(scaleX, scaleY);
    }
    this.drawBall(this.cueBall, '#fff', scaleX, scaleY);
    this.drawBall(this.targetBall, '#ff0000', scaleX, scaleY);
  },

  drawBall(ball, color, scaleX, scaleY) {
    const radius = LOGICAL_BALL_RADIUS * scaleX;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(ball.x * scaleX, ball.y * scaleY, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  },

  drawAimingLines(scaleX, scaleY) {
    const pocket = this.pockets[this.data.selectedPocketIndex];
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.cueBall.x * scaleX, this.cueBall.y * scaleY);
    this.ctx.lineTo(this.targetBall.x * scaleX, this.targetBall.y * scaleY);
    this.ctx.stroke();
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.moveTo(this.targetBall.x * scaleX, this.targetBall.y * scaleY);
    this.ctx.lineTo(pocket.x * scaleX, pocket.y * scaleY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    if (this.data.showAngle) this.calculateAndShowAngle();
  },

  calculateAndShowAngle() {
    const pocket = this.pockets[this.data.selectedPocketIndex];
    const cueAngle = Math.atan2(this.targetBall.y - this.cueBall.y, this.targetBall.x - this.cueBall.x);
    const pocketAngle = Math.atan2(pocket.y - this.targetBall.y, pocket.x - this.targetBall.x);
    let angleDiff = Math.abs(cueAngle - pocketAngle) * 180 / Math.PI;
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    const distance = Math.sqrt(Math.pow(this.cueBall.x - this.targetBall.x, 2) + Math.pow(this.cueBall.y - this.targetBall.y, 2));
    const realDistance = (distance / LOGICAL_TABLE_WIDTH * 365.8).toFixed(1);
    this.setData({
      angleInfo: `击球角度: ${angleDiff.toFixed(1)}°`,
      distanceInfo: `击球距离: ${realDistance} cm`
    });
  },

  onTableTap(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.detail.x - rect.left;
    const y = e.detail.y - rect.top;
    const scaleX = this.actualWidth / LOGICAL_TABLE_WIDTH;

    this.pockets.forEach((pocket, index) => {
      const distance = Math.sqrt(Math.pow(x - pocket.x * scaleX, 2) + Math.pow(y - pocket.y * scaleX, 2));
      if (distance <= 25 * scaleX) {
        this.setData({
          selectedPocketIndex: index,
          targetPocket: pocket.name,
          angleInfo: '',
          distanceInfo: ''
        });
        if (this.data.showAiming) this.calculateAndShowAngle();
        this.drawScene();
      }
    });
  },

  toggleAimingLines() {
    if (this.data.selectedPocketIndex === -1) {
      wx.showToast({ title: '请先选袋', icon: 'none' });
      return;
    }
    this.setData({ showAiming: !this.data.showAiming });
    this.drawScene();
  },

  showAngleValue() {
    if (!this.data.showAiming) {
      wx.showToast({ title: '请先显示瞄准线', icon: 'none' });
      return;
    }
    this.setData({ showAngle: !this.data.showAngle });
    if (this.data.showAngle) {
      this.calculateAndShowAngle();
    } else {
      this.setData({ angleInfo: '', distanceInfo: '' });
    }
  },

  resetPractice() {
    this.setData({ practiceCount: 0 });
    this.generateNewPosition();
  },

  loadStats() {
    const stats = wx.getStorageSync('snookerStats');
    if (stats) {
      this.setData({ 
        stats: stats,
        successRate: stats.total > 0 ? (stats.success / stats.total * 100).toFixed(0) : 0
      });
    }
  },

  updateStats(isSuccess, error) {
    let { total, success, totalError } = this.data.stats;
    total++;
    if (isSuccess) success++;
    totalError += error;

    const newSuccessRate = total > 0 ? (success / total * 100).toFixed(0) : 0;

    this.setData({
      'stats.total': total,
      'stats.success': success,
      'stats.totalError': totalError,
      successRate: newSuccessRate // 更新成功率
    });
  },

  goBack() {
    wx.navigateBack();
  }
}); 