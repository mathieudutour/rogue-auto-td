import Phaser from 'phaser';
import { TILE_WIDTH, TILE_HEIGHT, COLORS, TRAIT_COLORS } from '../utils/constants';
import { COMPONENTS, COMBINED_ITEMS } from '../data/items';

/**
 * Generates all game textures procedurally — no external assets.
 * Uses layered drawing for richer visuals than flat-colored shapes.
 */

// ─── Color helpers ──────────────────────────────────────────

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - Math.round(amount * 255));
  const g = Math.max(0, ((color >> 8) & 0xff) - Math.round(amount * 255));
  const b = Math.max(0, (color & 0xff) - Math.round(amount * 255));
  return (r << 16) | (g << 8) | b;
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + Math.round(amount * 255));
  const g = Math.min(255, ((color >> 8) & 0xff) + Math.round(amount * 255));
  const b = Math.min(255, (color & 0xff) + Math.round(amount * 255));
  return (r << 16) | (g << 8) | b;
}

/** Simple pseudo-random for texture noise (deterministic per seed) */
function noise(x: number, y: number, seed: number): number {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// ─── Tile Textures ──────────────────────────────────────────

const TILE_VARIANTS = 4;
const TW = TILE_WIDTH;  // 64
const TH = TILE_HEIGHT; // 32

function drawIsoDiamond(g: Phaser.GameObjects.Graphics, fill: number, alpha: number = 1): void {
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(TW / 2, 0);   // top
  g.lineTo(TW, TH / 2);  // right
  g.lineTo(TW / 2, TH);  // bottom
  g.lineTo(0, TH / 2);   // left
  g.closePath();
  g.fillPath();
}

function drawIsoDiamondStroke(g: Phaser.GameObjects.Graphics, stroke: number, width: number = 1, alpha: number = 0.8): void {
  g.lineStyle(width, stroke, alpha);
  g.beginPath();
  g.moveTo(TW / 2, 0);
  g.lineTo(TW, TH / 2);
  g.lineTo(TW / 2, TH);
  g.lineTo(0, TH / 2);
  g.closePath();
  g.strokePath();
}

/** Check if a pixel is inside the isometric diamond */
function isInsideDiamond(px: number, py: number): boolean {
  // Diamond defined by |x - TW/2| / (TW/2) + |y - TH/2| / (TH/2) <= 1
  const nx = Math.abs(px - TW / 2) / (TW / 2);
  const ny = Math.abs(py - TH / 2) / (TH / 2);
  return (nx + ny) <= 1;
}

export function generateTileTextures(scene: Phaser.Scene): void {
  // Grass (placeable) variants
  for (let v = 0; v < TILE_VARIANTS; v++) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const base = COLORS.placeable;

    // Base fill
    drawIsoDiamond(g, base);

    // Noise pattern — subtle darker/lighter grass patches
    for (let px = 0; px < TW; px += 2) {
      for (let py = 0; py < TH; py += 2) {
        if (!isInsideDiamond(px, py)) continue;
        const n = noise(px, py, v * 100 + 1);
        if (n > 0.7) {
          g.fillStyle(darken(base, 0.08), 0.6);
          g.fillRect(px, py, 2, 2);
        } else if (n > 0.6) {
          g.fillStyle(lighten(base, 0.05), 0.4);
          g.fillRect(px, py, 2, 2);
        }
      }
    }

    // Top edge highlight (light hits the top)
    g.lineStyle(1, lighten(base, 0.2), 0.6);
    g.beginPath();
    g.moveTo(TW / 2, 1);
    g.lineTo(TW - 2, TH / 2);
    g.strokePath();

    // Bottom edge shadow
    g.lineStyle(1, darken(base, 0.15), 0.5);
    g.beginPath();
    g.moveTo(TW / 2, TH - 1);
    g.lineTo(1, TH / 2);
    g.strokePath();

    // Subtle grass tufts
    const tufts = 2 + Math.floor(noise(v, 0, 42) * 3);
    for (let t = 0; t < tufts; t++) {
      const tx = 10 + noise(t, v, 7) * (TW - 20);
      const ty = 8 + noise(v, t, 13) * (TH - 16);
      if (!isInsideDiamond(tx, ty)) continue;
      g.fillStyle(lighten(base, 0.1), 0.5);
      g.fillRect(tx, ty, 3, 1);
      g.fillRect(tx + 1, ty - 1, 1, 1);
    }

    drawIsoDiamondStroke(g, COLORS.placeableStroke);
    g.generateTexture(`tile_placeable_${v}`, TW, TH);
    g.destroy();
  }

  // Dirt path variants
  for (let v = 0; v < TILE_VARIANTS; v++) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const base = COLORS.path;

    drawIsoDiamond(g, base);

    // Cobblestone-like dots
    for (let px = 2; px < TW - 2; px += 4) {
      for (let py = 2; py < TH - 2; py += 3) {
        if (!isInsideDiamond(px, py)) continue;
        const n = noise(px, py, v * 200 + 50);
        if (n > 0.55) {
          g.fillStyle(lighten(base, 0.12), 0.5);
          g.fillCircle(px + 1, py + 1, 1.5);
        }
        if (n < 0.2) {
          g.fillStyle(darken(base, 0.1), 0.4);
          g.fillRect(px, py, 2, 2);
        }
      }
    }

    // Worn center strip (lighter)
    g.fillStyle(lighten(base, 0.06), 0.3);
    g.beginPath();
    g.moveTo(TW / 2 - 8, TH / 2 - 3);
    g.lineTo(TW / 2 + 8, TH / 2 - 3);
    g.lineTo(TW / 2 + 8, TH / 2 + 3);
    g.lineTo(TW / 2 - 8, TH / 2 + 3);
    g.closePath();
    g.fillPath();

    // Highlights and shadows
    g.lineStyle(1, lighten(base, 0.15), 0.5);
    g.beginPath();
    g.moveTo(TW / 2, 1);
    g.lineTo(TW - 2, TH / 2);
    g.strokePath();

    g.lineStyle(1, darken(base, 0.12), 0.5);
    g.beginPath();
    g.moveTo(TW / 2, TH - 1);
    g.lineTo(1, TH / 2);
    g.strokePath();

    drawIsoDiamondStroke(g, COLORS.pathStroke);
    g.generateTexture(`tile_path_${v}`, TW, TH);
    g.destroy();
  }

  // Stone (blocked) variants
  for (let v = 0; v < TILE_VARIANTS; v++) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const base = COLORS.blocked;

    drawIsoDiamond(g, base);

    // Rocky cracks and noise
    for (let px = 1; px < TW - 1; px += 3) {
      for (let py = 1; py < TH - 1; py += 2) {
        if (!isInsideDiamond(px, py)) continue;
        const n = noise(px, py, v * 300 + 99);
        if (n > 0.65) {
          g.fillStyle(darken(base, 0.12), 0.5);
          g.fillRect(px, py, 2, 1);
        }
        if (n < 0.15) {
          g.fillStyle(lighten(base, 0.08), 0.4);
          g.fillRect(px, py, 1, 2);
        }
      }
    }

    // Rock highlights on top
    if (noise(v, 1, 55) > 0.3) {
      const rx = 20 + noise(v, 2, 33) * 24;
      const ry = 8 + noise(v, 3, 44) * 12;
      if (isInsideDiamond(rx, ry)) {
        g.fillStyle(lighten(base, 0.1), 0.4);
        g.fillCircle(rx, ry, 3);
      }
    }

    g.lineStyle(1, lighten(base, 0.1), 0.4);
    g.beginPath();
    g.moveTo(TW / 2, 1);
    g.lineTo(TW - 2, TH / 2);
    g.strokePath();

    g.lineStyle(1, darken(base, 0.1), 0.4);
    g.beginPath();
    g.moveTo(TW / 2, TH - 1);
    g.lineTo(1, TH / 2);
    g.strokePath();

    drawIsoDiamondStroke(g, COLORS.blockedStroke);
    g.generateTexture(`tile_blocked_${v}`, TW, TH);
    g.destroy();
  }

  // Hover overlay (yellow highlight, semi-transparent)
  const hover = scene.make.graphics({ x: 0, y: 0 });
  drawIsoDiamond(hover, COLORS.hover, 0.15);
  drawIsoDiamondStroke(hover, COLORS.hover, 2, 1);
  hover.generateTexture('tile_hover', TW, TH);
  hover.destroy();

  // Selected overlay (cyan)
  const sel = scene.make.graphics({ x: 0, y: 0 });
  drawIsoDiamond(sel, COLORS.selected, 0.12);
  drawIsoDiamondStroke(sel, COLORS.selected, 2, 1);
  sel.generateTexture('tile_selected', TW, TH);
  sel.destroy();

  // Drag valid overlay (green)
  const dv = scene.make.graphics({ x: 0, y: 0 });
  drawIsoDiamond(dv, 0x00ff00, 0.2);
  drawIsoDiamondStroke(dv, 0x00ff00, 3, 1);
  dv.generateTexture('tile_drag_valid', TW, TH);
  dv.destroy();

  // Drag invalid overlay (red)
  const di = scene.make.graphics({ x: 0, y: 0 });
  drawIsoDiamond(di, 0xff0000, 0.2);
  drawIsoDiamondStroke(di, 0xff0000, 3, 1);
  di.generateTexture('tile_drag_invalid', TW, TH);
  di.destroy();
}

