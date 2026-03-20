/**
 * Asset manifest: maps texture keys to PNG file paths.
 * If a PNG exists in public/assets/, it will be loaded instead of the procedural texture.
 * Missing files gracefully fall back to procedural generation.
 */

export interface AssetEntry {
  key: string;
  path: string;
  /** Expected width for reference / sprite sheet frame width */
  width: number;
  /** Expected height */
  height: number;
}

// ── Tiles ────────────────────────────────────────────────────
const TILE_ASSETS: AssetEntry[] = [];
for (let v = 0; v < 4; v++) {
  TILE_ASSETS.push({ key: `tile_placeable_${v}`, path: `assets/tiles/placeable_${v}.png`, width: 64, height: 32 });
  TILE_ASSETS.push({ key: `tile_path_${v}`, path: `assets/tiles/path_${v}.png`, width: 64, height: 32 });
  TILE_ASSETS.push({ key: `tile_blocked_${v}`, path: `assets/tiles/blocked_${v}.png`, width: 64, height: 32 });
}
TILE_ASSETS.push(
  { key: 'tile_hover', path: 'assets/tiles/hover.png', width: 64, height: 32 },
  { key: 'tile_selected', path: 'assets/tiles/selected.png', width: 64, height: 32 },
  { key: 'tile_drag_valid', path: 'assets/tiles/drag_valid.png', width: 64, height: 32 },
  { key: 'tile_drag_invalid', path: 'assets/tiles/drag_invalid.png', width: 64, height: 32 },
);

// ── Champions ────────────────────────────────────────────────
const CHAMPION_ASSETS: AssetEntry[] = [
  // Cost 1
  { key: 'champion_fire_warrior', path: 'assets/champions/fire_warrior.png', width: 32, height: 32 },
  { key: 'champion_ice_ranger', path: 'assets/champions/ice_ranger.png', width: 32, height: 32 },
  { key: 'champion_nature_warrior', path: 'assets/champions/nature_warrior.png', width: 32, height: 32 },
  { key: 'champion_arcane_guardian', path: 'assets/champions/arcane_guardian.png', width: 32, height: 32 },
  { key: 'champion_shadow_ranger', path: 'assets/champions/shadow_ranger.png', width: 32, height: 32 },
  { key: 'champion_lightning_warrior', path: 'assets/champions/lightning_warrior.png', width: 32, height: 32 },
  { key: 'champion_void_assassin', path: 'assets/champions/void_assassin.png', width: 32, height: 32 },
  { key: 'champion_lightning_ranger', path: 'assets/champions/lightning_ranger.png', width: 32, height: 32 },
  // Cost 2
  { key: 'champion_fire_mage', path: 'assets/champions/fire_mage.png', width: 32, height: 32 },
  { key: 'champion_ice_mage', path: 'assets/champions/ice_mage.png', width: 32, height: 32 },
  { key: 'champion_nature_ranger', path: 'assets/champions/nature_ranger.png', width: 32, height: 32 },
  { key: 'champion_arcane_mage', path: 'assets/champions/arcane_mage.png', width: 32, height: 32 },
  { key: 'champion_fire_guardian', path: 'assets/champions/fire_guardian.png', width: 32, height: 32 },
  { key: 'champion_shadow_warrior', path: 'assets/champions/shadow_warrior.png', width: 32, height: 32 },
  { key: 'champion_void_mage', path: 'assets/champions/void_mage.png', width: 32, height: 32 },
  { key: 'champion_lightning_assassin', path: 'assets/champions/lightning_assassin.png', width: 32, height: 32 },
  // Cost 3
  { key: 'champion_shadow_assassin', path: 'assets/champions/shadow_assassin.png', width: 32, height: 32 },
  { key: 'champion_shadow_mage', path: 'assets/champions/shadow_mage.png', width: 32, height: 32 },
  { key: 'champion_arcane_warrior', path: 'assets/champions/arcane_warrior.png', width: 32, height: 32 },
  { key: 'champion_nature_guardian', path: 'assets/champions/nature_guardian.png', width: 32, height: 32 },
  { key: 'champion_ice_assassin', path: 'assets/champions/ice_assassin.png', width: 32, height: 32 },
  { key: 'champion_fire_ranger', path: 'assets/champions/fire_ranger.png', width: 32, height: 32 },
  { key: 'champion_nature_mage', path: 'assets/champions/nature_mage.png', width: 32, height: 32 },
  { key: 'champion_lightning_guardian', path: 'assets/champions/lightning_guardian.png', width: 32, height: 32 },
  { key: 'champion_void_ranger', path: 'assets/champions/void_ranger.png', width: 32, height: 32 },
  // Cost 4
  { key: 'champion_fire_assassin', path: 'assets/champions/fire_assassin.png', width: 32, height: 32 },
  { key: 'champion_ice_warrior', path: 'assets/champions/ice_warrior.png', width: 32, height: 32 },
  { key: 'champion_nature_assassin', path: 'assets/champions/nature_assassin.png', width: 32, height: 32 },
  { key: 'champion_arcane_ranger', path: 'assets/champions/arcane_ranger.png', width: 32, height: 32 },
  { key: 'champion_shadow_guardian', path: 'assets/champions/shadow_guardian.png', width: 32, height: 32 },
  { key: 'champion_lightning_warrior_4', path: 'assets/champions/lightning_warrior_4.png', width: 32, height: 32 },
  { key: 'champion_arcane_assassin', path: 'assets/champions/arcane_assassin.png', width: 32, height: 32 },
  { key: 'champion_void_warrior', path: 'assets/champions/void_warrior.png', width: 32, height: 32 },
  // Cost 5
  { key: 'champion_fire_legendary', path: 'assets/champions/fire_legendary.png', width: 32, height: 32 },
  { key: 'champion_shadow_legendary', path: 'assets/champions/shadow_legendary.png', width: 32, height: 32 },
  { key: 'champion_ice_legendary', path: 'assets/champions/ice_legendary.png', width: 32, height: 32 },
  { key: 'champion_nature_legendary', path: 'assets/champions/nature_legendary.png', width: 32, height: 32 },
  { key: 'champion_lightning_legendary', path: 'assets/champions/lightning_legendary.png', width: 32, height: 32 },
  { key: 'champion_void_legendary', path: 'assets/champions/void_legendary.png', width: 32, height: 32 },
  { key: 'champion_ice_guardian', path: 'assets/champions/ice_guardian.png', width: 32, height: 32 },
  { key: 'champion_arcane_legendary', path: 'assets/champions/arcane_legendary.png', width: 32, height: 32 },
  // Default
  { key: 'champion_default', path: 'assets/champions/default.png', width: 32, height: 32 },
];

