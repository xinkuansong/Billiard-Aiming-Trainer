// 台球瞄准训练器主要逻辑
class PoolTrainer {
    constructor() {
        this.tableCanvas = document.getElementById('poolTable');
        this.tableCtx = this.tableCanvas.getContext('2d');
        this.aimCanvas = document.getElementById('aimView');
        this.aimCtx = this.aimCanvas.getContext('2d');
        
        // 台球桌尺寸（按实际比例缩放）
        this.tableWidth = 760;
        this.tableHeight = 380;
        this.tableOffsetX = 20;
        this.tableOffsetY = 10;
        
        // 球的半径
        this.ballRadius = 11;
        
        // 球位置
        this.cueBall = { x: 0, y: 0 };
        this.targetBall = { x: 0, y: 0 };
        
        // 球袋位置（标准台球桌6个球袋）
        this.pockets = [
            { x: this.tableOffsetX, y: this.tableOffsetY }, // 左上
            { x: this.tableOffsetX + this.tableWidth / 2, y: this.tableOffsetY }, // 中上
            { x: this.tableOffsetX + this.tableWidth, y: this.tableOffsetY }, // 右上
            { x: this.tableOffsetX, y: this.tableOffsetY + this.tableHeight }, // 左下
            { x: this.tableOffsetX + this.tableWidth / 2, y: this.tableOffsetY + this.tableHeight }, // 中下
            { x: this.tableOffsetX + this.tableWidth, y: this.tableOffsetY + this.tableHeight } // 右下
        ];
        
        // 所有可能的目标球袋
        this.availablePockets = [];
        this.selectedPocketIndex = 0;
        
        // 显示状态
        this.showAimingLines = false;
        
        // 角度生成器相关
        this.angleCanvas = document.getElementById('angleCanvas');
        this.angleCtx = this.angleCanvas.getContext('2d');
        this.randomAngle = 0;
        this.showAngleValue = false;
        this.showReferenceAngles = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.generateRandomPositions();
        this.drawTable();
        this.initAngleGenerator();
    }
    
    bindEvents() {
        document.getElementById('randomPositions').addEventListener('click', () => {
            this.generateRandomPositions();
            this.showAimingLines = false;
            this.updateStats();
        });
        
        document.getElementById('showAimingLines').addEventListener('click', () => {
            this.showAimingLines = !this.showAimingLines;
            this.drawTable();
            this.drawAimView();
            this.updateStats();
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.showAimingLines = false;
            this.generateRandomPositions();
            this.updateStats();
        });
        
        // 添加球袋选择功能
        this.tableCanvas.addEventListener('click', (e) => {
            this.handlePocketSelection(e);
        });
        
        // 角度生成器事件监听
        document.getElementById('generateRandomAngle').addEventListener('click', () => {
            this.generateRandomAngle();
        });
        
        document.getElementById('showAngleValue').addEventListener('click', () => {
            this.toggleAngleValue();
        });
        
        document.getElementById('resetAngle').addEventListener('click', () => {
            this.resetAngleGenerator();
        });
        
        document.getElementById('toggleReference').addEventListener('click', () => {
            this.toggleReferenceAngles();
        });
    }
    
    generateRandomPositions() {
        // 生成随机的白球位置
        this.cueBall.x = this.tableOffsetX + this.ballRadius * 2 + Math.random() * (this.tableWidth - this.ballRadius * 4);
        this.cueBall.y = this.tableOffsetY + this.ballRadius * 2 + Math.random() * (this.tableHeight - this.ballRadius * 4);
        
        // 生成随机的目标球位置（确保不与白球重叠）
        do {
            this.targetBall.x = this.tableOffsetX + this.ballRadius * 2 + Math.random() * (this.tableWidth - this.ballRadius * 4);
            this.targetBall.y = this.tableOffsetY + this.ballRadius * 2 + Math.random() * (this.tableHeight - this.ballRadius * 4);
        } while (this.getDistance(this.cueBall, this.targetBall) < this.ballRadius * 6);
        
        // 找出所有合理的目标袋（排除角度过大的）
        this.findAvailablePockets();
        this.selectedPocketIndex = 0;
        
        // 重置显示状态
        this.showAimingLines = false;
        
        this.drawTable();
        this.drawAimView();
    }
    