// ─── Champion Textures ──────────────────────────────────────

// Class → weapon shape drawing function
type WeaponDrawer = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number) => void;

const WEAPON_DRAWERS: Record<string, WeaponDrawer> = {
  warrior: (g, cx, cy, color) => {
    // Sword
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx + 6, cy - 8, 2, 16); // blade
    g.fillStyle(darken(color, 0.1), 1);
    g.fillRect(cx + 3, cy - 1, 8, 2); // crossguard
    g.fillStyle(0x886633, 1);
    g.fillRect(cx + 6, cy + 5, 2, 4); // grip
  },
  ranger: (g, cx, cy, color) => {
    // Bow
    g.lineStyle(2, 0x886633, 1);
    g.beginPath();
    g.arc(cx + 8, cy, 8, -Math.PI / 3, Math.PI / 3, false);
    g.strokePath();
    g.lineStyle(1, 0xcccccc, 0.8);
    g.lineBetween(cx + 8, cy - 7, cx + 8, cy + 7); // string
  },
  mage: (g, cx, cy, color) => {
    // Staff
    g.fillStyle(0x886633, 1);
    g.fillRect(cx + 7, cy - 10, 2, 20); // shaft
    g.fillStyle(lighten(color, 0.3), 1);
    g.fillCircle(cx + 8, cy - 10, 3); // orb
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx + 7, cy - 11, 1); // shine
  },
  assassin: (g, cx, cy, color) => {
    // Dual daggers
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx + 4, cy - 4, 1, 8);
    g.fillRect(cx + 9, cy - 4, 1, 8);
    g.fillStyle(darken(color, 0.1), 1);
    g.fillRect(cx + 3, cy, 3, 1);
    g.fillRect(cx + 8, cy, 3, 1);
  },
  guardian: (g, cx, cy, color) => {
    // Shield
    g.fillStyle(lighten(color, 0.1), 1);
    g.fillRoundedRect(cx + 4, cy - 5, 8, 10, 2);
    g.lineStyle(1, darken(color, 0.2), 0.8);
    g.strokeRoundedRect(cx + 4, cy - 5, 8, 10, 2);
    // Shield emblem
    g.fillStyle(0xffd700, 0.6);
    g.fillCircle(cx + 8, cy, 2);
  },
};

