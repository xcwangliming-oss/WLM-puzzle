# 弹球打砖块模式（Ball Shooter Mode）开发交接文档

> **文档适用对象**：后续接手开发的 AI 助手（如 Codex）或前端开发工程师。  
> **编写时间**：2026-10-12  
> **当前状态**：核心功能已全部跑通，已部署至线上测试环境并验证通过。

---

## 1. 项目基础与部署信息

| 配置项 | 详细信息 |
| :--- | :--- |
| **本地代码库路径** | `E:\Gemini\Puzzle_NewFeature_20260901` |
| **Git 分支** | `feature/new-gameplay-20261012` |
| **技术栈** | Vite + TypeScript + PIXI.js (v8) + 原生 DOM UI |
| **线上测试服务器** | `root@39.96.58.245:/www/wwwroot/puzzle.wlm.wang/` |
| **线上访问地址** | `https://puzzle.wlm.wang/?mode=ballshooter` |

### 常用命令
```bash
# 1. 类型检查
node node_modules/typescript/bin/tsc --noEmit

# 2. 生产打包
node node_modules/vite/bin/vite.js build

# 3. 部署到线上
scp -r dist/* root@39.96.58.245:/www/wwwroot/puzzle.wlm.wang/
```

---

## 2. 弹球模式核心架构与设计规则

### 2.1 棋盘尺寸与自适应行数
- **列数**：固定为 `11` 列（`PARAMS.gridCols = 11`）。
- **行数**：基于手机端/内嵌容器宽高比自适应，基准至少为 **20 行**（`PARAMS.viewportRows = 20`，`PARAMS.totalRows = 20`）。
- **坐标系**：
  - 单格基础尺寸：`PARAMS.cellSize = 50`。
  - 舞台缩放比例：`fitScale = Math.floor(PARAMS.cellSize * rawScale) / PARAMS.cellSize`。
  - 在 `src/main.ts` 的 `applyGridConfig` 中，`isBallShooterMode` 与同为无重力固定玩法的同心圆模式一样，`rawScale` 计算同时受宽与高约束，画布 `displayH` 严格对齐视口内容高度，消除悬浮缝隙。

### 2.2 垂直层级划分（自上而下 20 行）
```
Row 0:         顶部呼吸留白区（空行，防止方块顶格贴着上方 Header）
Row 1 ~ 15:    砖块排面活动区（共 15 行，砖块允许在水平方向上自由拖拽/划排面）
Row 16 ~ 17:   缓冲区走廊（共 2 行空行，为弹珠发射与折射提供开阔反弹视野）
Row 18 ~ 19:   发射炮台区（底部 2 行，drawGrid 抑制网格线，炮台基座紧贴棋盘底部）
```

### 2.3 炮台锚定公式
- 炮台基座采用 sci-fi 科技多层圆弧/圆柱几何图形绘制，高度范围为 `[-38px, +26px]`（以中心 orb 点为 `(0, 0)`）。
- 炮台坐标公式：
  $$\text{cannonX} = \frac{\text{width}}{2} = 5.5 \times \text{cellSize} = 275$$
  $$\text{cannonY} = \text{height} - 26$$
- 基座底部刚好触及 $y = \text{height}$（棋盘最底边界），完全贴合最下方的红框边界。

### 2.4 网格线绘制（`drawGrid`）
- 在 `drawGrid()` 中：
  ```typescript
  const effectiveRows = isBallShooterMode ? (PARAMS.viewportRows - 2) : PARAMS.totalRows;
  ```
  底部 2 行（Row 18、19）不画任何网格线，保持深蓝背景整洁，专门留作发射台。

---

## 3. 排面交互与生命周期

### 3.1 划排面（方块水平拖拽）
- 砖块在生成后被赋予：
  ```typescript
  b.isBallShooterBlock = true;
  b.sprite.eventMode = 'dynamic';
  b.sprite.cursor = 'grab';
  ```
- 砖块上的 HP 数字文本、高亮 overlay 设置为 `eventMode = 'none'`，避免阻断方块本身的拖拽事件。
- 炮台交互层监听 `pointerdown` 时会优先检测是否点击在方块上（`isPointerOnBlock`），如果是点击在方块上则**放弃瞄准，优先让玩家自由拖拽滑动砖块**。

### 3.2 画排面（手绘自定义关卡）与状态隔离
- **交互冲突预防**：
  - `ballShooterSystem.init(...)` 传入了 `isPlayMode: () => currentMode === 'play'` 回调。
  - 当处于 `currentMode === 'draw'` 状态时，炮台瞄准（`aim`）与发射（`startLaunch`）被彻底锁死，在画板上滑动涂抹方块不会意外触发弹珠发射。