    findAvailablePockets() {
        this.availablePockets = [];
        
        // 检查每个球袋是否为合理的目标
        this.pockets.forEach((pocket, index) => {
            const distance = this.getDistance(this.targetBall, pocket);
            
            // 排除距离过近的球袋（避免不现实的角度）
            if (distance > this.ballRadius * 4) {
                // 计算白球-目标球-袋口的角度
                const dx1 = this.targetBall.x - this.cueBall.x;
                const dy1 = this.targetBall.y - this.cueBall.y;
                const dx2 = pocket.x - this.targetBall.x;
                const dy2 = pocket.y - this.targetBall.y;
                
                // 计算两个向量的点积
                const dot = dx1 * dx2 + dy1 * dy2;
                // 计算两个向量的长度
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                // 计算角度（弧度）
                const angle = Math.acos(dot / (len1 * len2));
                // 转换为角度
                const angleDegrees = this.radiansToDegrees(angle);

                this.availablePockets.push({
                    pocket: pocket,
                    index: index,
                    distance: distance,
                    angle: angleDegrees
                });
            }
        });
        
        // 按角度排序，优先选择角度小于90度的球袋
        this.availablePockets.sort((a, b) => {
            // 如果一个角度小于90度而另一个大于90度，优先选择小于90度的
            if (a.angle <= 90 && b.angle > 90) return -1;
            if (a.angle > 90 && b.angle <= 90) return 1;
            // 如果都小于90度或都大于90度，按角度大小排序
            return a.angle - b.angle;
        });

        // 如果没有可用的球袋，保持当前选择
        if (this.availablePockets.length > 0) {
            this.selectedPocketIndex = 0;
        }
    }
    
    handlePocketSelection(event) {
        const rect = this.tableCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 检查点击是否在某个可用球袋附近
        for (let i = 0; i < this.availablePockets.length; i++) {
            const pocket = this.availablePockets[i].pocket;
            const distance = this.getDistance({ x, y }, pocket);
            
            if (distance < 25) { // 25像素的点击范围
                this.selectedPocketIndex = i;
                // 如果已经在显示角度，切换袋口时自动隐藏角度
                if (this.showAimingLines) {
                    this.showAimingLines = false;
                }
                this.drawTable();
                this.drawAimView();
                this.updateStats();
                break;
            }
        }
    }
    
    getSelectedPocket() {
        if (this.availablePockets.length > 0 && this.selectedPocketIndex < this.availablePockets.length) {
            return this.availablePockets[this.selectedPocketIndex].pocket;
        }
        return null;
    }
    
    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAngle(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.atan2(dy, dx);
    }
    