export function generateChampionTextures(scene: Phaser.Scene): void {
  const champions = [
    // Cost 1
    { key: 'champion_fire_warrior', element: 'fire', cls: 'warrior', cost: 1 },
    { key: 'champion_ice_ranger', element: 'ice', cls: 'ranger', cost: 1 },
    { key: 'champion_nature_warrior', element: 'nature', cls: 'warrior', cost: 1 },
    { key: 'champion_arcane_guardian', element: 'arcane', cls: 'guardian', cost: 1 },
    { key: 'champion_shadow_ranger', element: 'shadow', cls: 'ranger', cost: 1 },
    { key: 'champion_lightning_warrior', element: 'lightning', cls: 'warrior', cost: 1 },
    { key: 'champion_void_assassin', element: 'void', cls: 'assassin', cost: 1 },
    { key: 'champion_lightning_ranger', element: 'lightning', cls: 'ranger', cost: 1 },
    // Cost 2
    { key: 'champion_fire_mage', element: 'fire', cls: 'mage', cost: 2 },
    { key: 'champion_ice_mage', element: 'ice', cls: 'mage', cost: 2 },
    { key: 'champion_nature_ranger', element: 'nature', cls: 'ranger', cost: 2 },
    { key: 'champion_arcane_mage', element: 'arcane', cls: 'mage', cost: 2 },
    { key: 'champion_fire_guardian', element: 'fire', cls: 'guardian', cost: 2 },
    { key: 'champion_shadow_warrior', element: 'shadow', cls: 'warrior', cost: 2 },
    { key: 'champion_void_mage', element: 'void', cls: 'mage', cost: 2 },
    { key: 'champion_lightning_assassin', element: 'lightning', cls: 'assassin', cost: 2 },
    // Cost 3
    { key: 'champion_shadow_assassin', element: 'shadow', cls: 'assassin', cost: 3 },
    { key: 'champion_shadow_mage', element: 'shadow', cls: 'mage', cost: 3 },
    { key: 'champion_arcane_warrior', element: 'arcane', cls: 'warrior', cost: 3 },
    { key: 'champion_nature_guardian', element: 'nature', cls: 'guardian', cost: 3 },
    { key: 'champion_ice_assassin', element: 'ice', cls: 'assassin', cost: 3 },
    { key: 'champion_fire_ranger', element: 'fire', cls: 'ranger', cost: 3 },
    { key: 'champion_nature_mage', element: 'nature', cls: 'mage', cost: 3 },
    { key: 'champion_lightning_guardian', element: 'lightning', cls: 'guardian', cost: 3 },
    { key: 'champion_void_ranger', element: 'void', cls: 'ranger', cost: 3 },
    // Cost 4
    { key: 'champion_fire_assassin', element: 'fire', cls: 'assassin', cost: 4 },
    { key: 'champion_ice_warrior', element: 'ice', cls: 'warrior', cost: 4 },
    { key: 'champion_nature_assassin', element: 'nature', cls: 'assassin', cost: 4 },
    { key: 'champion_arcane_ranger', element: 'arcane', cls: 'ranger', cost: 4 },
    { key: 'champion_shadow_guardian', element: 'shadow', cls: 'guardian', cost: 4 },
    { key: 'champion_lightning_warrior_4', element: 'lightning', cls: 'warrior', cost: 4 },
    { key: 'champion_arcane_assassin', element: 'arcane', cls: 'assassin', cost: 4 },
    { key: 'champion_void_warrior', element: 'void', cls: 'warrior', cost: 4 },
    // Cost 5
    { key: 'champion_fire_legendary', element: 'fire', cls: 'guardian', cost: 5 },
    { key: 'champion_shadow_legendary', element: 'shadow', cls: 'assassin', cost: 5 },
    { key: 'champion_ice_legendary', element: 'ice', cls: 'mage', cost: 5 },
    { key: 'champion_nature_legendary', element: 'nature', cls: 'guardian', cost: 5 },
    { key: 'champion_lightning_legendary', element: 'lightning', cls: 'mage', cost: 5 },
    { key: 'champion_void_legendary', element: 'void', cls: 'ranger', cost: 5 },
    { key: 'champion_ice_guardian', element: 'ice', cls: 'guardian', cost: 5 },
    { key: 'champion_arcane_legendary', element: 'arcane', cls: 'warrior', cost: 5 },
  ];

  for (const champ of champions) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const elementColor = TRAIT_COLORS[champ.element] || 0xcccccc;
    const cx = 16, cy = 16;

    // Cost-tier glow (for 3+ cost)
    if (champ.cost >= 5) {
      g.fillStyle(lighten(elementColor, 0.3), 0.25);
      g.fillCircle(cx, cy, 15);
      g.fillStyle(lighten(elementColor, 0.2), 0.15);
      g.fillCircle(cx, cy, 14);
    } else if (champ.cost >= 3) {
      g.fillStyle(lighten(elementColor, 0.15), 0.15);
      g.fillCircle(cx, cy, 14);
    }

    // Body (torso) — rounded shape
    g.fillStyle(elementColor, 1);
    g.fillRoundedRect(cx - 7, cy - 3, 14, 12, 3);

    // Body shading
    g.fillStyle(darken(elementColor, 0.15), 0.5);
    g.fillRoundedRect(cx - 7, cy + 3, 14, 6, 2);

    // Head
    g.fillStyle(lighten(elementColor, 0.15), 1);
    g.fillCircle(cx, cy - 7, 5);
    // Head highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(cx - 1, cy - 8, 2);

    // Weapon (class-based)
    const drawWeapon = WEAPON_DRAWERS[champ.cls];
    if (drawWeapon) drawWeapon(g, cx, cy, elementColor);

    // Dark outline
    g.lineStyle(1.5, 0x000000, 0.6);
    g.strokeCircle(cx, cy - 7, 5.5); // head outline
    g.strokeRoundedRect(cx - 7.5, cy - 3.5, 15, 13, 3); // body outline

    g.generateTexture(champ.key, 32, 32);
    g.destroy();
  }

  // Default champion
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xcccccc, 1);
  g.fillRoundedRect(9, 13, 14, 12, 3);
  g.fillCircle(16, 9, 5);
  g.lineStyle(1.5, 0x000000, 0.5);
  g.strokeCircle(16, 9, 5.5);
  g.strokeRoundedRect(8.5, 12.5, 15, 13, 3);
  g.generateTexture('champion_default', 32, 32);
  g.destroy();
}

