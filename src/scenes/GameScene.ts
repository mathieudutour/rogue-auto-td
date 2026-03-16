import Phaser from 'phaser';
import { IsometricMap, TileType } from '../map/IsometricMap';
import { PathGraph } from '../map/PathGraph';
import { MAP_1 } from '../data/maps';
import { getMapCenter, tileToScreen } from '../utils/iso';
import { STARTING_LIVES, STARTING_GOLD, BASE_WAVE_GOLD, COLORS } from '../utils/constants';
import { WaveManager } from '../systems/WaveManager';
import { CombatSystem } from '../systems/CombatSystem';
import { ShopManager } from '../systems/ShopManager';
import { SynergyManager } from '../systems/SynergyManager';
import { EconomyManager } from '../systems/EconomyManager';
import { Enemy } from '../entities/Enemy';
import { Champion } from '../entities/Champion';

export type GamePhase = 'shopping' | 'combat';

export class GameScene extends Phaser.Scene {
  isoMap!: IsometricMap;
  pathGraph!: PathGraph;

  // Systems
  waveManager!: WaveManager;
  combatSystem!: CombatSystem;
  shopManager!: ShopManager;
  synergyManager!: SynergyManager;
  economyManager!: EconomyManager;

  // Game state
  phase: GamePhase = 'shopping';
  lives: number = STARTING_LIVES;
  waveNumber: number = 0;

  // Entity tracking
  enemies: Enemy[] = [];
  champions: Champion[] = [];
  bench: (Champion | null)[] = [];

  // Placement state
  placingChampion: Champion | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Build map
    this.isoMap = new IsometricMap(this, MAP_1);
    this.pathGraph = new PathGraph(MAP_1.pathWaypoints);

    // Initialize systems
    this.economyManager = new EconomyManager(STARTING_GOLD);
    this.waveManager = new WaveManager(this);
    this.combatSystem = new CombatSystem(this);
    this.shopManager = new ShopManager(this);
    this.synergyManager = new SynergyManager(this);

    // Center camera on map
    const center = getMapCenter();
    const cam = this.cameras.main;
    cam.centerOn(center.x, center.y);

    // Camera controls: drag to pan
    this.setupCamera();

    // Start UI scene
    this.scene.launch('UIScene');

    // Start in shopping phase
    this.startShoppingPhase();
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(1.5);

    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 1 || pointer.button === 2) {
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        camStartX = cam.scrollX;
        camStartY = cam.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && (pointer.button === 1 || pointer.button === 2 || pointer.rightButtonDown())) {
        const dx = (pointer.x - dragStartX) / cam.zoom;
        const dy = (pointer.y - dragStartY) / cam.zoom;
        cam.scrollX = camStartX - dx;
        cam.scrollY = camStartY - dy;
      }
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gx: number, _gy: number, _gz: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 3);
      cam.setZoom(newZoom);
    });

    // Disable right-click context menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  startShoppingPhase(): void {
    this.phase = 'shopping';
    this.waveNumber++;

    // Award gold
    if (this.waveNumber > 1) {
      const waveGold = BASE_WAVE_GOLD;
      const interest = this.economyManager.calculateInterest();
      this.economyManager.addGold(waveGold + interest);
    }

    // Roll shop
    this.shopManager.rollShop();

    // Emit event for UI
    this.events.emit('phaseChanged', this.phase);
    this.events.emit('waveChanged', this.waveNumber);
  }

  startCombatPhase(): void {
    this.phase = 'combat';

    // Apply synergies
    this.synergyManager.calculateSynergies();

    // Start wave
    this.waveManager.startWave(this.waveNumber);

    this.events.emit('phaseChanged', this.phase);
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'combat') {
      this.waveManager.update(delta);
      this.combatSystem.update(delta);

      // Update enemies
      for (const enemy of this.enemies) {
        enemy.update(delta);
      }

      // Update champions
      for (const champion of this.champions) {
        champion.update(delta);
      }

      // Check wave complete
      if (this.waveManager.isWaveComplete() && this.enemies.length === 0) {
        this.startShoppingPhase();
      }
    }
  }

  enemyReachedEnd(enemy: Enemy): void {
    this.lives -= enemy.damage;
    this.removeEnemy(enemy);
    this.events.emit('livesChanged', this.lives);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  removeEnemy(enemy: Enemy): void {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    enemy.destroy();
  }

  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  placeChampion(champion: Champion, col: number, row: number): boolean {
    if (this.isoMap.getTileType(col, row) !== TileType.Placeable) return false;
    if (this.isoMap.isOccupied(col, row)) return false;

    const { x, y } = tileToScreen(col, row);
    champion.place(col, row, x, y);
    this.isoMap.setOccupied(col, row, true);

    if (!this.champions.includes(champion)) {
      this.champions.push(champion);
    }

    // Remove from bench if it was there
    const benchIdx = this.bench.indexOf(champion);
    if (benchIdx !== -1) {
      this.bench[benchIdx] = null;
    }

    this.synergyManager.calculateSynergies();
    this.events.emit('championsChanged');
    return true;
  }

  removeChampionFromBoard(champion: Champion): void {
    if (champion.gridCol !== undefined && champion.gridRow !== undefined) {
      this.isoMap.setOccupied(champion.gridCol, champion.gridRow, false);
    }
    champion.removeFromBoard();

    // Add to bench
    const emptySlot = this.bench.indexOf(null);
    if (emptySlot !== -1) {
      this.bench[emptySlot] = champion;
    } else {
      this.bench.push(champion);
    }

    this.synergyManager.calculateSynergies();
    this.events.emit('championsChanged');
  }

  sellChampion(champion: Champion): void {
    // Remove from board or bench
    if (champion.placed) {
      if (champion.gridCol !== undefined && champion.gridRow !== undefined) {
        this.isoMap.setOccupied(champion.gridCol, champion.gridRow, false);
      }
    }

    const benchIdx = this.bench.indexOf(champion);
    if (benchIdx !== -1) {
      this.bench[benchIdx] = null;
    }

    const champIdx = this.champions.indexOf(champion);
    if (champIdx !== -1) {
      this.champions.splice(champIdx, 1);
    }

    // Return champion to pool
    this.shopManager.returnToPool(champion.championId, champion.starLevel);

    // Get gold back
    this.economyManager.addGold(champion.cost);

    champion.destroy();
    this.synergyManager.calculateSynergies();
    this.events.emit('championsChanged');
    this.events.emit('goldChanged', this.economyManager.getGold());
  }

  private gameOver(): void {
    this.phase = 'shopping'; // Stop combat
    this.events.emit('gameOver', this.waveNumber);
  }

  getGold(): number {
    return this.economyManager.getGold();
  }
}
