import Phaser from 'phaser';
import { IsometricMap, TileType } from '../map/IsometricMap';
import { PathGraph } from '../map/PathGraph';
import { MapData, generateMap } from '../data/maps';
import { getMapCenter, tileToScreen } from '../utils/iso';
import { STARTING_LIVES, STARTING_GOLD, COLORS } from '../utils/constants';
import { WaveManager } from '../systems/WaveManager';
import { CombatSystem } from '../systems/CombatSystem';
import { ShopManager } from '../systems/ShopManager';
import { SynergyManager } from '../systems/SynergyManager';
import { EconomyManager } from '../systems/EconomyManager';
import { Enemy } from '../entities/Enemy';
import { Champion } from '../entities/Champion';
import { HeldItem, COMPONENTS } from '../data/items';
import { getLayout } from '../utils/responsive';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { RunConfig, Blessing, Curse } from '../data/meta';

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

  // Meta progression
  meta!: MetaProgressionManager;
  runConfig!: RunConfig;
  freeRerollsRemaining: number = 0;

  // Game state
  phase: GamePhase = 'shopping';
  lives: number = STARTING_LIVES;
  waveNumber: number = 0;
  private livesAtWaveStart: number = STARTING_LIVES;

  // Entity tracking
  enemies: Enemy[] = [];
  champions: Champion[] = [];
  bench: (Champion | null)[] = [];

  // Item inventory (components + combined items the player holds)
  itemInventory: HeldItem[] = [];

  // Placement state
  placingChampion: Champion | null = null;

  // Camera pan state — UIScene sets this to suppress panning during champion drag
  uiDragActive: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  mapData!: MapData;

  init(data: { meta?: MetaProgressionManager; runConfig?: RunConfig }): void {
    this.meta = data.meta || new MetaProgressionManager();
    this.runConfig = data.runConfig || { blessing: null, curses: [] };
  }

  create(): void {
    // Generate a random map each game
    this.mapData = generateMap();

    // Build map
    this.isoMap = new IsometricMap(this, this.mapData);
    this.pathGraph = new PathGraph(this.mapData.pathWaypoints);

    // Apply meta upgrades
    const startGold = STARTING_GOLD + this.meta.getStartingGoldBonus();
    this.lives = STARTING_LIVES + this.meta.getStartingLivesBonus();

    // Apply curse: fragile
    if (this.runConfig.curses.some(c => c.id === 'fragile')) {
      this.lives = Math.max(1, this.lives - 5);
    }

    // Apply blessing: item_cache (start with 2 components)
    if (this.runConfig.blessing?.id === 'item_cache') {
      for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * COMPONENTS.length);
        this.itemInventory.push({ isComponent: true, componentId: COMPONENTS[idx].id });
      }
    }

    // Free rerolls per round from meta upgrade
    this.freeRerollsRemaining = this.meta.getFreeRerolls();

    // Initialize systems
    this.economyManager = new EconomyManager(startGold, this.meta, this.runConfig);
    this.waveManager = new WaveManager(this);
    this.combatSystem = new CombatSystem(this);
    this.shopManager = new ShopManager(this);
    this.synergyManager = new SynergyManager(this);

    // Apply blessing: starting level
    if (this.runConfig.blessing?.id === 'early_bird') {
      this.economyManager.addXp(100); // enough to reach level 3
    }

    // Apply meta starting XP bonus
    const startXp = this.meta.getStartingXpBonus();
    if (startXp > 0) {
      this.economyManager.addXp(startXp);
    }

    // Place portal at enemy entrance and shard at exit
    this.createPathLandmarks();

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
    const layout = getLayout(this.scale.width, this.scale.height);
    cam.setZoom(layout.defaultZoom);

    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;
    let isPanning = false;
    const PAN_THRESHOLD = 8; // px before a touch becomes a pan

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Right/middle click always starts camera pan immediately
      if (pointer.button === 1 || pointer.button === 2) {
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        camStartX = cam.scrollX;
        camStartY = cam.scrollY;
        isPanning = true;
        return;
      }
      // Left click / touch: record start for potential pan
      if (pointer.button === 0) {
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        camStartX = cam.scrollX;
        camStartY = cam.scrollY;
        isPanning = false;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      // Right/middle button pan (desktop)
      if (isPanning && (pointer.button === 1 || pointer.button === 2 || pointer.rightButtonDown())) {
        const dx = (pointer.x - dragStartX) / cam.zoom;
        const dy = (pointer.y - dragStartY) / cam.zoom;
        cam.scrollX = camStartX - dx;
        cam.scrollY = camStartY - dy;
        return;
      }

      // Left click / touch pan — only if UI isn't dragging a champion
      if (pointer.button === 0 && !this.uiDragActive) {
        const dx = pointer.x - dragStartX;
        const dy = pointer.y - dragStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!isPanning && dist >= PAN_THRESHOLD) {
          isPanning = true;
        }

        if (isPanning) {
          cam.scrollX = camStartX - dx / cam.zoom;
          cam.scrollY = camStartY - dy / cam.zoom;
        }
      }
    });

    this.input.on('pointerup', () => {
      isPanning = false;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gx: number, _gy: number, _gz: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 3);
      cam.setZoom(newZoom);
    });

    // Pinch-to-zoom on mobile
    let lastPinchDist = 0;
    let pinchZoomStart = 0;
    this.game.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        pinchZoomStart = cam.zoom;
      }
    }, { passive: true });
    this.game.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist > 0) {
          const scale = dist / lastPinchDist;
          cam.setZoom(Phaser.Math.Clamp(pinchZoomStart * scale, 0.5, 3));
        }
      }
    }, { passive: true });

    // Disable right-click context menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private shardSprite!: Phaser.GameObjects.Sprite;
  private shardHpText!: Phaser.GameObjects.Text;

  private createPathLandmarks(): void {
    const start = this.pathGraph.getStartPoint();
    const end = this.pathGraph.getEndPoint();

    // Portal at enemy entrance
    const portal = this.add.sprite(start.x, start.y - 12, 'portal');
    portal.setDepth(start.y - 1);
    portal.setScale(1.4);
    this.tweens.add({
      targets: portal,
      scaleX: 1.5,
      scaleY: 1.3,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Shard at exit (player base)
    this.shardSprite = this.add.sprite(end.x, end.y - 16, 'shard');
    this.shardSprite.setDepth(end.y + 10);
    this.shardSprite.setScale(1.3);
    this.tweens.add({
      targets: this.shardSprite,
      y: end.y - 18,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Subtle glow pulse
    const glow = this.add.circle(end.x, end.y - 4, 18, 0x44ccff, 0.15);
    glow.setDepth(end.y + 9);
    this.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // HP text next to shard
    this.shardHpText = this.add.text(end.x, end.y + 10, `${this.lives} HP`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.shardHpText.setOrigin(0.5, 0);
    this.shardHpText.setDepth(end.y + 11);
  }

  updateShardHp(lives: number): void {
    if (this.shardHpText) {
      this.shardHpText.setText(`${lives} HP`);
      // Flash on damage
      this.tweens.add({
        targets: this.shardSprite,
        tint: { from: 0xff4444, to: 0xffffff },
        duration: 300,
        onComplete: () => this.shardSprite?.clearTint(),
      });
    }
  }

  startShoppingPhase(): void {
    this.phase = 'shopping';
    this.waveNumber++;

    // Award gold and XP
    if (this.waveNumber > 1) {
      // Track win/loss streak (win = no lives lost this wave)
      if (this.lives >= this.livesAtWaveStart) {
        this.economyManager.recordWin();
      } else {
        this.economyManager.recordLoss();
      }

      const income = this.economyManager.awardWaveIncome();
      // Passive XP per wave (halved by slow_learner curse)
      const xpGain = this.runConfig.curses.some(c => c.id === 'slow_learner') ? 1 : 2;
      this.economyManager.addXp(xpGain);
      this.events.emit('incomeBreakdown', income);

      // Generate a new map and randomly place champions
      this.regenerateMap();
    }

    // Reset free rerolls each round
    this.freeRerollsRemaining = this.meta.getFreeRerolls();

    // Item drops: guaranteed component on waves 1,2,3, then every 3rd wave
    const isDropWave = this.waveNumber <= 3 || this.waveNumber % 3 === 0;
    const isBonusWave = this.waveNumber > 1 && this.waveNumber % 5 === 0;
    const doubleDrop = this.runConfig.blessing?.id === 'double_drop';

    if (isDropWave) {
      this.dropRandomComponent();
      if (doubleDrop) this.dropRandomComponent();
    }
    if (isBonusWave) {
      this.dropRandomComponent();
      if (doubleDrop) this.dropRandomComponent();
    }

    // Meta upgrade: item luck (chance for bonus drop)
    const itemLuck = this.meta.getItemLuckPercent();
    if (itemLuck > 0 && Math.random() * 100 < itemLuck) {
      this.dropRandomComponent();
    }

    // Roll shop
    this.shopManager.rollShop();

    // Emit events for UI
    this.events.emit('phaseChanged', this.phase);
    this.events.emit('waveChanged', this.waveNumber);
    this.events.emit('levelChanged', this.economyManager.level, this.economyManager.xp, this.economyManager.getXpToNextLevel(), this.economyManager.getMaxBoardSize());
  }

  /** Generate a new map layout and randomly place all board champions on it. */
  private regenerateMap(): void {
    // Generate new map data
    this.mapData = generateMap();

    // Rebuild visual tiles and path graph
    this.isoMap.rebuild(this.mapData);
    this.pathGraph = new PathGraph(this.mapData.pathWaypoints);

    // Collect all placed champions and unplace them
    const placedChampions = this.champions.filter(c => c.placed);
    for (const champ of placedChampions) {
      champ.removeFromBoard();
    }

    // Randomly place them on the new map
    const placeableTiles = this.isoMap.getPlaceableTiles();
    // Shuffle using Fisher-Yates
    for (let i = placeableTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [placeableTiles[i], placeableTiles[j]] = [placeableTiles[j], placeableTiles[i]];
    }

    let tileIdx = 0;
    for (const champ of placedChampions) {
      if (tileIdx >= placeableTiles.length) break;
      const tile = placeableTiles[tileIdx++];
      const { x, y } = tileToScreen(tile.col, tile.row);
      champ.place(tile.col, tile.row, x, y);
      this.isoMap.setOccupied(tile.col, tile.row, true);
    }

    this.synergyManager.calculateSynergies();
    this.events.emit('championsChanged');
  }

  startCombatPhase(): void {
    this.phase = 'combat';
    this.livesAtWaveStart = this.lives;

    // Reset mana, buffs, and damage tracking for all champions
    for (const champion of this.champions) {
      champion.resetCombatState();
      champion.waveDamage = 0;
    }

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

      // Emit damage stats for UI
      this.events.emit('damageUpdate', this.champions);

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
    this.updateShardHp(this.lives);

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

  getPlacedCount(): number {
    return this.champions.filter(c => c.placed).length;
  }

  placeChampion(champion: Champion, col: number, row: number): boolean {
    if (this.isoMap.getTileType(col, row) !== TileType.Placeable) return false;
    if (this.isoMap.isOccupied(col, row)) return false;

    // Check board size limit (skip if champion is already placed — repositioning)
    if (!champion.placed) {
      const maxBoard = this.economyManager.getMaxBoardSize();
      if (this.getPlacedCount() >= maxBoard) return false;
    }

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

    // Return items to inventory
    const returnedItems = champion.removeAllItems();
    for (const item of returnedItems) {
      this.itemInventory.push(item);
    }
    if (returnedItems.length > 0) {
      this.events.emit('itemInventoryChanged', this.itemInventory);
    }

    // Get gold back (TFT formula: full investment minus 1g penalty for starred non-1-cost units)
    const sellPrice = champion.getSellPrice();
    this.economyManager.addGold(sellPrice);

    champion.destroy();
    this.synergyManager.calculateSynergies();
    this.events.emit('championsChanged');
    this.events.emit('goldChanged', this.economyManager.getGold());
  }

  private gameOver(): void {
    this.phase = 'shopping'; // Stop combat
    const waveSurvived = this.waveNumber - 1;
    const soulsEarned = this.meta.completeRun(waveSurvived, this.runConfig.curses);
    this.events.emit('gameOver', this.waveNumber, soulsEarned);
  }

  buyXp(): boolean {
    const prevLevel = this.economyManager.level;
    const success = this.economyManager.buyXp();
    if (success) {
      this.events.emit('goldChanged', this.economyManager.getGold());
      this.events.emit('levelChanged', this.economyManager.level, this.economyManager.xp, this.economyManager.getXpToNextLevel(), this.economyManager.getMaxBoardSize());
    }
    return success;
  }

  getGold(): number {
    return this.economyManager.getGold();
  }

  // ── Item System ──────────────────────────────────

  private dropRandomComponent(): void {
    const idx = Math.floor(Math.random() * COMPONENTS.length);
    const comp = COMPONENTS[idx];
    const item: HeldItem = { isComponent: true, componentId: comp.id };
    this.itemInventory.push(item);
    this.events.emit('itemInventoryChanged', this.itemInventory);
  }

  /** Apply an item from inventory to a champion. Returns true on success. */
  giveItemToChampion(inventoryIndex: number, champion: Champion): boolean {
    if (inventoryIndex < 0 || inventoryIndex >= this.itemInventory.length) return false;

    const item = this.itemInventory[inventoryIndex];
    const result = champion.addItem(item);
    if (result.accepted) {
      this.itemInventory.splice(inventoryIndex, 1);
      this.events.emit('itemInventoryChanged', this.itemInventory);
      // Recalculate synergies to re-apply stats with items
      this.synergyManager.calculateSynergies();
      this.events.emit('championsChanged');
      return true;
    }
    return false;
  }
}