// ─── Enemy Textures ─────────────────────────────────────────

export function generateEnemyTextures(scene: Phaser.Scene): void {
  // Goblin (basic) — small hunched figure
  const basic = scene.make.graphics({ x: 0, y: 0 });
  const bc = COLORS.enemyBasic;
  basic.fillStyle(bc, 1);
  basic.fillRoundedRect(7, 10, 14, 12, 2); // body
  basic.fillStyle(lighten(bc, 0.1), 1);
  basic.fillCircle(14, 8, 4); // head
  // Eyes
  basic.fillStyle(0xffff00, 1);
  basic.fillCircle(13, 7, 1);
  basic.fillCircle(16, 7, 1);
  // Outline
  basic.lineStyle(1, darken(bc, 0.2), 0.7);
  basic.strokeRoundedRect(7, 10, 14, 12, 2);
  basic.strokeCircle(14, 8, 4);
  basic.generateTexture('enemy_basic', 28, 28);
  basic.destroy();

  // Wolf (fast) — low horizontal shape
  const fast = scene.make.graphics({ x: 0, y: 0 });
  const fc = COLORS.enemyFast;
  fast.fillStyle(fc, 1);
  fast.fillRoundedRect(3, 12, 22, 10, 3); // long body
  fast.fillStyle(lighten(fc, 0.1), 1);
  fast.fillCircle(21, 11, 4); // head
  // Ears
  fast.fillStyle(fc, 1);
  fast.fillTriangle(19, 7, 21, 5, 23, 7);
  // Eye
  fast.fillStyle(0xff0000, 1);
  fast.fillCircle(22, 10, 1);
  // Tail
  fast.lineStyle(2, darken(fc, 0.1), 1);
  fast.lineBetween(3, 14, 1, 10);
  fast.lineStyle(1, darken(fc, 0.2), 0.7);
  fast.strokeRoundedRect(3, 12, 22, 10, 3);
  fast.generateTexture('enemy_fast', 28, 28);
  fast.destroy();

  // Ogre (tank) — wide bulky shape
  const tank = scene.make.graphics({ x: 0, y: 0 });
  const tc = COLORS.enemyTank;
  tank.fillStyle(tc, 1);
  tank.fillRoundedRect(3, 8, 22, 16, 4); // wide body
  tank.fillStyle(lighten(tc, 0.1), 1);
  tank.fillCircle(14, 7, 5); // head
  // Eyes
  tank.fillStyle(0xff4444, 1);
  tank.fillCircle(12, 6, 1.5);
  tank.fillCircle(16, 6, 1.5);
  // Body detail — belt
  tank.fillStyle(darken(tc, 0.15), 0.6);
  tank.fillRect(5, 15, 18, 3);
  // Outline
  tank.lineStyle(1.5, darken(tc, 0.25), 0.7);
  tank.strokeRoundedRect(3, 8, 22, 16, 4);
  tank.strokeCircle(14, 7, 5);
  tank.generateTexture('enemy_tank', 28, 28);
  tank.destroy();

  // Dragon (boss) — tall with wings
  const boss = scene.make.graphics({ x: 0, y: 0 });
  const bossC = COLORS.enemyBoss;
  boss.fillStyle(bossC, 1);
  boss.fillRoundedRect(8, 10, 12, 14, 3); // body
  boss.fillStyle(lighten(bossC, 0.1), 1);
  boss.fillCircle(14, 8, 4); // head
  // Wings
  boss.fillStyle(darken(bossC, 0.1), 0.8);
  boss.fillTriangle(2, 18, 8, 10, 8, 18); // left wing
  boss.fillTriangle(26, 18, 20, 10, 20, 18); // right wing
  // Horns
  boss.fillStyle(0xffdd44, 1);
  boss.fillTriangle(11, 5, 12, 1, 13, 5);
  boss.fillTriangle(15, 5, 16, 1, 17, 5);
  // Eyes
  boss.fillStyle(0xff8800, 1);
  boss.fillCircle(13, 7, 1.5);
  boss.fillCircle(16, 7, 1.5);
  // Outline
  boss.lineStyle(1.5, darken(bossC, 0.3), 0.8);
  boss.strokeRoundedRect(8, 10, 12, 14, 3);
  boss.generateTexture('enemy_boss', 28, 28);
  boss.destroy();
}

