import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import ballLaunchSoundUrl from '../assets/playable-audio/ball-launch.mp3';
import ballImpactSoundUrl from '../assets/playable-audio/ball-impact-tight.wav';
import defaultCannonBaseUrl from '../assets/ballshooter/cannon-reference-base-v3.png';
import defaultCannonBarrelUrl from '../assets/ballshooter/cannon-reference-barrel-v3.png';
import { getCannonMuzzle } from './cannonAim';
import { REFERENCE_CANNON_ART, getReferenceCannonFit } from './cannonArtwork';
import { sweepBallAgainstBlock } from './ballShooterCollision';

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
 * Authored at 10 columns (0..9). The board generator also clips this layout
 * safely when the user changes the column count.
 * Playable blocks span rows 1 to 15 (shifted down: row 0 clear, rows 16..17 empty corridor, rows 18..19 for bottom launcher).
 */
export const BALL_SHOOTER_FIXED_LAYOUT: BallShooterBlockDef[] = [
  // Row 1
  { col: 0, row: 1, length: 1, color: 'green', defaultHp: 120 },
  { col: 10, row: 1, length: 1, color: 'pink', defaultHp: 60 },

  // Row 2
  { col: 0, row: 2, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 2, length: 1, color: 'pink', defaultHp: 60 },
  { col: 10, row: 2, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 3
  { col: 0, row: 3, length: 2, color: 'pink', defaultHp: 180 },
  { col: 2, row: 3, length: 1, color: 'green', defaultHp: 60 },
  { col: 7, row: 3, length: 1, color: 'blue', defaultHp: 60 },
  { col: 8, row: 3, length: 2, color: 'blue', defaultHp: 180 },

  // Row 4
  { col: 0, row: 4, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 4, length: 2, color: 'pink', defaultHp: 60 },
  { col: 3, row: 4, length: 1, color: 'pink', defaultHp: 60 },
  { col: 4, row: 4, length: 1, color: 'red', defaultHp: 25 },
  { col: 6, row: 4, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 4, length: 3, color: 'pink', defaultHp: 180 },

  // Row 5
  { col: 0, row: 5, length: 1, color: 'blue', defaultHp: 60 },
  { col: 1, row: 5, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 2, row: 5, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 5, length: 1, color: 'green', defaultHp: 120 },
  { col: 4, row: 5, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 5, length: 2, color: 'yellow', defaultHp: 240 },
  { col: 8, row: 5, length: 2, color: 'pink', defaultHp: 180 },

  // Row 6
  { col: 0, row: 6, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 6, length: 3, color: 'pink', defaultHp: 180 },
  { col: 6, row: 6, length: 4, color: 'yellow', defaultHp: 333 },

  // Row 7
  { col: 0, row: 7, length: 2, color: 'blue', defaultHp: 120 },
  { col: 6, row: 7, length: 1, color: 'green', defaultHp: 120 },
  { col: 7, row: 7, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 7, length: 1, color: 'red', defaultHp: 25 },

  // Row 8
  { col: 0, row: 8, length: 1, color: 'red', defaultHp: 25 },
  { col: 1, row: 8, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 8, length: 2, color: 'red', defaultHp: 25 },
  { col: 5, row: 8, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 8, length: 1, color: 'blue', defaultHp: 60 },
  { col: 7, row: 8, length: 2, color: 'pink', defaultHp: 180 },
  { col: 9, row: 8, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 9
  { col: 0, row: 9, length: 2, color: 'green', defaultHp: 240 },
  { col: 3, row: 9, length: 4, color: 'blue', defaultHp: 180 },
  { col: 7, row: 9, length: 1, color: 'pink', defaultHp: 60 },
  { col: 8, row: 9, length: 1, color: 'yellow', defaultHp: 240 },
  { col: 9, row: 9, length: 1, color: 'pink', defaultHp: 60 },

  // Row 10
  { col: 0, row: 10, length: 1, color: 'pink', defaultHp: 60 },
  { col: 1, row: 10, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 6, row: 10, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 10, length: 2, color: 'yellow', defaultHp: 240 },
  { col: 9, row: 10, length: 1, color: 'pink', defaultHp: 60 },

  // Row 11
  { col: 0, row: 11, length: 2, color: 'blue', defaultHp: 120 },
  { col: 2, row: 11, length: 1, color: 'pink', defaultHp: 60 },
  { col: 3, row: 11, length: 1, color: 'blue', defaultHp: 60 },
  { col: 4, row: 11, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 11, length: 1, color: 'green', defaultHp: 120 },
  { col: 7, row: 11, length: 2, color: 'green', defaultHp: 240 },

  // Row 12
  { col: 0, row: 12, length: 1, color: 'red', defaultHp: 25 },
  { col: 1, row: 12, length: 3, color: 'green', defaultHp: 240 },
  { col: 6, row: 12, length: 1, color: 'blue', defaultHp: 60 },
  { col: 7, row: 12, length: 2, color: 'green', defaultHp: 240 },
  { col: 9, row: 12, length: 1, color: 'yellow', defaultHp: 120 },

  // Row 13
  { col: 0, row: 13, length: 2, color: 'pink', defaultHp: 180 },
  { col: 6, row: 13, length: 1, color: 'red', defaultHp: 25 },
  { col: 7, row: 13, length: 1, color: 'green', defaultHp: 120 },
  { col: 8, row: 13, length: 1, color: 'pink', defaultHp: 60 },
  { col: 9, row: 13, length: 1, color: 'green', defaultHp: 120 },

  // Row 14
  { col: 0, row: 14, length: 1, color: 'green', defaultHp: 120 },
  { col: 1, row: 14, length: 1, color: 'pink', defaultHp: 60 },
  { col: 6, row: 14, length: 1, color: 'pink', defaultHp: 60 },
  { col: 7, row: 14, length: 2, color: 'red', defaultHp: 25 },
  { col: 9, row: 14, length: 1, color: 'pink', defaultHp: 60 },

  // Row 15
  { col: 6, row: 15, length: 1, color: 'yellow', defaultHp: 120 },
  { col: 7, row: 15, length: 1, color: 'blue', defaultHp: 60 },
  { col: 8, row: 15, length: 1, color: 'red', defaultHp: 25 },
  { col: 9, row: 15, length: 1, color: 'blue', defaultHp: 60 },
  { col: 10, row: 15, length: 1, color: 'yellow', defaultHp: 120 },
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
  private customCannonSprite: PIXI.Sprite | null = null;
  private customCannonBarrelSprite: PIXI.Sprite | null = null;
  private cannonPivotOffsetY: number = 0;
  private cannonMuzzleLength: number = 38;
  private cannonImageRequestId: number = 0;
  private usesDefaultCannonArtwork: boolean = false;
  private cannonRecoilOffset: number = 0;

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
  private readyBallCount: number = DEFAULT_BALL_SHOOTER_CONFIG.ballCount;
  private nextLaunchTimer: number = 0;
  private ballsToLaunch: number = 0;
  private launchSounds: HTMLAudioElement[] = [];
  private launchSoundIndex: number = 0;
  private launchEmissionCount: number = 0;
  private soundPlayer: ((sound: HTMLAudioElement) => void) | null = null;
  private impactSounds: HTMLAudioElement[] = [];
  private impactSoundIndex: number = 0;
  private impactEventCount: number = 0;

  // Spark particle pool
  private sparks: SparkParticle[] = [];

  // Callbacks
  private getBlocksCallback: (() => any[]) | null = null;
  private onBlockDestroyedCallback: ((block: any) => void) | null = null;
  private getBoardDimensionsCallback: (() => { width: number; height: number; cellSize: number; cols: number; rows: number }) | null = null;

  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = 200;
    this.container.visible = false;
    this.container.eventMode = 'none';

    this.blockHighlightsContainer = new PIXI.Container();
    this.blockHighlightsContainer.eventMode = 'none';
    this.container.addChild(this.blockHighlightsContainer);

    this.blockTextsContainer = new PIXI.Container();
    this.blockTextsContainer.eventMode = 'none';
    this.container.addChild(this.blockTextsContainer);

    this.aimLineGraphics = new PIXI.Graphics();
    this.aimLineGraphics.eventMode = 'none';
    this.container.addChild(this.aimLineGraphics);

    this.ballsContainer = new PIXI.Container();
    this.ballsContainer.eventMode = 'none';
    this.container.addChild(this.ballsContainer);

    this.sparksContainer = new PIXI.Container();
    this.sparksContainer.eventMode = 'none';
    this.container.addChild(this.sparksContainer);

    this.cannonContainer = new PIXI.Container();
    this.cannonContainer.eventMode = 'none';
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
    this.cannonCountText.eventMode = 'none';

    this.cannonContainer.addChild(this.cannonBase);
    this.cannonContainer.addChild(this.cannonBarrel);
    this.cannonContainer.addChild(this.cannonOrb);
    this.cannonContainer.addChild(this.cannonCountText);
  }

  private isPlayModeCallback: (() => boolean) | null = null;

  public cancelAim() {
    this.isAiming = false;
    this.aimLineGraphics.clear();
  }

  public init(
    app: PIXI.Application,
    gameStage: PIXI.Container,
    boardWrapper: HTMLElement | null,
    getBlocks: () => any[],
    onBlockDestroyed: (block: any) => void,
    getBoardDimensions: () => { width: number; height: number; cellSize: number; cols: number; rows: number },
    isPlayMode?: () => boolean
  ) {
    this.app = app;
    this.gameStage = gameStage;
    this.boardWrapper = boardWrapper;
    this.getBlocksCallback = getBlocks;
    this.onBlockDestroyedCallback = onBlockDestroyed;
    this.getBoardDimensionsCallback = getBoardDimensions;
    this.isPlayModeCallback = isPlayMode || null;

    if (!gameStage.children.includes(this.container)) {
      gameStage.addChild(this.container);
    }

    this.drawCannonGraphics();
    this.setCannonImage(null);
    this.updateCannonPosition();
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

  /**
   * The default artwork uses a stationary base and a rotating barrel. Uploaded
   * single images rotate around their lower body. Both share muzzle geometry
   * with the aiming guide and ball physics.
   */
  public setCannonImage(dataUrl: string | null): void {
    const requestId = ++this.cannonImageRequestId;

    const clearCustomSprite = () => {
      this.customCannonSprite?.destroy();
      this.customCannonBarrelSprite?.destroy();
      this.customCannonSprite = null;
      this.customCannonBarrelSprite = null;
      this.cannonPivotOffsetY = 0;
      this.cannonMuzzleLength = 38;
      this.usesDefaultCannonArtwork = false;
      this.cannonCountText.position.set(40, -4);
    };

    const setDefaultVisible = (visible: boolean) => {
      this.cannonBase.visible = visible;
      this.cannonBarrel.visible = visible;
      this.cannonOrb.visible = visible;
    };

    clearCustomSprite();
    // Keep the vector fallback visible until the chosen image finishes loading.
    // Resetting the upload restores the bundled upright cannon.
    setDefaultVisible(true);

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    const sources = dataUrl ? [dataUrl] : [defaultCannonBaseUrl, defaultCannonBarrelUrl];
    Promise.all(sources.map(loadImage)).then(images => {
      // Ignore a delayed image load after the user chose another image or reset.
      if (requestId !== this.cannonImageRequestId) return;

      const image = images[0];
      const texture = PIXI.Texture.from(image);
      const sourceWidth = Math.max(1, image.naturalWidth || texture.width || 1);
      const sourceHeight = Math.max(1, image.naturalHeight || texture.height || 1);
      const scale = Math.min(96 / sourceWidth, 112 / sourceHeight);
      if (!dataUrl) {
        // Separate registered layers keep the pedestal/gold hinge stationary
        // while the tapered tube rotates behind them without a visible seam.
        const art = REFERENCE_CANNON_ART;
        const barrelTexture = PIXI.Texture.from(images[1]);
        const barrel = new PIXI.Sprite(new PIXI.Texture({
          source: barrelTexture.source,
          frame: new PIXI.Rectangle(0, 0, art.width, art.barrelFrameBottom),
        }));
        const base = new PIXI.Sprite(texture);
        barrel.anchor.set(art.axisX / art.width, art.pivotY / art.barrelFrameBottom);
        barrel.rotation = this.aimAngle + Math.PI / 2;
        barrel.eventMode = 'none';
        base.anchor.set(art.axisX / art.width, art.bottomY / art.height);
        base.position.set(0, 26);
        base.eventMode = 'none';
        this.customCannonBarrelSprite = barrel;
        this.customCannonSprite = base;
        this.cannonContainer.addChildAt(barrel, 0);
        this.cannonContainer.addChildAt(base, 1);
        this.usesDefaultCannonArtwork = true;
        this.fitDefaultCannonArtwork();
      } else {
        const sprite = new PIXI.Sprite(texture);
        this.cannonPivotOffsetY = 26 - sourceHeight * 0.24 * scale;
        this.cannonMuzzleLength = sourceHeight * (0.76 - 0.035) * scale;
        sprite.anchor.set(0.5, 0.76);
        sprite.scale.set(scale);
        sprite.position.set(0, this.cannonPivotOffsetY);
        sprite.rotation = this.aimAngle + Math.PI / 2;
        sprite.eventMode = 'none';
        this.customCannonSprite = sprite;
        this.cannonContainer.addChildAt(sprite, 0);
      }
      this.updateCannonBarrelPose();
      setDefaultVisible(false);
    }).catch(() => {
      if (requestId === this.cannonImageRequestId) setDefaultVisible(true);
    });
  }

  private fitDefaultCannonArtwork() {
    if (!this.usesDefaultCannonArtwork || !this.customCannonSprite || !this.customCannonBarrelSprite) return;
    const cellSize = this.getBoardDimensionsCallback?.().cellSize || 50;
    const fit = getReferenceCannonFit(cellSize);
    this.cannonPivotOffsetY = fit.pivotOffsetY;
    this.cannonMuzzleLength = fit.muzzleLength;
    this.customCannonSprite.scale.set(fit.scale);
    this.customCannonBarrelSprite.scale.set(fit.scale);
    this.customCannonBarrelSprite.position.set(0, fit.pivotOffsetY);
    this.cannonCountText.position.set(fit.countX, fit.countY);
    this.updateCannonBarrelPose();
  }

  public updateCannonPosition() {
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();
    // A canvas resize can recreate/reorder display children. Reassert that the
    // launcher overlay is attached to the game world before positioning it.
    if (this.gameStage && !this.gameStage.children.includes(this.container)) {
      this.gameStage.addChild(this.container);
    }
    // Above bricks/borders, below the shared shatter effects (zIndex 1000).
    this.container.zIndex = 200;
    // Keep the base and launch origin on the board's centre line at any width.
    this.cannonX = dims.width / 2;
    // Cannon sits right at the very bottom edge of the board
    this.cannonY = dims.height - 26;
    this.cannonContainer.position.set(this.cannonX, this.cannonY);
    this.fitDefaultCannonArtwork();
  }

  /** Keeps the launcher usable after a grid-width or cell-size change. */
  public handleBoardResize() {
    if (!this.enabled) return;

    // In-flight balls and an aim line use the old coordinate system, so reset
    // them before putting the cannon at the new board centre.
    this.cancelAim();
    this.resetAllBalls();
    this.container.visible = true;
    this.cannonContainer.visible = true;
    this.updateCannonPosition();
    this.updateReadyBallCountText();

    // applyGridConfig resizes Pixi during the same turn. Run once more on its
    // next ticker frame, after Pixi has applied the new renderer dimensions.
    // This prevents the launcher from retaining an off-board position after a
    // column-count change.
    this.app?.ticker.addOnce(() => {
      if (!this.enabled) return;
      this.container.visible = true;
      this.cannonContainer.visible = true;
      this.updateCannonPosition();
      this.updateReadyBallCountText();
    });
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;

    if (enabled) {
      this.updateCannonPosition();
      this.resetAllBalls();
      this.updateReadyBallCountText();
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
        if (!b || !b.sprite || !b.sprite.visible || (b.hitPoints !== undefined && b.hitPoints <= 0)) return false;
        const bLeft = b.sprite.x;
        const bRight = bLeft + b.length * dims.cellSize;
        const bTop = b.sprite.y;
        const bBottom = bTop + dims.cellSize;
        return local.x >= bLeft && local.x <= bRight && local.y >= bTop && local.y <= bBottom;
      });
    };

    this.app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      if (!this.enabled) return;
      if (this.isPlayModeCallback && !this.isPlayModeCallback()) return;
      // If pointer is touching a block, allow block sliding, do NOT aim cannon!
      if (isPointerOnBlock(e.global.x, e.global.y)) {
        return;
      }
      this.isAiming = true;
      this.updateAim(e.global.x, e.global.y);
    });

    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.enabled || !this.isAiming) return;
      if (this.isPlayModeCallback && !this.isPlayModeCallback()) {
        this.cancelAim();
        return;
      }
      this.updateAim(e.global.x, e.global.y);
    });

    const finishAim = () => {
      if (!this.enabled || !this.isAiming) return;
      this.isAiming = false;
      this.aimLineGraphics.clear();
      if (this.isPlayModeCallback && !this.isPlayModeCallback()) return;
      this.startLaunch();
    };

    this.app.stage.on('pointerup', finishAim);
    this.app.stage.on('pointerupoutside', finishAim);
  }

  private updateAim(pointerX: number, pointerY: number) {
    // Transform global pointer coordinates to container coordinates
    const local = this.container.toLocal({ x: pointerX, y: pointerY });
    const dx = local.x - this.cannonX;
    const dy = local.y - (this.cannonY + this.cannonPivotOffsetY);

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
    this.updateCannonBarrelPose();

    this.renderAimLine();
  }

  private updateCannonBarrelPose() {
    const recoilX = -Math.cos(this.aimAngle) * this.cannonRecoilOffset;
    const recoilY = -Math.sin(this.aimAngle) * this.cannonRecoilOffset;
    this.cannonBarrel.rotation = this.aimAngle + Math.PI / 2;
    this.cannonBarrel.position.set(recoilX, recoilY);
    const rotatingSprite = this.customCannonBarrelSprite || this.customCannonSprite;
    if (rotatingSprite) {
      rotatingSprite.rotation = this.aimAngle + Math.PI / 2;
      rotatingSprite.position.set(recoilX, this.cannonPivotOffsetY + recoilY);
    }
  }

  private triggerCannonRecoil() {
    const cellSize = this.getBoardDimensionsCallback?.().cellSize || 50;
    // Tiny backwards kick with a cap, so rapid fire cannot displace the cannon.
    this.cannonRecoilOffset = Math.min(cellSize * 0.06, this.cannonRecoilOffset + cellSize * 0.045);
    this.updateCannonBarrelPose();
  }

  private updateCannonRecoil(delta: number) {
    if (this.cannonRecoilOffset <= 0) return;
    // Frame-rate independent spring-like recovery (~0.15 seconds).
    this.cannonRecoilOffset *= Math.exp(-Math.max(0, delta) * 16.6 / 55);
    if (this.cannonRecoilOffset < 0.01) this.cannonRecoilOffset = 0;
    this.updateCannonBarrelPose();
    if (this.isAiming) this.renderAimLine();
  }

  private getMuzzlePosition() {
    return getCannonMuzzle(
      this.cannonX, this.cannonY + this.cannonPivotOffsetY,
      this.aimAngle, this.cannonMuzzleLength - this.cannonRecoilOffset,
    );
  }

  private renderAimLine() {
    this.aimLineGraphics.clear();
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();

    const maxBounces = 2;
    const muzzle = this.getMuzzlePosition();
    let currX = muzzle.x;
    let currY = muzzle.y;
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
    if (!this.enabled || (this.isPlayModeCallback && !this.isPlayModeCallback())) return;
    if (this.readyBallCount <= 0) return;
    // Only recovered ammunition can be fired again. In-flight balls and any
    // not-yet-emitted balls from the earlier shot must remain intact.
    if (!this.isLaunching) this.nextLaunchTimer = 0;
    this.ballsToLaunch += this.readyBallCount;
    this.readyBallCount = 0;
    this.isLaunching = true;
    this.hasActiveBalls = true;
    this.updateReadyBallCountText();
  }

  public setBallCount(count: number) {
    this.config.ballCount = Math.max(1, Math.floor(count));
    this.readyBallCount = Math.max(0, this.config.ballCount - this.activeBallCount - this.ballsToLaunch);
    this.updateReadyBallCountText();
  }

  private updateReadyBallCountText() {
    this.cannonCountText.text = `x${this.readyBallCount}`;
  }

  private collectBall(ball: Ball) {
    if (!ball.active) return;
    ball.active = false;
    ball.returning = false;
    ball.sprite.visible = false;
    ball.trailGraphics.clear();
    this.activeBallCount--;
    // Lowering the count slider retires excess balls only after they return.
    const capacity = Math.max(0, this.config.ballCount - this.activeBallCount - this.ballsToLaunch);
    this.readyBallCount = Math.min(this.readyBallCount + 1, capacity);
    this.updateReadyBallCountText();
  }

  public setSoundPlayer(player: (sound: HTMLAudioElement) => void) {
    this.soundPlayer = player;
    // Decode ahead of the first shot/hit, rather than load on the collision.
    for (let i = 0; i < 8; i++) {
      this.launchSounds[i] ??= this.createAudioVoice(ballLaunchSoundUrl, 0.225);
    }
    for (let i = 0; i < 16; i++) {
      this.impactSounds[i] ??= this.createAudioVoice(ballImpactSoundUrl, 0.0875);
    }
  }

  private createAudioVoice(url: string, volume: number) {
    const sound = new Audio(url);
    sound.volume = volume;
    sound.preload = 'auto';
    sound.load();
    return sound;
  }

  private playAudio(sound: HTMLAudioElement) {
    if (this.soundPlayer) {
      // The editor routes playback to both speakers and the video recorder.
      this.soundPlayer(sound);
    } else {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  private playLaunchSound() {
    try {
      // Selected emissions sound immediately. A bounded voice pool preserves
      // short overlapping attacks without allocating an unlimited audio player.
      let sound = this.launchSounds[this.launchSoundIndex];
      if (!sound) {
        sound = this.createAudioVoice(ballLaunchSoundUrl, 0.225);
        this.launchSounds[this.launchSoundIndex] = sound;
      }
      this.launchSoundIndex = (this.launchSoundIndex + 1) % 8;
      this.playAudio(sound);
    } catch {}
  }

  private playImpactSound() {
    this.impactEventCount++;
    if (this.impactEventCount % 2 === 0) return;
    try {
      let sound = this.impactSounds[this.impactSoundIndex];
      if (!sound) {
        sound = this.createAudioVoice(ballImpactSoundUrl, 0.0875);
        this.impactSounds[this.impactSoundIndex] = sound;
      }
      this.impactSoundIndex = (this.impactSoundIndex + 1) % 16;
      this.playAudio(sound);
    } catch {}
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

    const muzzle = this.getMuzzlePosition();
    ball.x = muzzle.x;
    ball.y = muzzle.y;
    ball.vx = Math.cos(this.aimAngle) * this.config.ballSpeed;
    ball.vy = Math.sin(this.aimAngle) * this.config.ballSpeed;
    ball.active = true;
    this.activeBallCount++;
    ball.returning = false;
    ball.sprite.visible = true;
    ball.trailGraphics.clear();
    ball.sprite.position.set(ball.x, ball.y);
    // Sound on balls 1, 3, 5...: immediate feedback, then once per pair.
    this.launchEmissionCount++;
    if (this.launchEmissionCount % 2 === 1) this.playLaunchSound();
    this.triggerCannonRecoil();
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
    if (this.isLaunching && !this.isAiming) {
      this.nextLaunchTimer += delta * 16.6;
      while (this.nextLaunchTimer >= this.config.launchIntervalMs && this.ballsToLaunch > 0) {
        this.nextLaunchTimer -= this.config.launchIntervalMs;
        this.ballsToLaunch--;
        this.spawnBall();
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
    this.updateCannonRecoil(delta);
  }

  private updateBallsPhysics(delta: number) {
    if (!this.getBoardDimensionsCallback) return;
    const dims = this.getBoardDimensionsCallback();
    const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];

    const bottomDeadZone = dims.height - 20;
    // Full occupied grid cells, independent of each gem's decorative inset.
    // Read moving sprite coordinates once per physics frame, not static cols.
    const collisionRects = blocks.filter(b => b && b.hitPoints > 0).map(b => {
      const left = b.sprite ? b.sprite.x : b.col * dims.cellSize;
      const top = b.sprite ? b.sprite.y : b.row * dims.cellSize;
      return { block: b, left, right: left + b.length * dims.cellSize, top, bottom: top + dims.cellSize };
    });
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
          this.collectBall(ball);
        } else {
          ball.x += (dx / dist) * 22;
          ball.y += (dy / dist) * 22;
          ball.sprite.position.set(ball.x, ball.y);
          activeCount++;
        }
        continue;
      }

      activeCount++;

      // Sweep the full path, then continue the unused time after each bounce.
      // This prevents both fast-ball tunneling and false bounces at row seams.
      const substeps = 2;
      for (let s = 0; s < substeps; s++) {
        let remaining = Math.max(0, delta / substeps);
        ball.x = Math.max(ball.radius, Math.min(dims.width - ball.radius, ball.x));
        ball.y = Math.max(ball.radius, ball.y);
        for (let contact = 0; remaining > 1e-9 && contact < 8; contact++) {
          if (ball.y >= bottomDeadZone) {
            ball.returning = true;
            ball.vx = ball.vy = 0;
            break;
          }
          const dx = ball.vx * remaining;
          const dy = ball.vy * remaining;
          let firstTime = 2;
          let normalX = 0;
          let normalY = 0;
          let hitBlock: any = null;
          let hitX = 0;
          let hitY = 0;
          let hitDistanceSq = Infinity;
          let returning = false;
          const boundary = (time: number, nx: number, ny: number, bottom = false) => {
            if (time < 0 || time > 1 || time > firstTime) return;
            if (Math.abs(time - firstTime) < 1e-9) {
              normalX ||= nx;
              normalY ||= ny;
            } else {
              firstTime = time;
              normalX = nx;
              normalY = ny;
            }
            returning = bottom;
          };
          if (dx < 0) boundary((ball.radius - ball.x) / dx, 1, 0);
          if (dx > 0) boundary((dims.width - ball.radius - ball.x) / dx, -1, 0);
          if (dy < 0) boundary((ball.radius - ball.y) / dy, 0, 1);
          if (dy > 0) boundary((bottomDeadZone - ball.y) / dy, 0, 0, true);

          for (const rect of collisionRects) {
            // A previous ball/contact may have just destroyed this block.
            if (rect.block.hitPoints <= 0) continue;
            const hit = sweepBallAgainstBlock(ball.x, ball.y, dx, dy, ball.radius, rect);
            if (!hit || hit.time > firstTime + 1e-9) continue;
            const distanceSq = (ball.x + dx * hit.time - hit.hitX) ** 2
              + (ball.y + dy * hit.time - hit.hitY) ** 2;
            // At a joint both expanded rectangles may be reached together.
            // Prefer the actual flat face, not its neighbor's decorative corner.
            if (Math.abs(hit.time - firstTime) < 1e-9
              && (!hitBlock || distanceSq >= hitDistanceSq - 1e-9)) continue;
            firstTime = hit.time;
            normalX = hit.normalX;
            normalY = hit.normalY;
            hitBlock = rect.block;
            hitX = hit.hitX;
            hitY = hit.hitY;
            hitDistanceSq = distanceSq;
            returning = false;
          }
          if (firstTime > 1) {
            ball.x += dx;
            ball.y += dy;
            break;
          }
          ball.x += dx * firstTime;
          ball.y += dy * firstTime;
          if (returning) {
            ball.returning = true;
            ball.vx = ball.vy = 0;
            break;
          }
          if (normalX) ball.vx = -ball.vx;
          if (normalY) ball.vy = -ball.vy;
          // Keep the center just outside the wall so adjacent bricks cannot
          // immediately produce a second, contradictory reflection.
          ball.x += normalX * 0.001;
          ball.y += normalY * 0.001;
          if (hitBlock) this.handleBlockHit(hitBlock, hitX, hitY);
          else this.createSparks(ball.x, ball.y, 0xffe066);
          remaining *= 1 - firstTime;
        }
        if (ball.returning) break;
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
      this.updateReadyBallCountText();
    }
  }

  private handleBlockHit(block: any, hitX: number, hitY: number) {
    this.playImpactSound();
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
      overlay.eventMode = 'none';
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

  public resetAllBalls() {
    this.launchEmissionCount = 0;
    this.impactEventCount = 0;
    this.isLaunching = false;
    this.hasActiveBalls = false;
    this.isAiming = false;
    this.cannonRecoilOffset = 0;
    this.updateCannonBarrelPose();
    this.activeBallCount = 0;
    this.ballsToLaunch = 0;
    this.nextLaunchTimer = 0;
    this.readyBallCount = this.config.ballCount;
    this.balls.forEach(b => {
      b.active = false;
      b.sprite.visible = false;
      if (b.trailGraphics) b.trailGraphics.clear();
    });
    this.aimLineGraphics.clear();
    this.updateReadyBallCountText();
  }

  public randomizeHPForBlocks(blocks: any[], preserveHitPoints: boolean = false) {
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
      const hasSavedHP = preserveHitPoints && Number.isFinite(b.hitPoints) && b.hitPoints > 0;
      const hp = hasSavedHP ? b.hitPoints : presetList[Math.floor(Math.random() * presetList.length)];
      b.hitPoints = hp;
      b.maxHitPoints = hasSavedHP && Number.isFinite(b.maxHitPoints) && b.maxHitPoints >= hp ? b.maxHitPoints : hp;

      const posX = b.sprite ? b.sprite.x : (b.col * dims.cellSize);
      const posY = b.sprite ? b.sprite.y : (b.row * dims.cellSize);
      const centerX = posX + (b.length * dims.cellSize) / 2;
      const centerY = posY + dims.cellSize / 2;

      if (!b.hpTextSprite || b.hpTextSprite.parent !== this.blockTextsContainer) {
        if (b.hpTextSprite && b.hpTextSprite.parent) {
          b.hpTextSprite.parent.removeChild(b.hpTextSprite);
        }
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
            dropShadow: false,
          },
        });
        text.eventMode = 'none';
        text.anchor.set(0.5);
        text.position.set(centerX, centerY);
        this.blockTextsContainer.addChild(text);
        b.hpTextSprite = text;
      } else {
        b.hpTextSprite.text = String(hp);
        b.hpTextSprite.style.dropShadow = false;
        b.hpTextSprite.position.set(centerX, centerY);
        b.hpTextSprite.visible = true;
      }
    });
  }

  public clearAllVisuals() {
    const blocks = this.getBlocksCallback ? this.getBlocksCallback() : [];
    blocks.forEach(b => {
      if (b) {
        if (b.hpTextSprite && b.hpTextSprite.parent) {
          b.hpTextSprite.parent.removeChild(b.hpTextSprite);
        }
        b.hpTextSprite = null;
        if (b.hitHighlightOverlay && b.hitHighlightOverlay.parent) {
          b.hitHighlightOverlay.parent.removeChild(b.hitHighlightOverlay);
        }
        b.hitHighlightOverlay = null;
      }
    });
    this.blockTextsContainer.removeChildren();
    this.blockHighlightsContainer.removeChildren();
    this.resetAllBalls();
  }
}

export const ballShooterSystem = new BallShooterSystem();