// ── Enemies ──────────────────────────────────────────────────
const ENEMY_ASSETS: AssetEntry[] = [
  { key: 'enemy_basic', path: 'assets/enemies/basic.png', width: 28, height: 28 },
  { key: 'enemy_fast', path: 'assets/enemies/fast.png', width: 28, height: 28 },
  { key: 'enemy_tank', path: 'assets/enemies/tank.png', width: 28, height: 28 },
  { key: 'enemy_boss', path: 'assets/enemies/boss.png', width: 28, height: 28 },
];

// ── Projectiles ──────────────────────────────────────────────
const PROJECTILE_ASSETS: AssetEntry[] = [
  { key: 'projectile', path: 'assets/projectiles/normal.png', width: 10, height: 10 },
  { key: 'projectile_splash', path: 'assets/projectiles/splash.png', width: 12, height: 12 },
  { key: 'projectile_slow', path: 'assets/projectiles/slow.png', width: 10, height: 10 },
  { key: 'projectile_chain', path: 'assets/projectiles/chain.png', width: 10, height: 10 },
  { key: 'projectile_dot', path: 'assets/projectiles/dot.png', width: 10, height: 10 },
  { key: 'range_indicator', path: 'assets/projectiles/range_indicator.png', width: 128, height: 128 },
];

// ── Landmarks ────────────────────────────────────────────────
const LANDMARK_ASSETS: AssetEntry[] = [
  { key: 'portal', path: 'assets/landmarks/portal.png', width: 40, height: 48 },
  { key: 'shard', path: 'assets/landmarks/shard.png', width: 32, height: 48 },
];

// ── UI ───────────────────────────────────────────────────────
const UI_ASSETS: AssetEntry[] = [
  { key: 'star_icon', path: 'assets/ui/star_icon.png', width: 16, height: 16 },
  { key: 'gold_icon', path: 'assets/ui/gold_icon.png', width: 16, height: 16 },
];

// ── Items (generated dynamically from data) ──────────────────
// Components and combined items use key pattern `item_${id}`
// File path: assets/items/${id}.png at 20x20

/** All assets that can be loaded from PNG files */
export const ASSET_MANIFEST: AssetEntry[] = [
  ...TILE_ASSETS,
  ...CHAMPION_ASSETS,
  ...ENEMY_ASSETS,
  ...PROJECTILE_ASSETS,
  ...LANDMARK_ASSETS,
  ...UI_ASSETS,
];

/** Get the item asset entries (separate since they depend on runtime data) */
export function getItemAssetEntries(componentIds: string[], combinedIds: string[]): AssetEntry[] {
  const entries: AssetEntry[] = [];
  for (const id of componentIds) {
    entries.push({ key: `item_${id}`, path: `assets/items/${id}.png`, width: 20, height: 20 });
  }
  for (const id of combinedIds) {
    entries.push({ key: `item_${id}`, path: `assets/items/${id}.png`, width: 20, height: 20 });
  }
  return entries;
}
