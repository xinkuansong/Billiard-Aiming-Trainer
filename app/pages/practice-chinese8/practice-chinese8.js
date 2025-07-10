// pages/practice-chinese8/practice-chinese8.js
// Simplified for debugging purposes

// 逻辑尺寸，所有计算基于此
const LOGICAL_TABLE_WIDTH = 800;
const LOGICAL_TABLE_HEIGHT = 400;
const LOGICAL_BALL_RADIUS = 12; // 逻辑球径
const GHOST_CANVAS_SIZE = 200; // 假想球画布大小
const POCKET_NAMES = ["左下", "中下", "右下", "右上", "中上", "左上"];

Page({
  data: {
    predictedAngle: '',
    showResult: false,
    angleInfo: '',
    distanceInfo: '',
    targetPocketName: '请点击球袋',
    selectedPocketIndex: -1,
    stats: { total: 0, success: 0, totalError: 0 },
    successRate: 0 // 新增：成功率，由JS计算
  },

  onReady: async function() {
    this.loadStats();
    await this.initTableCanvas();
    await this.initGhostBallCanvas();
    this.generateNewPosition();
  },

  onUnload: function() {
    this.saveStats();
  },

  // #region 初始化
  initTableCanvas() {
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
            
            this.pockets = [
                { x: 35, y: 35, name: '左上角袋' }, { x: LOGICAL_TABLE_WIDTH / 2, y: 28, name: '顶中袋' },
                { x: LOGICAL_TABLE_WIDTH - 35, y: 35, name: '右上角袋' }, { x: 35, y: LOGICAL_TABLE_HEIGHT - 35, name: '左下角袋' },
                { x: LOGICAL_TABLE_WIDTH / 2, y: LOGICAL_TABLE_HEIGHT - 28, name: '底中袋' }, { x: LOGICAL_TABLE_WIDTH - 35, y: LOGICAL_TABLE_HEIGHT - 35, name: '右下角袋' }
            ];
            resolve();
          }
        });
    });
  },
  initGhostBallCanvas() {
    return new Promise(resolve => {
      const query = wx.createSelectorQuery();
      query.select('#ghostBallCanvas').fields({ node: true, size: true }).exec(res => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          this.ghostCanvas = canvas;
          this.ghostCtx = ctx;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
        }
        resolve();
      });
    });
  },
  // #endregion

  // #region 核心流程
  generateNewPosition() {
    this.cueBall = { x: Math.random() * (LOGICAL_TABLE_WIDTH - 200) + 100, y: Math.random() * (LOGICAL_TABLE_HEIGHT - 100) + 50 };
    this.targetBall = { x: Math.random() * (LOGICAL_TABLE_WIDTH - 200) + 100, y: Math.random() * (LOGICAL_TABLE_HEIGHT - 100) + 50 };
    if (Math.hypot(this.cueBall.x - this.targetBall.x, this.cueBall.y - this.targetBall.y) < LOGICAL_BALL_RADIUS * 3) {
      this.generateNewPosition(); 
      return;
    }

    // 找出所有可打的袋口
    this.availablePockets = this.findAvailablePockets();
    
    if (this.availablePockets.length > 0) {
      // 默认选择最佳的袋口
      const bestPocket = this.availablePockets[0];
      this.updateTarget(bestPocket.index);
    } else {
      // 如果没有找到合适的袋口，重新生成球位
      this.generateNewPosition();
      return;
    }
  },

  updateTarget(pocketIndex) {
    const { angle, distance } = this.calculateAngle(pocketIndex);
    this.setData({
      showResult: false,
      predictedAngle: '',
      angleInfo: `角度: ${angle.toFixed(1)}°`,
      distanceInfo: ``, // 距离信息暂时移除，可在后续UI中添加
      selectedPocketIndex: pocketIndex,
      targetPocketName: POCKET_NAMES[pocketIndex]
    });

    this.drawScene();
    this.drawGhostBallView(); // 更新瞄准视角
  },

  confirmAngle() {
    if (!this.data.predictedAngle || this.data.selectedPocketIndex === -1) return;
    const predicted = parseFloat(this.data.predictedAngle);
    const actual = this.calculateAngle(this.data.selectedPocketIndex).angle;
    const error = Math.abs(predicted - actual);
    const isSuccess = error <= 2;

    this.updateStats(isSuccess, error);
    this.setData({ showResult: true });
    this.drawScene();
    this.drawGhostBallView();

    wx.showToast({
      title: isSuccess ? `成功! 误差: ${error.toFixed(1)}°` : `失败, 误差: ${error.toFixed(1)}°`,
      icon: isSuccess ? 'success' : 'error',
      duration: 2000
    });
  },
  // #endregion

  // #region 绘图
  drawScene() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { actualWidth, actualHeight } = this;
    const scaleX = actualWidth / LOGICAL_TABLE_WIDTH;
    const scaleY = actualHeight / LOGICAL_TABLE_HEIGHT;

    ctx.clearRect(0, 0, actualWidth, actualHeight);
    ctx.fillStyle = '#0f5132'; // 深绿色背景
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    // 绘制边框
    const PADDING = 10;
    ctx.strokeStyle = '#8B4513'; // 木色
    ctx.lineWidth = PADDING;
    ctx.strokeRect(PADDING / 2, PADDING / 2, actualWidth - PADDING, actualHeight - PADDING);

    // 绘制所有可选球袋
    if (this.availablePockets) {
      this.availablePockets.forEach(pInfo => {
        const pocket = this.pockets[pInfo.index];
        if (pInfo.index === this.data.selectedPocketIndex) {
          ctx.strokeStyle = '#FFD700'; // 金色高亮
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#90EE90'; // 淡绿色
          ctx.lineWidth = 2;
        }
        ctx.beginPath();
        ctx.arc(pocket.x * scaleX, pocket.y * scaleY, 18 * scaleX, 0, 2 * Math.PI);
        ctx.stroke();
      });
    }

    // 绘制正常的袋口（黑色）
    this.pockets.forEach((pocket) => {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(pocket.x * scaleX, pocket.y * scaleY, 16 * scaleX, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (this.data.showResult) {
      this.drawAimingLines(scaleX, scaleY);
    } else if (this.data.selectedPocketIndex !== -1) {
       // 在确认前就绘制角度值
      this.drawAngleIndicator(scaleX, scaleY);
    }
    this.drawBall(this.cueBall, '#fff', scaleX, scaleY);
    this.drawBall(this.targetBall, '#ff0000', scaleX, scaleY);
  },
  
  drawAngleIndicator(scaleX, scaleY) {
    const { angle } = this.calculateAngle(this.data.selectedPocketIndex);
    const targetPos = { x: this.targetBall.x * scaleX, y: this.targetBall.y * scaleY };
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${angle.toFixed(1)}°`, targetPos.x, targetPos.y - 25 * scaleY);
  },

  drawGhostBallView() {
    const ctx = this.ghostCtx;
    if (!ctx || this.data.selectedPocketIndex === -1) {
      this.clearGhostBallView();
      return;
    };
    
    const viewSize = GHOST_CANVAS_SIZE;
    ctx.clearRect(0, 0, viewSize, viewSize);
    ctx.fillStyle = '#1a202c'; // 暗色背景
    ctx.fillRect(0, 0, viewSize, viewSize);

    const pocket = this.pockets[this.data.selectedPocketIndex];
    const ghostBallPos = this.calculateGhostBallPosition(this.targetBall, pocket);
    const { angle } = this.calculateAngle(this.data.selectedPocketIndex);
    
    const d_div_R = 2 * Math.sin(angle * Math.PI / 180 / 2);

    const viewBallRadius = viewSize / 4;
    const viewCenter = { x: viewSize / 2, y: viewSize / 2 };

    const ghostOffset = {
        x: (ghostBallPos.x - this.targetBall.x) / (LOGICAL_BALL_RADIUS * 2) * viewBallRadius * 2,
        y: (ghostBallPos.y - this.targetBall.y) / (LOGICAL_BALL_RADIUS * 2) * viewBallRadius * 2
    };
    
    // 绘制目标球 (红色)
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(viewCenter.x, viewCenter.y, viewBallRadius, 0, 2 * Math.PI);
    ctx.fill();

    // 绘制假想球 (半透明紫色)
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#706fd3';
    ctx.beginPath();
    ctx.arc(viewCenter.x - ghostOffset.x, viewCenter.y - ghostOffset.y, viewBallRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 绘制d/R信息
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`d/R = ${d_div_R.toFixed(2)}`, viewCenter.x, viewSize * 0.2);

    // 绘制辅助线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(viewCenter.x, viewCenter.y - viewBallRadius * 1.5);
    ctx.lineTo(viewCenter.x, viewCenter.y + viewBallRadius * 1.5);
    ctx.moveTo(viewCenter.x - ghostOffset.x, viewCenter.y - viewBallRadius * 1.5);
    ctx.lineTo(viewCenter.x - ghostOffset.x, viewCenter.y + viewBallRadius * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
  },
  
  clearGhostBallView() {
    if (!this.ghostCtx) return;
    this.ghostCtx.clearRect(0, 0, GHOST_CANVAS_SIZE, GHOST_CANVAS_SIZE);
  },
  
  drawBall(ball, color, scaleX, scaleY) {
    const radius = LOGICAL_BALL_RADIUS * scaleX;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(ball.x * scaleX, ball.y * scaleY, radius, 0, 2 * Math.PI);
    this.ctx.fill();
  },
  // #endregion

  // #region 计算

  findAvailablePockets() {
    const availablePockets = [];
    this.pockets.forEach((pocket, index) => {
      const cueVec = { x: this.targetBall.x - this.cueBall.x, y: this.targetBall.y - this.cueBall.y };
      const targetVec = { x: pocket.x - this.targetBall.x, y: pocket.y - this.targetBall.y };
      const dotProduct = cueVec.x * targetVec.x + cueVec.y * targetVec.y;

      if (dotProduct > 0) {
        const angle = Math.acos(dotProduct / (Math.hypot(cueVec.x, cueVec.y) * Math.hypot(targetVec.x, targetVec.y)));
        availablePockets.push({ index, angle });
      }
    });

    // 按角度从小到大排序，角度最小的为最佳
    availablePockets.sort((a, b) => a.angle - b.angle);
    return availablePockets;
  },

  calculateAngle(pocketIndex) {
    const pocket = this.pockets[pocketIndex];
    const ghostBall = this.calculateGhostBallPosition(this.targetBall, pocket);
    
    const cueToTargetVec = { x: this.targetBall.x - this.cueBall.x, y: this.targetBall.y - this.cueBall.y };
    const pocketVec = { x: pocket.x - this.targetBall.x, y: pocket.y - this.targetBall.y };

    const dot = cueToTargetVec.x * pocketVec.x + cueToTargetVec.y * pocketVec.y;
    const magCueToTarget = Math.hypot(cueToTargetVec.x, cueToTargetVec.y);
    const magPocket = Math.hypot(pocketVec.x, pocketVec.y);

    const angle = Math.acos(dot / (magCueToTarget * magPocket)) * 180 / Math.PI;
    const distance = (magCueToTarget / LOGICAL_TABLE_WIDTH * 254).toFixed(1);
    
    return { angle, distance };
  },

  calculateGhostBallPosition(target, pocket) {
    const vector = { x: pocket.x - target.x, y: pocket.y - target.y };
    const mag = Math.hypot(vector.x, vector.y);
    const normalized = { x: vector.x / mag, y: vector.y / mag };
    return {
      x: target.x - normalized.x * (LOGICAL_BALL_RADIUS * 2),
      y: target.y - normalized.y * (LOGICAL_BALL_RADIUS * 2)
    };
  },
  // #endregion

  // #region 事件处理
  onAngleInput(e) {
    this.setData({
      predictedAngle: e.detail.value
    });
  },

  onTableTap(e) {
    if (!this.availablePockets || this.availablePockets.length <= 1) return;

    const scaleX = this.actualWidth / LOGICAL_TABLE_WIDTH;
    const scaleY = this.actualHeight / LOGICAL_TABLE_HEIGHT;
    const logicalX = e.detail.x / scaleX;
    const logicalY = e.detail.y / scaleY;

    // 在可选的袋口中查找点击目标
    for (const pocketInfo of this.availablePockets) {
      const pocket = this.pockets[pocketInfo.index];
      if (Math.hypot(pocket.x - logicalX, pocket.y - logicalY) < 25) {
        if (pocketInfo.index !== this.data.selectedPocketIndex) {
          this.updateTarget(pocketInfo.index);
        }
        break;
      }
    }
  },

  // #endregion

  // #region 数据统计
  loadStats() {
    const stats = wx.getStorageSync('chinese8Stats');
    if (stats) {
      this.setData({ 
        stats: stats,
        successRate: stats.total > 0 ? (stats.success / stats.total * 100).toFixed(0) : 0
      });
    }
  },

  saveStats() {
    wx.setStorageSync('chinese8Stats', this.data.stats);
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

  goBack() { wx.navigateBack(); }
  // #endregion
});