- **自定义涂色转砖块逻辑**（`btnGenerate.onclick`）：
  1. 用户在网格上涂刷的红色格子（`layoutDrawMask`）被直接视为砖块（非消除模式的挖空）。
  2. 程序按行扫描连续涂红区间，将连续段按 $1 \sim 4$ 格切分为宝石长条。
  3. 清除上一轮画布残余，调用 `spawnBlock` 生成砖块，并调用 `ballShooterSystem.randomizeHPForBlocks(blocks)` 为每一个砖块赋予全新随机 HP 数字。
  4. 若用户未涂抹任何方块，则自动降级恢复为默认精选走廊排面（`BALL_SHOOTER_FIXED_LAYOUT`）。
  5. **绝对跳过重力下落与消除算法**（`settleLayoutWithoutEliminations` 与 `preventFullRows`），保持砖块悬浮在玩家手绘的位置。

### 3.3 物理碰撞与血量消除
- 弹珠发射后每帧在 `ballShooterSystem.update()` 中做 AABB 反射与穿透碰撞处理：
  - 动态读取 `b.sprite.x` 与 `b.sprite.y`（即使玩家刚刚划过排面，碰撞盒依然 100% 实时精准）。
  - 每次碰撞根据入角做 `vx` 或 `vy` 轴反弹，扣除 1 点血量，触发打击微缩放（Punch scale）与火花粒子（Spark particles）。
  - 血量扣至 0 时触发 `onBlockDestroyedCallback`，播放粉碎音效与碎裂瓦解动画，并从舞台移除。
  - 所有小球落回底部死区（`bottomDeadZone = dims.height - 20`）后自动平滑回收至炮台基座，进入下一回合。

---

## 4. 关键源码文件及改动分布

### 1. `src/ballShooterMode.ts`
- `BALL_SHOOTER_FIXED_LAYOUT`：精选 11 列走廊排面定义（Row 1 ~ 15）。
- `BallShooterSystem`：
  - `init(...)`：增加 `isPlayMode` 回调判断。
  - `cancelAim()` / `resetAllBalls()`：瞄准重置与弹珠状态重置。
  - `drawCannonGraphics()` / `updateCannonPosition()`：绘制科幻炮台外观并紧贴底边。
  - `setupInteraction()`：瞄准线预览、反弹反射预测绘制、防触碰方块逻辑。
  - `updatePhysics()`：弹珠速度、边界墙壁反弹、砖块碰撞盒检测与血量扣除。
  - `randomizeHPForBlocks(blocks)`：为砖块绑定居中血量数字。

### 2. `src/main.ts`
- **行数与视口自适应**：`setBallShooterMode()` 动态设置 `PARAMS.viewportRows = 20`、`PARAMS.totalRows = 20`。
- **画布缩放与 Frame 贴合**：`applyGridConfig()` 中将 `isBallShooterMode` 纳入双向约束比例计算，避免溢出与黑边空隙。
- **网格线渲染**：`drawGrid()` 底部 2 行禁止绘制网格线。
- **画排面生成机制**：`btnGenerate.onclick`、`btnDraw.onclick`、`btnCancel.onclick` 专设 `isBallShooterMode` 分支，直接转换涂绘为砖块，并彻底屏蔽重力落底。
- **防消除拦截**：`getImmediatePlayableFullRows()` 与 `getActiveBoardMechanic()` 确保弹球模式下不触发全行自动消除。

### 3. `index.html`
- 头部添加防缓存头标签：`<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />`。
- 引入弹球参数配置抽屉面板（弹珠数量滑块、发射速度滑块、随机血量按钮、重置关卡按钮）。
- 页面加载通过 `?mode=ballshooter` 查询参数可直接免点击激活该玩法模式。

---

## 5. Codex 后续开发建议与待办列表 (TODO)

如需继续扩充该玩法的游戏性与完备度，建议按以下优先级推进：

1. **关卡胜负条件与结算弹窗**：
   - **胜利条件**：当 `blocks.length === 0` 时触发 VICTORY 通关特效与结算面板。
   - **失败条件**：如需引入传统打砖块的“砖块下压”机制，可在每一轮弹珠全部收回后，将现有砖块整体下移 1 行（`row + 1`），当任意砖块触及危险警戒线（Row 16）时判定 GAME OVER。
2. **特殊功能砖块 / 道具**：
   - **+1 弹珠球**：击中后使本局发射弹珠总数永久 $+1$。
   - **全屏激光 / 炸弹**：击中后清除整行或周围 $3 \times 3$ 的所有砖块。
3. **音效与震动增强**：
   - 增加弹珠撞击砖块的音调递增效果（如连续打击音调越来越高，制造爽快感）。
4. **多套预设关卡切换**：
   - 目前内置了一套经典的走廊排面，可增加“下一关 / 上一关”按钮，配置多套预设关卡数据。