    drawTable() {
        const ctx = this.tableCtx;
        
        // 清空画布
        ctx.clearRect(0, 0, this.tableCanvas.width, this.tableCanvas.height);
        
        // 绘制台球桌
        ctx.fillStyle = '#0f5132';
        ctx.fillRect(this.tableOffsetX, this.tableOffsetY, this.tableWidth, this.tableHeight);
        
        // 绘制台球桌边框
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 8;
        ctx.strokeRect(this.tableOffsetX - 4, this.tableOffsetY - 4, this.tableWidth + 8, this.tableHeight + 8);
        
        // 绘制球袋
        this.pockets.forEach(pocket => {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, 15, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // 绘制可用球袋的指示
        this.availablePockets.forEach((availablePocket, index) => {
            const pocket = availablePocket.pocket;
            if (index === this.selectedPocketIndex) {
                // 选中的球袋用金色高亮
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pocket.x, pocket.y, 18, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // 其他可用球袋用绿色虚线
                ctx.strokeStyle = '#90EE90';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(pocket.x, pocket.y, 18, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
        
        // 绘制瞄准线
        if (this.showAimingLines) {
            this.drawAimingLines();
        }
        
        // 绘制球
        this.drawBall(this.cueBall, '#fff');
        this.drawBall(this.targetBall, '#ff0000');
    }
    
    drawBall(ball, color) {
        const ctx = this.tableCtx;
        
        // 绘制球的阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 2, this.ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制球
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, this.ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制球的高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(ball.x - 3, ball.y - 3, this.ballRadius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制球的边框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, this.ballRadius, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    drawAimingLines() {
        const ctx = this.tableCtx;
        const selectedPocket = this.getSelectedPocket();
        
        if (!selectedPocket) return;
        
        // 计算目标球到袋口的线
        const pocketLine = this.calculatePocketLine();
        // 计算白球到目标球的线
        const cueLine = this.calculateCueLine();
        
        if (!pocketLine || !cueLine) return;
        
        // 延长线的长度系数（增加到2倍）
        const extensionFactor = 2;
        
        // 绘制目标球到袋口的虚线（延长线）
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 计算延长线的终点
        const pocketExtendedEnd = {
            x: this.targetBall.x + (selectedPocket.x - this.targetBall.x) * extensionFactor,
            y: this.targetBall.y + (selectedPocket.y - this.targetBall.y) * extensionFactor
        };
        
        // 计算延长线的起点（向后延伸）
        const pocketExtendedStart = {
            x: this.targetBall.x - (selectedPocket.x - this.targetBall.x) * extensionFactor,
            y: this.targetBall.y - (selectedPocket.y - this.targetBall.y) * extensionFactor
        };
        
        ctx.moveTo(pocketExtendedStart.x, pocketExtendedStart.y);
        ctx.lineTo(pocketExtendedEnd.x, pocketExtendedEnd.y);
        ctx.stroke();

        // 绘制假想球 - 在目标球到袋口的反方向
        const angle = pocketLine.angle;
        const phantomBall = {
            x: this.targetBall.x - Math.cos(angle) * (this.ballRadius * 2), // 注意这里是减号，表示反方向
            y: this.targetBall.y - Math.sin(angle) * (this.ballRadius * 2)  // 注意这里是减号，表示反方向
        };
        
        // 绘制假想球（半透明）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(phantomBall.x, phantomBall.y, this.ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制假想球的边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(phantomBall.x, phantomBall.y, this.ballRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 绘制连接假想球和白球中心的虚线
        ctx.beginPath();
        ctx.setLineDash([3, 3]);  // 使用更短的虚线间隔
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.moveTo(phantomBall.x, phantomBall.y);
        ctx.lineTo(this.cueBall.x, this.cueBall.y);
        ctx.stroke();
        ctx.setLineDash([5, 5]);  // 恢复原来的虚线间隔
        
        // 绘制白球到目标球的虚线（延长线）
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 计算延长线的终点
        const cueExtendedEnd = {
            x: this.targetBall.x + (this.targetBall.x - this.cueBall.x) * extensionFactor,
            y: this.targetBall.y + (this.targetBall.y - this.cueBall.y) * extensionFactor
        };
        
        // 计算延长线的起点（向后延伸）
        const cueExtendedStart = {
            x: this.cueBall.x - (this.targetBall.x - this.cueBall.x) * extensionFactor,
            y: this.cueBall.y - (this.targetBall.y - this.cueBall.y) * extensionFactor
        };
        
        ctx.moveTo(cueExtendedStart.x, cueExtendedStart.y);
        ctx.lineTo(cueExtendedEnd.x, cueExtendedEnd.y);
        ctx.stroke();
        
        // 重置虚线设置
        ctx.setLineDash([]);
        
        // 绘制角度指示器（在目标球位置）
        this.drawAngleIndicator(this.targetBall, pocketLine.angle, cueLine.angle);
        
        // 绘制角度信息
        this.drawAngleInfo(ctx);
    }
    
    calculatePocketLine() {
        const selectedPocket = this.getSelectedPocket();
        if (!selectedPocket) return { angle: 0, degrees: 0 };
        
        const angle = this.getAngle(this.targetBall, selectedPocket);
        return {
            angle: angle,
            degrees: this.radiansToDegrees(angle)
        };
    }
    
    calculateCueLine() {
        // 计算白球到目标球中心的角度
        const cueAngle = this.getAngle(this.cueBall, this.targetBall);
        
        return {
            angle: cueAngle,
            degrees: this.radiansToDegrees(cueAngle)
        };
    }
    
    drawAngleIndicator(center, angle1, angle2) {
        const ctx = this.tableCtx;
        const radius = 30;
        
        // 确保角度在正确的范围内
        let startAngle = Math.min(angle1, angle2);
        let endAngle = Math.max(angle1, angle2);
        
        // 处理跨越360度的情况
        if (endAngle - startAngle > Math.PI) {
            [startAngle, endAngle] = [endAngle, startAngle + 2 * Math.PI];
        }
        
        // 绘制角度扇形
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // 绘制角度文本
        const midAngle = (startAngle + endAngle) / 2;
        const textX = center.x + Math.cos(midAngle) * (radius + 15);
        const textY = center.y + Math.sin(midAngle) * (radius + 15);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const angleDiff = Math.abs(endAngle - startAngle);
        ctx.fillText(this.radiansToDegrees(angleDiff).toFixed(1) + '°', textX, textY);
    }
    
    drawAngleInfo(ctx) {
        // 删除角度信息显示
    }
    
    drawAimView() {
        const ctx = this.aimCtx;
        ctx.clearRect(0, 0, this.aimCanvas.width, this.aimCanvas.height);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, this.aimCanvas.width, this.aimCanvas.height);
        if (!this.showAimingLines) {
            ctx.fillStyle = '#ccc';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('点击"显示瞄准线和角度"', this.aimCanvas.width / 2, this.aimCanvas.height / 2 - 10);
            ctx.fillText('查看球体重叠效果', this.aimCanvas.width / 2, this.aimCanvas.height / 2 + 10);
            return;
        }
        // 上半部分：假想球-目标球重叠
        const viewWidth = this.aimCanvas.width;
        const viewHeight = this.aimCanvas.height;
        const halfHeight = viewHeight / 2;
        const ballRadius = 40;
        // 画布中心为假想球
        const centerX = viewWidth / 2;
        const centerY = halfHeight / 2 + 10;
        // 计算目标球到袋口方向
        const pocketLine = this.calculatePocketLine();
        const pocketAngle = pocketLine.angle;
        // 假想球在上半部分中心
        const phantomX = centerX;
        const phantomY = centerY;
        // 目标球在假想球正前方
        const redX = centerX + Math.cos(pocketAngle) * ballRadius * 2;
        const redY = centerY + Math.sin(pocketAngle) * ballRadius * 2;
        // 绘制目标球（红球）
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(redX, redY, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        // 绘制假想球（白色）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(phantomX, phantomY, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
        // 计算重叠区域
        const dist = Math.sqrt((phantomX - redX) * (phantomX - redX) + (phantomY - redY) * (phantomY - redY));
        let overlap = 0;
        if (dist < 2 * ballRadius) {
            overlap = 2 * Math.sqrt(ballRadius * ballRadius - Math.pow(dist / 2, 2));
            ctx.save();
            ctx.globalAlpha = 0.5;
            const theta = Math.acos(dist / (2 * ballRadius));
            ctx.beginPath();
            ctx.arc(phantomX, phantomY, ballRadius, pocketAngle + theta, pocketAngle - theta, true);
            ctx.arc(redX, redY, ballRadius, pocketAngle + Math.PI - theta, pocketAngle + Math.PI + theta, false);
            ctx.closePath();
            ctx.fillStyle = '#a259f7';
            ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        let percent = dist < 2 * ballRadius ? (overlap / (2 * ballRadius) * 100).toFixed(1) : '0.0';
        ctx.fillText(`重叠区域占球直径比例：${percent}%`, viewWidth / 2, centerY + ballRadius + 30);
        // 下半部分：白球第一视角重叠
        this.drawFirstPersonOverlap(ctx, viewWidth, viewHeight, ballRadius, pocketAngle);
    }

    // 第一视角重叠图：从白球中心看向假想球，显示圆形重叠
    drawFirstPersonOverlap(ctx, viewWidth, viewHeight, ballRadius, pocketAngle) {
        const cueBall = this.cueBall;
        const targetBall = this.targetBall;
        const pocket = this.getSelectedPocket();
        if (!cueBall || !targetBall || !pocket) return;

        // 1. 计算目标球到袋口的单位向量
        const dx_tp = pocket.x - targetBall.x;
        const dy_tp = pocket.y - targetBall.y;
        const dist_tp = Math.sqrt(dx_tp * dx_tp + dy_tp * dy_tp);
        const dir_tp = {
            x: dx_tp / dist_tp,
            y: dy_tp / dist_tp
        };

        // 2. 计算假想球位置（在目标球后方2R处）
        const imaginaryBall = {
            x: targetBall.x + dir_tp.x * 2 * ballRadius,
            y: targetBall.y + dir_tp.y * 2 * ballRadius
        };

        // 3. 计算白球到目标球的单位向量（视线方向）
        const dx_wt = targetBall.x - cueBall.x;
        const dy_wt = targetBall.y - cueBall.y;
        const dist_wt = Math.sqrt(dx_wt * dx_wt + dy_wt * dy_wt);
        const dir_wt = {
            x: dx_wt / dist_wt,
            y: dy_wt / dist_wt
        };

        // 4. 计算目标球到假想球的向量与视线方向的夹角
        const angle = Math.acos(dir_tp.x * dir_wt.x + dir_tp.y * dir_wt.y);
        
        // 5. 计算d/R比例
        // d = 2R * sin(angle)
        // d/R = 2 * sin(angle)
        const dist_ratio = 2 * Math.sin(angle);

        const centerX = viewWidth / 2;
        const centerY = viewHeight / 2;
        const displayRadius = 40;
        const lineExtension = 20;

        // 清除区域
        ctx.clearRect(0, centerY - 150, viewWidth, 300);

        // 绘制背景
        ctx.fillStyle = 'black';
        ctx.fillRect(0, centerY - 150, viewWidth, 300);

        // 绘制假想球（紫色）
        ctx.beginPath();
        ctx.arc(centerX, centerY, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(162,89,247,0.7)';
        ctx.fill();

        // 绘制假想球的垂直直径（白色虚线）
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.moveTo(centerX, centerY - displayRadius - lineExtension);
        ctx.lineTo(centerX, centerY + displayRadius + lineExtension);
        ctx.stroke();

        // 绘制目标球（红色）
        const targetX = centerX - dist_ratio * ballRadius * (displayRadius / ballRadius);
        ctx.beginPath();
        ctx.arc(targetX, centerY, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.fill();

        // 绘制目标球的垂直直径（白色虚线）
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.moveTo(targetX, centerY - displayRadius - lineExtension);
        ctx.lineTo(targetX, centerY + displayRadius + lineExtension);
        ctx.stroke();

        // 重置虚线设置
        ctx.setLineDash([]);

        // 显示距离比例
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        
        const ratio_text = `d/R = ${dist_ratio.toFixed(2)}`;
        let compare_text = '';
        if (dist_ratio <= 0.25) {
            compare_text = '≤ 1/4';
        } else if (dist_ratio <= 1/3) {
            compare_text = '∈ (1/4, 1/3]';
        } else if (dist_ratio <= 0.5) {
            compare_text = '∈ (1/3, 1/2]';
        } else if (dist_ratio <= 1) {
            compare_text = '∈ (1/2, 1]';
        } else {
            compare_text = '> 1';
        }
        ctx.fillText(`${ratio_text} ${compare_text}`, centerX, centerY - 70);
    }
    
    updateStats() {
        const angleInfoElement = document.getElementById('angleInfo');
        
        if (this.showAimingLines && this.getSelectedPocket()) {
            const selectedPocket = this.getSelectedPocket();
            const pocketIndex = this.pockets.findIndex(p => p === selectedPocket);
            const pocketNames = ['左上袋', '中上袋', '右上袋', '左下袋', '中下袋', '右下袋'];
            const pocketName = pocketNames[pocketIndex] || '未知';
            
            angleInfoElement.textContent = `目标: ${pocketName} | 点击球袋可切换目标`;
        } else {
            angleInfoElement.textContent = this.availablePockets.length > 0 ? 
                '点击球袋选择目标，然后显示瞄准线查看角度信息' : 
                '点击"随机生成球位"开始练习';
        }
    }
    
    radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    
    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // 角度生成器相关方法
    initAngleGenerator() {
        this.drawAngleCanvas();
    }
    
    generateRandomAngle() {
        // 生成0-90度的随机角度
        this.randomAngle = Math.random() * 90;
        this.showAngleValue = false;
        this.drawAngleCanvas();
        this.updateAngleInfo();
        this.updateToggleButton();
    }
    
    toggleAngleValue() {
        this.showAngleValue = !this.showAngleValue;
        this.drawAngleCanvas();
        this.updateAngleInfo();
        this.updateToggleButton();
    }
    
    toggleReferenceAngles() {
        this.showReferenceAngles = !this.showReferenceAngles;
        this.drawAngleCanvas();
        this.updateReferenceButton();
    }
    
    resetAngleGenerator() {
        this.randomAngle = 0;
        this.showAngleValue = false;
        this.showReferenceAngles = false;
        this.drawAngleCanvas();
        this.updateAngleInfo();
        this.updateToggleButton();
        this.updateReferenceButton();
    }
    
    updateToggleButton() {
        const button = document.getElementById('showAngleValue');
        button.textContent = this.showAngleValue ? '隐藏角度值' : '显示角度值';
    }
    
    updateReferenceButton() {
        const button = document.getElementById('toggleReference');
        button.textContent = this.showReferenceAngles ? '隐藏参考角度' : '显示参考角度';
    }
    
    drawAngleCanvas() {
        const ctx = this.angleCtx;
        const width = this.angleCanvas.width;
        const height = this.angleCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制外部背景（深紫色）
        document.getElementById('angleCanvas').style.backgroundColor = '#6B5B95';

        // 绘制练习区域（整个矩形区域为绿色）
        ctx.fillStyle = '#0f5132';  // 与球桌相同的绿色
        ctx.fillRect(0, 0, width, height);

        // 如果显示参考角度
        if (this.showReferenceAngles) {
            // 绘制参考角度（15°、30°、45°、60°、75°）
            const referenceAngles = [15, 30, 45, 60, 75];
            referenceAngles.forEach(angle => {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                const endX = centerX + radius * Math.cos(this.degreesToRadians(angle));
                const endY = centerY - radius * Math.sin(this.degreesToRadians(angle));
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = '#90EE90'; // 浅绿色
                ctx.lineWidth = 1;
                ctx.stroke();

                // 添加角度标签
                const labelRadius = radius + 25;
                const labelX = centerX + labelRadius * Math.cos(this.degreesToRadians(angle));
                const labelY = centerY - labelRadius * Math.sin(this.degreesToRadians(angle));
                ctx.fillStyle = '#90EE90'; // 浅绿色
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(angle + '°', labelX, labelY);
            });
        }

        // 绘制随机角度
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const endX = centerX + radius * Math.cos(this.degreesToRadians(this.randomAngle));
        const endY = centerY - radius * Math.sin(this.degreesToRadians(this.randomAngle));
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ffffff'; // 白色
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制水平线
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.strokeStyle = '#ffffff'; // 白色
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制角度扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius * 0.2, 0, this.degreesToRadians(this.randomAngle), true);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 半透明白色
        ctx.fill();

        // 如果需要显示角度值
        if (this.showAngleValue) {
            ctx.fillStyle = '#ffffff'; // 白色
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(this.randomAngle) + '°', centerX, centerY - radius - 20);
        }
    }
    
    updateAngleInfo() {
        const infoElement = document.getElementById('currentAngleInfo');
        
        if (this.randomAngle === 0) {
            infoElement.textContent = '🎯 点击"生成随机角度"开始角度识别练习';
        } else if (this.showAngleValue) {
            infoElement.innerHTML = `✅ 当前角度: <strong>${this.randomAngle.toFixed(1)}°</strong> - 您猜对了吗？`;
        } else {
            infoElement.textContent = '🤔 观察红线角度，猜测度数后点击"显示角度值"查看答案';
        }
    }
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PoolTrainer();
});

// 添加一些实用的工具函数
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        transform: translateX(300px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(300px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'r':
        case 'R':
            document.getElementById('randomPositions').click();
            break;
        case 's':
        case 'S':
            document.getElementById('showAimingLines').click();
            break;
        case 'Escape':
            document.getElementById('reset').click();
            break;
        case 'g':
        case 'G':
            document.getElementById('generateRandomAngle').click();
            break;
        case 'a':
        case 'A':
            document.getElementById('showAngleValue').click();
            break;
        case 'c':
        case 'C':
            document.getElementById('resetAngle').click();
            break;
        case 't':
        case 'T':
            document.getElementById('toggleReference').click();
            break;
    }
}); 