// ─── Projectile Textures ────────────────────────────────────

export function generateProjectileTextures(scene: Phaser.Scene): void {
  // Normal (yellow with glow)
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffff88, 0.3);
  g.fillCircle(5, 5, 5);
  g.fillStyle(0xffff00, 1);
  g.fillCircle(5, 5, 3);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(4, 4, 1);
  g.generateTexture('projectile', 10, 10);
  g.destroy();

  // Splash (orange fireball)
  const sp = scene.make.graphics({ x: 0, y: 0 });
  sp.fillStyle(0xff4400, 0.3);
  sp.fillCircle(6, 6, 6);
  sp.fillStyle(0xff6600, 1);
  sp.fillCircle(6, 6, 4);
  sp.fillStyle(0xffaa00, 0.8);
  sp.fillCircle(5, 5, 2);
  sp.fillStyle(0xffff00, 0.5);
  sp.fillCircle(5, 4, 1);
  sp.generateTexture('projectile_splash', 12, 12);
  sp.destroy();

  // Slow (blue crystal)
  const sl = scene.make.graphics({ x: 0, y: 0 });
  sl.fillStyle(0x2266ff, 0.3);
  sl.fillCircle(5, 5, 5);
  sl.fillStyle(0x4488ff, 1);
  sl.fillCircle(5, 5, 3);
  sl.fillStyle(0xaaddff, 0.7);
  sl.fillCircle(4, 4, 1.5);
  sl.generateTexture('projectile_slow', 10, 10);
  sl.destroy();

  // Chain (electric spark)
  const ch = scene.make.graphics({ x: 0, y: 0 });
  ch.fillStyle(0x6688ff, 0.3);
  ch.fillCircle(5, 5, 5);
  ch.fillStyle(0x88aaff, 1);
  ch.fillCircle(5, 5, 3);
  ch.fillStyle(0xffffff, 0.9);
  ch.fillCircle(5, 5, 1.5);
  ch.generateTexture('projectile_chain', 10, 10);
  ch.destroy();

  // DoT (poison drop)
  const dt = scene.make.graphics({ x: 0, y: 0 });
  dt.fillStyle(0x22aa22, 0.3);
  dt.fillCircle(5, 5, 5);
  dt.fillStyle(0x44ff44, 1);
  dt.fillCircle(5, 5, 3);
  dt.fillStyle(0x88ff88, 0.6);
  dt.fillCircle(4, 4, 1.5);
  dt.generateTexture('projectile_dot', 10, 10);
  dt.destroy();

  // Range indicator
  const r = scene.make.graphics({ x: 0, y: 0 });
  r.fillStyle(0xffffff, 0.08);
  r.fillCircle(64, 64, 64);
  r.lineStyle(1, 0xffffff, 0.25);
  r.strokeCircle(64, 64, 64);
  r.generateTexture('range_indicator', 128, 128);
  r.destroy();
}

