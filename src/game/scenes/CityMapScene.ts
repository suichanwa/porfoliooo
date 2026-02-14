import Phaser from 'phaser';
import type { CharacterCreationData } from '../types/characterTypes';
import type { EnemyType } from '../constants';

interface CityMapSceneData {
  character?: CharacterCreationData;
  difficulty?: string;
}

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 1200;
const PLAYER_SPEED = 220;
const ENEMY_POOL: EnemyType[] = ['SLIME', 'BAT', 'SHADOW_WISP', 'SKELETON'];

class CityMapScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private infoText!: Phaser.GameObjects.Text;
  private gatePrompt!: Phaser.GameObjects.Text;
  private gateZone!: Phaser.GameObjects.Zone;
  private character: CharacterCreationData | null = null;
  private isNearGate = false;

  constructor() {
    super({ key: 'MysticRuinsCityMapScene' });
  }

  init(data: CityMapSceneData) {
    this.character = data.character ?? null;
  }

  create() {
    this.createCityBackground();
    this.createCityDetails();
    this.createRuinsGate();
    this.createPlayer();
    this.setupInput();
    this.createUiText();

    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  update(_: number, delta: number) {
    if (!this.player) {
      return;
    }

    let directionX = 0;
    let directionY = 0;

    if (this.cursors.left.isDown || this.movementKeys.left.isDown) {
      directionX = -1;
    } else if (this.cursors.right.isDown || this.movementKeys.right.isDown) {
      directionX = 1;
    }

    if (this.cursors.up.isDown || this.movementKeys.up.isDown) {
      directionY = -1;
    } else if (this.cursors.down.isDown || this.movementKeys.down.isDown) {
      directionY = 1;
    }

    if (directionX !== 0 || directionY !== 0) {
      const length = Math.hypot(directionX, directionY);
      directionX /= length;
      directionY /= length;
    }

    const distance = (PLAYER_SPEED * delta) / 1000;
    const nextX = Phaser.Math.Clamp(this.player.x + directionX * distance, 30, MAP_WIDTH - 30);
    const nextY = Phaser.Math.Clamp(this.player.y + directionY * distance, 30, MAP_HEIGHT - 30);

    this.player.setPosition(nextX, nextY);
    this.playerShadow.setPosition(nextX, nextY + 14);

    const touchingGate = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.gateZone.getBounds()
    );

    if (touchingGate !== this.isNearGate) {
      this.isNearGate = touchingGate;
      this.gatePrompt.setVisible(touchingGate);
    }

    if (this.isNearGate && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.enterBattle();
    }
  }

  private createCityBackground() {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x3b4458, 0x3b4458, 0x7a5e3f, 0x7a5e3f, 1, 1, 1, 1);
    sky.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    sky.setDepth(0);

    const ground = this.add.graphics();
    ground.fillStyle(0x566042, 1);
    ground.fillRect(0, 160, MAP_WIDTH, MAP_HEIGHT - 160);
    ground.setDepth(1);

    const dirtPatches = this.add.graphics();
    dirtPatches.setDepth(2);
    for (let i = 0; i < 60; i++) {
      const x = 80 + ((i * 73) % (MAP_WIDTH - 160));
      const y = 210 + ((i * 97) % (MAP_HEIGHT - 250));
      const radius = 8 + (i % 4) * 3;
      dirtPatches.fillStyle(0x695f49, 0.28);
      dirtPatches.fillCircle(x, y, radius);
    }

    const mainRoad = this.add.graphics();
    mainRoad.fillStyle(0x70695f, 1);
    mainRoad.fillRect(0, 540, MAP_WIDTH, 120);
    mainRoad.fillRect(740, 160, 120, MAP_HEIGHT - 160);
    mainRoad.setDepth(3);

    this.createCobblestoneRoad(0, 540, MAP_WIDTH, 120, 4);
    this.createCobblestoneRoad(740, 160, 120, MAP_HEIGHT - 160, 4);

    const townWall = this.add.graphics();
    townWall.setDepth(6);
    townWall.fillStyle(0x747070, 1);
    townWall.fillRect(0, 160, MAP_WIDTH, 36);
    townWall.lineStyle(2, 0x4e4b4b, 1);
    for (let x = 0; x < MAP_WIDTH; x += 36) {
      townWall.strokeRect(x, 160, 34, 18);
    }
  }

  private createCityDetails() {
    const blockSpecs = [
      { x: 170, y: 280, w: 170, h: 132, c: 0xb7a68a },
      { x: 395, y: 260, w: 220, h: 152, c: 0xc0af91 },
      { x: 955, y: 262, w: 230, h: 148, c: 0xb9a788 },
      { x: 1230, y: 298, w: 210, h: 122, c: 0xb19d80 },
      { x: 180, y: 775, w: 214, h: 160, c: 0xbca98d },
      { x: 455, y: 785, w: 175, h: 145, c: 0xae9a7d },
      { x: 950, y: 760, w: 240, h: 172, c: 0xb6a286 },
      { x: 1265, y: 772, w: 188, h: 148, c: 0xb09a7a }
    ];

    blockSpecs.forEach((block) => {
      this.drawTimberHouse(block.x, block.y, block.w, block.h, block.c);
    });

    this.drawMarketStall(700, 342, 0x9e3a34, 0x4f3725);
    this.drawMarketStall(866, 342, 0x2d5f8f, 0x503826);
    this.drawMarketStall(700, 868, 0x7f6332, 0x4f3725);
    this.drawMarketStall(866, 868, 0x7b2e2a, 0x503826);

    const squareWell = this.add.graphics();
    squareWell.setDepth(7);
    squareWell.fillStyle(0x7a7571, 1);
    squareWell.fillCircle(800, 600, 40);
    squareWell.fillStyle(0x2d425d, 1);
    squareWell.fillCircle(800, 600, 28);
    squareWell.lineStyle(3, 0x4b4540, 1);
    squareWell.strokeCircle(800, 600, 40);

    const trees = this.add.graphics();
    trees.setDepth(5);
    for (let i = 0; i < 36; i++) {
      const x = 70 + (i * 43) % (MAP_WIDTH - 100);
      const y = 210 + ((i * 71) % (MAP_HEIGHT - 260));
      trees.fillStyle(0x3f2f22, 1);
      trees.fillRect(x - 2, y, 5, 12);
      trees.fillStyle(0x2f5d2f, 1);
      trees.fillCircle(x, y - 6, 11);
      trees.fillStyle(0x437042, 0.8);
      trees.fillCircle(x + 4, y - 8, 6);
    }
  }

  private createRuinsGate() {
    const gate = this.add.graphics();
    gate.setDepth(8);
    gate.fillStyle(0x7a756f, 1);
    gate.fillRoundedRect(MAP_WIDTH - 190, 490, 140, 210, 16);
    gate.fillStyle(0x3c2c22, 1);
    gate.fillRoundedRect(MAP_WIDTH - 172, 518, 104, 168, 12);
    gate.lineStyle(3, 0x4c4743, 1);
    gate.strokeRoundedRect(MAP_WIDTH - 190, 490, 140, 210, 16);
    gate.lineStyle(2, 0x958b7d, 1);
    gate.strokeRoundedRect(MAP_WIDTH - 180, 500, 120, 190, 14);

    const banner = this.add.graphics();
    banner.setDepth(9);
    banner.fillStyle(0x7b1f1f, 1);
    banner.fillRect(MAP_WIDTH - 162, 458, 84, 28);
    banner.fillTriangle(MAP_WIDTH - 162, 486, MAP_WIDTH - 120, 510, MAP_WIDTH - 78, 486);
    banner.lineStyle(2, 0xd2b173, 1);
    banner.strokeRect(MAP_WIDTH - 162, 458, 84, 28);

    this.add.text(MAP_WIDTH - 120, 470, 'RUINS GATE', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#f3e4c0',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(8);

    this.gateZone = this.add.zone(MAP_WIDTH - 120, 590, 140, 220);

    const leftTorch = this.add.circle(MAP_WIDTH - 206, 572, 7, 0xffa64d).setDepth(10);
    const rightTorch = this.add.circle(MAP_WIDTH - 34, 572, 7, 0xffa64d).setDepth(10);
    this.tweens.add({
      targets: [leftTorch, rightTorch],
      alpha: { from: 1, to: 0.6 },
      scaleX: { from: 1, to: 1.25 },
      scaleY: { from: 1, to: 1.25 },
      duration: 220,
      yoyo: true,
      repeat: -1
    });

    this.gatePrompt = this.add.text(MAP_WIDTH - 120, 710, 'Press E to enter battle', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#f8daa0',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  private createPlayer() {
    const spawnX = 360;
    const spawnY = 600;

    this.playerShadow = this.add.ellipse(spawnX, spawnY + 14, 26, 10, 0x000000, 0.35);
    this.playerShadow.setDepth(9);

    this.player = this.add.rectangle(spawnX, spawnY, 24, 30, 0x6f3a2f);
    this.player.setStrokeStyle(2, 0xe8d5a6, 1);
    this.player.setDepth(10);
  }

  private setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.movementKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as CityMapScene['movementKeys'];
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createUiText() {
    this.infoText = this.add.text(18, 18, 'Old Town: Move with WASD / Arrows', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#f0e3c7',
      stroke: '#000000',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(30);

    const subText = this.add.text(18, 42, 'Reach the gate to venture into the ruins', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#d7c5a1',
      stroke: '#000000',
      strokeThickness: 2
    }).setScrollFactor(0).setDepth(30);

    this.gatePrompt.setScrollFactor(1);
    subText.setName('city_subtitle');
  }

  private enterBattle() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const enemyType = Phaser.Utils.Array.GetRandom(ENEMY_POOL);
      this.scene.start('MysticRuinsBattleScene', {
        enemyType,
        difficulty: 'Normal',
        character: this.character
      });
    });
  }

  private createCobblestoneRoad(x: number, y: number, width: number, height: number, depth: number) {
    const stones = this.add.graphics();
    stones.setDepth(depth);

    const rows = Math.floor(height / 14);
    const cols = Math.floor(width / 20);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const jitterX = ((row + col) % 3) - 1;
        const jitterY = ((row * col) % 3) - 1;
        const stoneX = x + col * 20 + 2 + jitterX;
        const stoneY = y + row * 14 + 2 + jitterY;
        const shade = row % 2 === 0 ? 0x8c8478 : 0x80786c;
        stones.fillStyle(shade, 0.8);
        stones.fillRoundedRect(stoneX, stoneY, 16, 10, 2);
      }
    }
  }

  private drawTimberHouse(x: number, y: number, width: number, height: number, wallColor: number) {
    const house = this.add.graphics();
    house.setDepth(6);
    house.fillStyle(wallColor, 1);
    house.fillRect(x, y, width, height);
    house.lineStyle(2, 0x2d2118, 1);
    house.strokeRect(x, y, width, height);

    house.lineStyle(4, 0x4b3626, 1);
    house.lineBetween(x + 12, y, x + 12, y + height);
    house.lineBetween(x + width / 2, y, x + width / 2, y + height);
    house.lineBetween(x + width - 12, y, x + width - 12, y + height);
    house.lineBetween(x, y + 32, x + width, y + 32);
    house.lineBetween(x, y + height - 28, x + width, y + height - 28);

    house.fillStyle(0x5b3320, 1);
    house.fillTriangle(x - 14, y, x + width + 14, y, x + width / 2, y - 46);
    house.lineStyle(2, 0x3a2012, 1);
    house.strokeTriangle(x - 14, y, x + width + 14, y, x + width / 2, y - 46);

    house.fillStyle(0x2f1e15, 1);
    house.fillRoundedRect(x + width / 2 - 16, y + height - 44, 32, 44, 5);

    house.fillStyle(0xf1d38a, 0.75);
    house.fillRoundedRect(x + 22, y + 46, 22, 18, 3);
    house.fillRoundedRect(x + width - 44, y + 46, 22, 18, 3);
  }

  private drawMarketStall(x: number, y: number, awningColor: number, woodColor: number) {
    const stall = this.add.graphics();
    stall.setDepth(7);

    stall.fillStyle(woodColor, 1);
    stall.fillRect(x, y, 120, 16);
    stall.fillRect(x + 6, y + 16, 8, 40);
    stall.fillRect(x + 106, y + 16, 8, 40);
    stall.fillRect(x + 12, y + 48, 96, 14);

    stall.fillStyle(awningColor, 1);
    stall.fillRect(x, y - 20, 120, 20);
    stall.fillStyle(0xe5d3ae, 0.7);
    stall.fillRect(x + 18, y - 20, 14, 20);
    stall.fillRect(x + 52, y - 20, 14, 20);
    stall.fillRect(x + 86, y - 20, 14, 20);
  }
}

export function createCityMapScene(Phaser: any) {
  return class extends CityMapScene {
    constructor() {
      super();
    }
  };
}

export { CityMapScene };
