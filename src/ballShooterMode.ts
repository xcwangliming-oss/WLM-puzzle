import * as PIXI from 'pixi.js';
import gsap from 'gsap';

export interface BallShooterConfig {
  ballCount: number;
  ballSpeed: number;
  launchIntervalMs: number;
  minHp: number;
  maxHp: number;
}

export const DEFAULT_BALL_SHOOTER_CONFIG: BallShooterConfig = {
  ballCount: 45,
  ballSpeed: 16,
  launchIntervalMs: 40,
  minHp: 20,
  maxHp: 333,
};

export interface BallShooterBlockDef {
  col: number;
  row: number;
  length: number;
  color: string;
  defaultHp?: number;
}

/**
 * Fixed corridor level layout matching user reference screenshot media_1791767365908_20c477f5.jpg
 * Total 11 columns (0..10).
 * Playable blocks span rows 0 to 14 (shifted up 3 rows, leaving rows 15..17 empty for cannon).
 */
export const BALL_SHOOTER_FIXED_LAYOUT: BallShooterBlockDef[] = [
  // Row 0
  { col: 0, row: 0, length: 1, color: 'green', defaultHp: 120 },
  { col: 10, row: 0, length: 1, color: 'pink', defaultHp: 60 },

  // Row 1
  { col: 0, row: 1, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 1, length: 1, color: 'pink', defaultHp: 60 },
  { col: 10, row: 1, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 2
  { col: 0, row: 2, length: 2, color: 'pink', defaultHp: 180 },
  { col: 2, row: 2, length: 1, color: 'green', defaultHp: 60 },
  { col: 7, row: 2, length: 1, color: 'blue', defaultHp: 60 },
  { col: 8, row: 2, length: 2, color: 'blue', defaultHp: 180 },

  // Row 3
  { col: 0, row: 3, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 3, length: 2, color: 'pink', defaultHp: 60 },
  { col: 3, row: 3, length: 1, color: 'pink', defaultHp: 60 },
  { col: 4, row: 3, length: 1, color: 'red', defaultHp: 25 },
  { col: 6, row: 3, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 3, length: 3, color: 'pink', defaultHp: 180 },

  // Row 4
  { col: 0, row: 4, length: 1, color: 'blue', defaultHp: 60 },
  { col: 1, row: 4, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 2, row: 4, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 4, length: 1, color: 'green', defaultHp: 120 },
  { col: 4, row: 4, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 4, length: 2, color: 'yellow', defaultHp: 240 },
  { col: 8, row: 4, length: 2, color: 'pink', defaultHp: 180 },

  // Row 5
  { col: 0, row: 5, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 5, length: 3, color: 'pink', defaultHp: 180 },
  { col: 6, row: 5, length: 4, color: 'yellow', defaultHp: 333 },

  // Row 6
  { col: 0, row: 6, length: 2, color: 'blue', defaultHp: 120 },
  { col: 6, row: 6, length: 1, color: 'green', defaultHp: 120 },
  { col: 7, row: 6, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 6, length: 1, color: 'red', defaultHp: 25 },

  // Row 7
  { col: 0, row: 7, length: 1, color: 'red', defaultHp: 25 },
  { col: 1, row: 7, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 7, length: 2, color: 'red', defaultHp: 25 },
  { col: 5, row: 7, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 7, length: 1, color: 'blue', defaultHp: 60 },
  { col: 7, row: 7, length: 2, color: 'pink', defaultHp: 180 },
  { col: 9, row: 7, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 8
  { col: 0, row: 8, length: 2, color: 'green', defaultHp: 240 },
  { col: 3, row: 8, length: 4, color: 'blue', defaultHp: 180 },
  { col: 7, row: 8, length: 1, color: 'pink', defaultHp: 60 },
  { col: 8, row: 8, length: 1, color: 'yellow', defaultHp: 240 },
  { col: 9, row: 8, length: 1, color: 'pink', defaultHp: 60 },

  // Row 9
  { col: 0, row: 9, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 9, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 6, row: 9, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 9, length: 2, color: 'yellow', defaultHp: 240 },
  { col: 9, row: 9, length: 1, color: 'pink', defaultHp: 60 },

  // Row 10
  { col: 0, row: 10, length: 2, color: 'blue', defaultHp: 120 },
  { col: 2, row: 10, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 10, length: 1, color: 'blue', defaultHp: 60 },
  { col: 4, row: 10, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 10, length: 1, color: 'green', defaultHp: 120 },
  { col: 7, row: 10, length: 2, color: 'green', defaultHp: 240 },

  // Row 11
  { col: 0, row: 11, length: 1, color: 'red', defaultHp: 25 },
  { col: 1, row: 11, length: 3, color: 'green', defaultHp: 240 },
  { col: 6, row: 11, length: 1, color: 'blue', defaultHp: 60 },
  { col: 7, row: 11, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 11, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 12
  { col: 0, row: 12, length: 2, color: 'pink', defaultHp: 180 },
  { col: 6, row: 12, length: 1, color: 'red', defaultHp: 25 },
  { col: 7, row: 12, length: 1, color: 'green', defaultHp: 120 },
  { col: 8, row: 12, length: 1, color: 'pink', defaultHp: 60 },
  { col: 9, row: 12, length: 1, color: 'green', defaultHp: 120 },

  // Row 13
  { col: 0, row: 13, length: 1, color: 'green', defaultHp: 120 },
  { col: 1, row: 13, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 13, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 13, length: 2, color: 'red', defaultHp: 25 },
  { col: 9, row: 13, length: 1, color: 'pink', defaultHp: 60 },

  // Row 14
  { col: 6, row: 14, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 7, row: 14, length: 1, color: 'blue', defaultHp: 60 },
  { col: 8, row: 14, length: 1, color: 'red', defaultHp: 25 },
  { col: 9, row: 14, length: 1, color: 'blue', defaultHp: 60 },
  { col: 10, row: 14, length: 1, color: 'yellow', defaultHp: 120 },
];

export interface Ball {
  sprite: PIXI.Container;
  trailGraphics: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  returning: boolean;
}

export interface SparkParticle {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  active: boolean;
}

export class BallShooterSystem {
  public enabled: boolean = false;
  public config: BallShooterConfig = { ...DEFAULT_BALL_SHOOTER_CONFIG };

  // Pixi containers
  private app: PIXI.Application | null = null;
  private gameStage: PIXI.Container | null = null;
  private boardWrapper: HTMLElement | null = null;
  private container: PIXI.Container;
  private ballsContainer: PIXI.Container;
  private blockHighlightsContainer: PIXI.Container;
  private blockTextsContainer: PIXI.Container;
  private cannonContainer: PIXI.Container;
  private aimLineGraphics: PIXI.Graphics;
  private sparksContainer: PIXI.Container;

  // Visuals for cannon
  private cannonBase: PIXI.Graphics;
  private cannonBarrel: PIXI.Graphics;
  private cannonOrb: PIXI.Graphics;
  private cannonCountText: PIXI.Text;

  // Cannon state
  public cannonX: number = 0;
  public cannonY: number = 0;
  private aimAngle: number = -Math.PI / 2;
  private isAiming: boolean = false;
  private isLaunching: boolean = false;
  private hasActiveBalls: boolean = false;

  // Ball pool
  private balls: Ball[] = [];
  private activeBallCount: number = 0;
  private returnedBallCount: number = 0;
  private nextLaunchTimer: number = 0;
  private ballsToLaunch: number = 0;

  // Spark particle pool
  private sparks: SparkParticle[] = [];

  // Callbacks
  private getBlocksCallback: (() => any[]) | null = null;
  private onBlockDestroyedCallback: ((block: any) => void) | null = null;
  private getBoardDimensionsCallback: (() => { width: number; height: number; cellSize: number; cols: number; rows: number }) | null = null;

  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = 5000;
    this.container.visible = false;

    this.blockHighlightsContainer = new PIXI.Container();
    this.container.addChild(this.blockHighlightsContainer);

    this.blockTextsContainer = new PIXI.Container();
    this.container.addChild(this.blockTextsContainer);

    this.aimLineGraphics = new PIXI.Graphics();
    this.container.addChild(this.aimLineGraphics);

    this.ballsContainer = new PIXI.Container();
    this.container.addChild(this.ballsContainer);

    this.sparksContainer = new PIXI.Container();
    this.container.addChild(this.sparksContainer);

    this.cannonContainer = new PIXI.Container();
    this.container.addChild(this.cannonContainer);

    // Build cannon parts
    this.cannonBase = new PIXI.Graphics();
    this.cannonBarrel = new PIXI.Graphics();
    this.cannonOrb = new PIXI.Graphics();
    this.cannonCountText = new PIXI.Text({
      text: `x${this.config.ballCount}`,
      style: {
        fontFamily: 'Fira Sans, PingFang SC, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 3,
          color: 0x000000,
          distance: 1,
        },
      },
    });

    this.cannonContainer.addChild(this.cannonBase);
    this.cannonContainer.addChild(this.cannonBarrel);
    this.cannonContainer.addChild(this.cannonOrb);
    this.cannonContainer.addChild(this.cannonCountText);
  }

  public init(
    app: PIXI.Application,
    gameStage: PIXI.Container,
    boardWrapper: HTMLElement | null,
    getBlocks: () => any[],
    onBlockDestroyed: (block: any) => void,
    getBoardDimensions: () => { width: number; height: number; cellSize: number; cols: number; rows: number }
  ) {
    this.app = app;
    this.gameStage = gameStage;
    this.boardWrapper = boardWrapper;
    this.getBlocksCallback = getBlocks;
    this.onBlockDestroyedCallback = onBlockDestroyed;
    this.getBoardDimensionsCallback = getBoardDimensions;

    if (!gameStage.children.includes(this.container)) {
      gameStage.addChild(this.container);
    }

    this.drawCannonGraphics();
    this.setupInteraction();
  }

  private drawCannonGraphics() {
    // Cannon Base (heavy metallic sci-fi turret base resting on the bottom floor)
    this.cannonBase.clear();

    // Heavy pedestal platform
    this.cannonBase.roundRect(-36, -8, 72, 34, 8);
    this.cannonBase.fill({ color: 0x1e293b });
    this.cannonBase.stroke({ color: 0x475569, width: 2.5 });

    // Metallic turret dome
    this.cannonBase.circle(0, 0, 26);
    this.cannonBase.fill({ color: 0x24283b });
    this.cannonBase.stroke({ color: 0x64748b, width: 3 });

    // Inner glowing ring
    this.cannonBase.circle(0, 0, 18);
    this.cannonBase.fill({ color: 0x0f172a });
    this.cannonBase.stroke({ color: 0x38bdf8, width: 2, alpha: 0.8 });

    // Cannon Barrel (heavy mortar barrel pointing upwards)
    this.cannonBarrel.clear();
    this.cannonBarrel.roundRect(-12, -38, 24, 38, 4);
    this.cannonBarrel.fill({ color: 0x334155 });
    this.cannonBarrel.stroke({ color: 0x94a3b8, width: 2 });

    // Gold trim ring
    this.cannonBarrel.rect(-13, -30, 26, 6);
    this.cannonBarrel.fill({ color: 0xf59e0b });

    // Muzzle glow ring
    this.cannonBarrel.ellipse(0, -38, 11, 4);
    this.cannonBarrel.fill({ color: 0xfde047 });

    // Glowing energy core orb
    this.cannonOrb.clear();
    this.cannonOrb.circle(0, 0, 10);
    this.cannonOrb.fill({ color: 0xfde047, alpha: 0.45 });
    this.cannonOrb.circle(0, 0, 7);
    this.cannonOrb.fill({ color: 0xffd700 });
    this.cannonOrb.circle(-2, -2, 3);
    this.cannonOrb.fill({ color: 0xffffff });

    this.cannonCountText.anchor.set(0, 0.5);
    this.cannonCountText.position.set(40, -4);
  }

  public updateCannonPosition() {
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();
    this.cannonX = dims.width / 2;
    // Cannon sits right at the bottom edge of the board
    this.cannonY = dims.height - 22;
    this.cannonContainer.position.set(this.cannonX, this.cannonY);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;

    if (enabled) {
      this.updateCannonPosition();
      this.resetAllBalls();
      this.cannonCountText.text = `x${this.config.ballCount}`;
    } else {
      this.clearAllVisuals();
      this.aimLineGraphics.clear();
    }
  }

  private setupInteraction() {
    if (!this.app || !this.app.stage) return;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    const isPointerOnBlock = (pointerX: number, pointerY: number): boolean => {
      const local = this.container.toLocal({ x: pointerX, y: pointerY });
      const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];
      const dims = this.getBoardDimensionsCallback ? this.getBoardDimensionsCallback() : { cellSize: 50 };
      return blocks.some(b => {
        if (!b || !b.sprite || b.hitPoints <= 0 || !b.sprite.visible) return false;
        const bLeft = b.sprite.x;
        const bRight = bLeft + b.length * dims.cellSize;
        const bTop = b.sprite.y;
        const bBottom = bTop + dims.cellSize;
        return local.x >= bLeft && local.x <= bRight && local.y >= bTop && local.y <= bBottom;
      });
    };

    this.app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      if (!this.enabled || this.isLaunching || this.hasActiveBalls) return;
      // If pointer is touching a block, allow block sliding, do NOT aim cannon!
      if (isPointerOnBlock(e.global.x, e.global.y)) {
        return;
      }
      this.isAiming = true;
      this.updateAim(e.global.x, e.global.y);
    });

    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.enabled || !this.isAiming) return;
      this.updateAim(e.global.x, e.global.y);
    });

    const finishAim = () => {
      if (!this.enabled || !this.isAiming) return;
      this.isAiming = false;
      this.aimLineGraphics.clear();
      this.startLaunch();
    };

    this.app.stage.on('pointerup', finishAim);
    this.app.stage.on('pointerupoutside', finishAim);
  }

  private updateAim(pointerX: number, pointerY: number) {
    // Transform global pointer coordinates to container coordinates
    const local = this.container.toLocal({ x: pointerX, y: pointerY });
    const dx = local.x - this.cannonX;
    const dy = local.y - this.cannonY;

    // Clamp aiming to upper hemisphere (must shoot upwards)
    let angle = Math.atan2(dy, dx);
    const minAngle = -Math.PI + 0.15; // steep left
    const maxAngle = -0.15;          // steep right
    if (angle > 0) {
      angle = dx < 0 ? minAngle : maxAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    this.aimAngle = angle;
    this.cannonBarrel.rotation = this.aimAngle + Math.PI / 2;

    this.renderAimLine();
  }

  private renderAimLine() {
    this.aimLineGraphics.clear();
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();

    const maxBounces = 2;
    let currX = this.cannonX;
    let currY = this.cannonY - 36;
    let dirX = Math.cos(this.aimAngle);
    let dirY = Math.sin(this.aimAngle);

    for (let bounce = 0; bounce <= maxBounces; bounce++) {
      // Raycast to walls (left, right, top)
      let minT = Infinity;
      let hitNormalX = 0;
      let hitNormalY = 0;

      // Left wall (x = 5)
      if (dirX < 0) {
        const t = (5 - currX) / dirX;
        if (t > 0 && t < minT) {
          minT = t;
          hitNormalX = 1;
          hitNormalY = 0;
        }
      }
      // Right wall (x = dims.width - 5)
      if (dirX > 0) {
        const t = (dims.width - 5 - currX) / dirX;
        if (t > 0 && t < minT) {
          minT = t;
          hitNormalX = -1;
          hitNormalY = 0;
        }
      }
      // Top wall (y = 5)
      if (dirY < 0) {
        const t = (5 - currY) / dirY;
        if (t > 0 && t < minT) {
          minT = t;
          hitNormalX = 0;
          hitNormalY = 1;
        }
      }

      // Also raycast against blocks
      const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];
      blocks.forEach(b => {
        if (!b || b.hitPoints <= 0) return;
        const bLeft = b.col * dims.cellSize;
        const bRight = (b.col + b.length) * dims.cellSize;
        const bTop = b.row * dims.cellSize;
        const bBottom = (b.row + 1) * dims.cellSize;

        // Check 4 segments
        // Left edge
        if (dirX > 0) {
          const t = (bLeft - currX) / dirX;
          if (t > 0 && t < minT) {
            const yAtT = currY + dirY * t;
            if (yAtT >= bTop && yAtT <= bBottom) {
              minT = t;
              hitNormalX = -1;
              hitNormalY = 0;
            }
          }
        }
        // Right edge
        if (dirX < 0) {
          const t = (bRight - currX) / dirX;
          if (t > 0 && t < minT) {
            const yAtT = currY + dirY * t;
            if (yAtT >= bTop && yAtT <= bBottom) {
              minT = t;
              hitNormalX = 1;
              hitNormalY = 0;
            }
          }
        }
        // Top edge
        if (dirY > 0) {
          const t = (bTop - currY) / dirY;
          if (t > 0 && t < minT) {
            const xAtT = currX + dirX * t;
            if (xAtT >= bLeft && xAtT <= bRight) {
              minT = t;
              hitNormalX = 0;
              hitNormalY = -1;
            }
          }
        }
        // Bottom edge
        if (dirY < 0) {
          const t = (bBottom - currY) / dirY;
          if (t > 0 && t < minT) {
            const xAtT = currX + dirX * t;
            if (xAtT >= bLeft && xAtT <= bRight) {
              minT = t;
              hitNormalX = 0;
              hitNormalY = 1;
            }
          }
        }
      });

      if (!Number.isFinite(minT) || minT <= 0) break;

      const nextX = currX + dirX * minT;
      const nextY = currY + dirY * minT;

      // Draw dotted line between curr and next
      const dist = Math.hypot(nextX - currX, nextY - currY);
      const dotSpacing = 14;
      const dotCount = Math.floor(dist / dotSpacing);

      for (let i = 0; i <= dotCount; i++) {
        const ratio = i / Math.max(1, dotCount);
        const px = currX + (nextX - currX) * ratio;
        const py = currY + (nextY - currY) * ratio;
        this.aimLineGraphics.circle(px, py, 3.5);
        this.aimLineGraphics.fill({ color: 0xfff066, alpha: 0.85 - bounce * 0.25 });
      }

      if (hitNormalX !== 0) dirX = -dirX;
      if (hitNormalY !== 0) dirY = -dirY;
      currX = nextX;
      currY = nextY;
    }
  }

  public startLaunch() {
    if (this.isLaunching || this.hasActiveBalls) return;
    this.isLaunching = true;
    this.hasActiveBalls = true;
    this.ballsToLaunch = this.config.ballCount;
    this.returnedBallCount = 0;
    this.nextLaunchTimer = 0;
  }

  private spawnBall(): Ball {
    // Find inactive ball or create new
    let ball = this.balls.find(b => !b.active);
    if (!ball) {
      const container = new PIXI.Container();

      // Glowing trail streak behind ball
      const trail = new PIXI.Graphics();
      container.addChild(trail);

      // Outer glow
      const glow = new PIXI.Graphics();
      glow.circle(0, 0, 11);
      glow.fill({ color: 0xf59e0b, alpha: 0.35 });
      container.addChild(glow);

      // Core golden ball
      const core = new PIXI.Graphics();
      core.circle(0, 0, 6.5);
      core.fill({ color: 0xffd700 });
      core.circle(-1.5, -1.5, 2.5);
      core.fill({ color: 0xffffff, alpha: 0.9 });
      container.addChild(core);

      this.ballsContainer.addChild(container);

      ball = {
        sprite: container,
        trailGraphics: trail,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 6.5,
        active: false,
        returning: false,
      };
      this.balls.push(ball);
    }

    ball.x = this.cannonX;
    ball.y = this.cannonY - 36;
    ball.vx = Math.cos(this.aimAngle) * this.config.ballSpeed;
    ball.vy = Math.sin(this.aimAngle) * this.config.ballSpeed;
    ball.active = true;
    ball.returning = false;
    ball.sprite.visible = true;
    ball.trailGraphics.clear();
    ball.sprite.position.set(ball.x, ball.y);
    return ball;
  }

  public update(delta: number) {
    if (!this.enabled) return;

    // Real-time sync block HP text and highlight overlay positions with block sprites (supports sliding blocks & falling)
    const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];
    const dims = this.getBoardDimensionsCallback ? this.getBoardDimensionsCallback() : { cellSize: 50 };
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || !b.sprite || b.hitPoints <= 0) continue;
      if (b.hpTextSprite) {
        b.hpTextSprite.x = b.sprite.x + (b.length * dims.cellSize) / 2;
        b.hpTextSprite.y = b.sprite.y + dims.cellSize / 2;
        b.hpTextSprite.visible = b.sprite.visible && b.sprite.renderable !== false;
      }
      if (b.hitHighlightOverlay) {
        b.hitHighlightOverlay.x = b.sprite.x;
        b.hitHighlightOverlay.y = b.sprite.y;
      }
    }

    // Launch balls sequentially
    if (this.isLaunching) {
      this.nextLaunchTimer += delta * 16.6;
      while (this.nextLaunchTimer >= this.config.launchIntervalMs && this.ballsToLaunch > 0) {
        this.nextLaunchTimer -= this.config.launchIntervalMs;
        this.spawnBall();
        this.ballsToLaunch--;
        this.cannonCountText.text = `x${this.ballsToLaunch}`;
      }
      if (this.ballsToLaunch <= 0) {
        this.isLaunching = false;
      }
    }

    // Update active balls physics
    if (this.hasActiveBalls) {
      this.updateBallsPhysics(delta);
    }

    // Update spark particles
    this.updateSparks(delta);
  }

  private updateBallsPhysics(delta: number) {
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();
    const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];

    const bottomDeadZone = dims.height - 20;
    let activeCount = 0;

    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (!ball.active) continue;

      if (ball.returning) {
        ball.trailGraphics.clear();
        // Smoothly return ball to cannon base
        const dx = this.cannonX - ball.x;
        const dy = this.cannonY - ball.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 15) {
          ball.active = false;
          ball.sprite.visible = false;
          this.returnedBallCount++;
          this.cannonCountText.text = `x${this.returnedBallCount}`;
        } else {
          ball.x += (dx / dist) * 22;
          ball.y += (dy / dist) * 22;
          ball.sprite.position.set(ball.x, ball.y);
          activeCount++;
        }
        continue;
      }

      activeCount++;

      // Multiple substeps for tunnel prevention at high speeds
      const substeps = 2;
      for (let s = 0; s < substeps; s++) {
        const stepDt = (delta / substeps);
        ball.x += ball.vx * stepDt;
        ball.y += ball.vy * stepDt;

        // Boundary collision: Left / Right
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          this.createSparks(ball.x, ball.y, 0xffe066);
        } else if (ball.x + ball.radius >= dims.width) {
          ball.x = dims.width - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          this.createSparks(ball.x, ball.y, 0xffe066);
        }

        // Boundary collision: Top
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          this.createSparks(ball.x, ball.y, 0xffe066);
        }

        // Bottom hit: enter returning state
        if (ball.y >= bottomDeadZone) {
          ball.returning = true;
          ball.vy = 0;
          ball.vx = 0;
          break;
        }

        // Check collision against blocks
        for (let j = 0; j < blocks.length; j++) {
          const b = blocks[j];
          if (!b || b.hitPoints <= 0) continue;

          const bLeft = b.col * dims.cellSize;
          const bRight = (b.col + b.length) * dims.cellSize;
          const bTop = b.row * dims.cellSize;
          const bBottom = (b.row + 1) * dims.cellSize;

          // Closest point on rectangle to circle
          const closestX = Math.max(bLeft, Math.min(ball.x, bRight));
          const closestY = Math.max(bTop, Math.min(ball.y, bBottom));

          const diffX = ball.x - closestX;
          const diffY = ball.y - closestY;
          const distSq = diffX * diffX + diffY * diffY;

          if (distSq < ball.radius * ball.radius) {
            // Collision detected! Resolve reflection normal
            const overlapLeft = Math.abs(ball.x - bLeft);
            const overlapRight = Math.abs(ball.x - bRight);
            const overlapTop = Math.abs(ball.y - bTop);
            const overlapBottom = Math.abs(ball.y - bBottom);

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) {
              ball.vx = -Math.abs(ball.vx);
              ball.x = bLeft - ball.radius;
            } else if (minOverlap === overlapRight) {
              ball.vx = Math.abs(ball.vx);
              ball.x = bRight + ball.radius;
            } else if (minOverlap === overlapTop) {
              ball.vy = -Math.abs(ball.vy);
              ball.y = bTop - ball.radius;
            } else {
              ball.vy = Math.abs(ball.vy);
              ball.y = bBottom + ball.radius;
            }

            // Hit feedback on block
            this.handleBlockHit(b, closestX, closestY);
            break;
          }
        }
      }

      // Draw light streak trail pointing against velocity
      if (!ball.returning && (ball.vx !== 0 || ball.vy !== 0)) {
        ball.trailGraphics.clear();
        const speed = Math.hypot(ball.vx, ball.vy);
        const normVx = ball.vx / (speed || 1);
        const normVy = ball.vy / (speed || 1);
        const trailLen = Math.min(22, speed * 1.4);
        ball.trailGraphics.poly([
          -normVy * 4, normVx * 4,
          normVy * 4, -normVx * 4,
          -normVx * trailLen, -normVy * trailLen
        ]);
        ball.trailGraphics.fill({ color: 0xfde047, alpha: 0.55 });
      } else {
        ball.trailGraphics.clear();
      }

      ball.sprite.position.set(ball.x, ball.y);
    }

    if (activeCount === 0 && !this.isLaunching) {
      this.hasActiveBalls = false;
      this.cannonCountText.text = `x${this.config.ballCount}`;
    }
  }

  private handleBlockHit(block: any, hitX: number, hitY: number) {
    // 1. Damage HP
    block.hitPoints = Math.max(0, (block.hitPoints || 1) - 1);

    // 2. Update text
    if (block.hpTextSprite) {
      block.hpTextSprite.text = String(block.hitPoints);
    }

    // 3. Highlight block (requirement #3: 弹球打到的块儿需要高亮)
    this.triggerBlockHighlight(block);

    // 4. Spark particles
    this.createSparks(hitX, hitY, 0xffd700);

    // 5. If destroyed, remove text/overlay and trigger callback
    if (block.hitPoints <= 0) {
      if (block.hpTextSprite && block.hpTextSprite.parent) {
        block.hpTextSprite.parent.removeChild(block.hpTextSprite);
      }
      if (block.hitHighlightOverlay && block.hitHighlightOverlay.parent) {
        block.hitHighlightOverlay.parent.removeChild(block.hitHighlightOverlay);
      }
      if (this.onBlockDestroyedCallback) {
        this.onBlockDestroyedCallback(block);
      }
    }
  }

  public triggerBlockHighlight(block: any) {
    if (!block) return;
    const dims = this.getBoardDimensionsCallback ? this.getBoardDimensionsCallback() : { cellSize: 50 };

    // Use overlay graphics in blockHighlightsContainer for instant punchy white-hot flash
    if (!block.hitHighlightOverlay) {
      const overlay = new PIXI.Graphics();
      overlay.roundRect(0, 0, block.length * dims.cellSize, dims.cellSize, 4);
      overlay.fill({ color: 0xffffff, alpha: 0.9 });
      overlay.blendMode = 'add';
      this.blockHighlightsContainer.addChild(overlay);
      block.hitHighlightOverlay = overlay;
    }

    block.hitHighlightOverlay.position.set(block.col * dims.cellSize, block.row * dims.cellSize);
    block.hitHighlightOverlay.visible = true;
    block.hitHighlightOverlay.alpha = 0.9;

    // Punch text scale for snappy tactile feedback
    if (block.hpTextSprite) {
      gsap.killTweensOf(block.hpTextSprite.scale);
      block.hpTextSprite.scale.set(1.35);
      gsap.to(block.hpTextSprite.scale, {
        x: 1,
        y: 1,
        duration: 0.14,
        ease: 'back.out(2)',
      });
    }

    // Rapid bounce fade out
    gsap.killTweensOf(block.hitHighlightOverlay);
    gsap.to(block.hitHighlightOverlay, {
      alpha: 0,
      duration: 0.14,
      ease: 'power2.out',
      onComplete: () => {
        if (block.hitHighlightOverlay) {
          block.hitHighlightOverlay.visible = false;
        }
      },
    });
  }

  private createSparks(x: number, y: number, color: number) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      let spark = this.sparks.find(s => !s.active);
      if (!spark) {
        const g = new PIXI.Graphics();
        this.sparksContainer.addChild(g);
        spark = {
          sprite: g,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          alpha: 1,
          decay: 0.05,
          active: false,
        };
        this.sparks.push(spark);
      }

      spark.x = x;
      spark.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      spark.vx = Math.cos(angle) * speed;
      spark.vy = Math.sin(angle) * speed;
      spark.alpha = 1;
      spark.decay = 0.04 + Math.random() * 0.04;
      spark.active = true;

      spark.sprite.clear();
      spark.sprite.circle(0, 0, 2.5);
      spark.sprite.fill({ color });
      spark.sprite.visible = true;
      spark.sprite.position.set(x, y);
    }
  }

  private updateSparks(delta: number) {
    for (let i = 0; i < this.sparks.length; i++) {
      const spark = this.sparks[i];
      if (!spark.active) continue;

      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.alpha -= spark.decay * delta;

      if (spark.alpha <= 0) {
        spark.active = false;
        spark.sprite.visible = false;
      } else {
        spark.sprite.alpha = spark.alpha;
        spark.sprite.position.set(spark.x, spark.y);
      }
    }
  }

  private resetAllBalls() {
    this.isLaunching = false;
    this.hasActiveBalls = false;
    this.isAiming = false;
    this.balls.forEach(b => {
      b.active = false;
      b.sprite.visible = false;
      if (b.trailGraphics) b.trailGraphics.clear();
    });
    this.aimLineGraphics.clear();
  }

  public randomizeHPForBlocks(blocks: any[]) {
    const hpPresetsByLength: Record<number, number[]> = {
      1: [25, 45, 60, 120],
      2: [60, 100, 120, 180, 240],
      3: [120, 180, 240, 280],
      4: [180, 240, 300, 333],
    };

    const dims = this.getBoardDimensionsCallback ? this.getBoardDimensionsCallback() : { cellSize: 50 };

    blocks.forEach(b => {
      if (!b || b.isProp) return;
      const presetList = hpPresetsByLength[b.length] || [60, 120, 180, 240];
      const hp = presetList[Math.floor(Math.random() * presetList.length)];
      b.hitPoints = hp;
      b.maxHitPoints = hp;

      const centerX = b.col * dims.cellSize + (b.length * dims.cellSize) / 2;
      const centerY = b.row * dims.cellSize + dims.cellSize / 2;

      if (!b.hpTextSprite) {
        const text = new PIXI.Text({
          text: String(hp),
          style: {
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: Math.min(22, dims.cellSize * 0.44),
            fontWeight: '900',
            fill: 0xffffff,
            align: 'center',
            stroke: {
              color: 0x0f172a,
              width: 4,
              join: 'round',
            },
            dropShadow: {
              alpha: 0.7,
              blur: 3,
              color: 0x000000,
              distance: 1.5,
            },
          },
        });
        text.anchor.set(0.5);
        text.position.set(centerX, centerY);
        this.blockTextsContainer.addChild(text);
        b.hpTextSprite = text;
      } else {
        b.hpTextSprite.text = String(hp);
        b.hpTextSprite.position.set(centerX, centerY);
        b.hpTextSprite.visible = true;
      }
    });
  }

  public clearAllVisuals() {
    this.blockTextsContainer.removeChildren();
    this.blockHighlightsContainer.removeChildren();
    this.resetAllBalls();
  }
}

export const ballShooterSystem = new BallShooterSystem();