// ─── UI Textures ────────────────────────────────────────────

export function generateUITextures(scene: Phaser.Scene): void {
  // Star icon
  const s = scene.make.graphics({ x: 0, y: 0 });
  s.fillStyle(COLORS.gold, 1);
  s.fillCircle(8, 8, 6);
  s.fillStyle(lighten(COLORS.gold, 0.3), 0.6);
  s.fillCircle(7, 7, 2);
  s.generateTexture('star_icon', 16, 16);
  s.destroy();

  // Gold coin
  const gc = scene.make.graphics({ x: 0, y: 0 });
  gc.fillStyle(COLORS.gold, 1);
  gc.fillCircle(8, 8, 7);
  gc.lineStyle(1, darken(COLORS.gold, 0.2), 1);
  gc.strokeCircle(8, 8, 7);
  gc.fillStyle(lighten(COLORS.gold, 0.2), 0.5);
  gc.fillCircle(7, 7, 3);
  gc.generateTexture('gold_icon', 16, 16);
  gc.destroy();
}

// ─── Item Textures ──────────────────────────────────────────

export function generateItemTextures(scene: Phaser.Scene): void {
  const SIZE = 20;

  // Components: rounded square with diamond icon inside
  for (const comp of COMPONENTS) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Background
    g.fillStyle(darken(comp.color, 0.3), 1);
    g.fillRoundedRect(1, 1, SIZE - 2, SIZE - 2, 3);
    // Icon diamond
    g.fillStyle(comp.color, 1);
    const cx = SIZE / 2, cy = SIZE / 2, r = 5;
    g.fillTriangle(cx, cy - r, cx + r, cy, cx, cy + r);
    g.fillTriangle(cx, cy - r, cx - r, cy, cx, cy + r);
    // Highlight
    g.fillStyle(lighten(comp.color, 0.3), 0.4);
    g.fillCircle(cx - 1, cy - 1, 2);
    // Border
    g.lineStyle(1, lighten(comp.color, 0.2), 0.8);
    g.strokeRoundedRect(1, 1, SIZE - 2, SIZE - 2, 3);
    g.generateTexture(`item_${comp.id}`, SIZE, SIZE);
    g.destroy();
  }

  // Combined items: rounded square with star icon inside
  for (const item of COMBINED_ITEMS) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Background with gradient feel
    g.fillStyle(darken(item.color, 0.2), 1);
    g.fillRoundedRect(1, 1, SIZE - 2, SIZE - 2, 3);
    // Inner glow
    g.fillStyle(item.color, 0.6);
    g.fillRoundedRect(3, 3, SIZE - 6, SIZE - 6, 2);
    // Center jewel
    g.fillStyle(lighten(item.color, 0.3), 1);
    g.fillCircle(SIZE / 2, SIZE / 2, 3);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(SIZE / 2 - 1, SIZE / 2 - 1, 1.5);
    // Gold border (combined items are special)
    g.lineStyle(1.5, 0xffdd66, 0.9);
    g.strokeRoundedRect(1, 1, SIZE - 2, SIZE - 2, 3);
    g.generateTexture(`item_${item.id}`, SIZE, SIZE);
    g.destroy();
  }
}
