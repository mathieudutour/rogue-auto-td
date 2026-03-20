# AI Sprite Generation Guide

Drop generated PNGs into `public/assets/` and they'll automatically replace the procedural textures on next load. **No code changes needed.**

Use **transparent PNG** for all sprites. All sizes are in pixels.

---

## Style Guide (paste this as a prefix to every prompt)

> **Style prefix:** "Top-down pixel art sprite for an isometric tower defense game. Dark fantasy aesthetic with vibrant elemental colors. Transparent background. Clean edges, no anti-aliasing blur. Suitable for small display sizes."

---

## 1. CHAMPIONS (32x32 px) — `public/assets/champions/`

These are the player's units. Each is a small humanoid character defined by an **element** (color palette) and a **class** (weapon/silhouette).

### Element Color Palettes
| Element | Primary | Accent | Mood |
|---------|---------|--------|------|
| Fire | Red-orange #ff4444 | Yellow-gold | Aggressive, burning |
| Ice | Light blue #44aaff | White-cyan | Cold, crystalline |
| Nature | Green #44ff44 | Brown-gold | Organic, leafy |
| Arcane | Orange-gold #ffaa22 | Purple sparks | Mystical, runic |
| Shadow | Purple #9944ff | Dark violet | Stealthy, smoky |
| Lightning | Yellow #ffee44 | White-blue sparks | Electric, crackling |
| Void | Magenta #cc44cc | Dark purple-black | Otherworldly, warped |

### Class Silhouettes
| Class | Weapon | Build | Key Feature |
|-------|--------|-------|-------------|
| Warrior | Sword + shield or greatsword | Stocky, armored | Heavy plate armor |
| Ranger | Bow or crossbow | Lean, hooded | Quiver on back |
| Mage | Staff with glowing orb | Robed, tall hat | Floating magic particles |
| Assassin | Dual daggers | Slim, crouched | Face mask, cloak |
| Guardian | Tower shield + mace | Wide, bulky | Massive shield |

### All 42 Champion Files

**Cost 1 (common, simpler designs):**
```
fire_warrior.png — "A small red-armored warrior with a flaming sword, fire element. Simple design."
ice_ranger.png — "An ice-blue hooded archer with a frost bow, quiver of ice arrows."
nature_warrior.png — "A green-armored warrior with a wooden sword wrapped in vines."
arcane_guardian.png — "A golden-armored guardian with a glowing runic shield."
shadow_ranger.png — "A dark purple hooded ranger with a shadowy bow, wisps of darkness."
lightning_warrior.png — "A yellow-armored warrior with an electrified sword, sparks flying."
void_assassin.png — "A magenta cloaked assassin with dual void daggers, warped aura."
lightning_ranger.png — "A yellow hooded ranger with an electric crossbow, lightning bolts."
```

**Cost 2 (uncommon, slightly more detail):**
```
fire_mage.png — "A red-robed mage with a staff topped by a fireball, embers floating."
ice_mage.png — "A blue-robed mage with an ice crystal staff, frost particles."
nature_ranger.png — "A green hooded ranger with a living wood bow, leaves around."
arcane_mage.png — "A gold-robed mage with a staff of swirling arcane energy."
fire_guardian.png — "A red-armored guardian with a molten shield, lava cracks."
shadow_warrior.png — "A dark purple armored warrior with a shadow blade, smoky trail."
void_mage.png — "A magenta-robed mage with a void orb staff, reality distortion."
lightning_assassin.png — "A yellow cloaked assassin with electrified daggers, spark trail."
```

**Cost 3 (rare, more ornate):**
```
shadow_assassin.png — "An ornate dark purple assassin with twin shadow blades, smoke cloak."
shadow_mage.png — "A dark violet mage with a staff of pure darkness, shadow runes."
arcane_warrior.png — "A golden-armored warrior with a runic greatsword, glowing symbols."
nature_guardian.png — "A green bark-armored guardian with a massive living wood shield."
ice_assassin.png — "A frost-blue assassin with ice crystal daggers, frozen breath."
fire_ranger.png — "A red hooded ranger with a burning bow, fire arrows nocked."
nature_mage.png — "A green-robed druid with a staff of blooming flowers, nature magic."
lightning_guardian.png — "A yellow-armored guardian with a crackling thunder shield."
void_ranger.png — "A magenta hooded ranger with a void-warped bow, reality tears."
```

**Cost 4 (epic, detailed + glow effects):**
```
fire_assassin.png — "An elite fire assassin with blazing twin swords, flame wreath."
ice_warrior.png — "An elite ice warrior in crystalline armor, frozen greatsword."
nature_assassin.png — "An elite nature assassin with thorn daggers, poison vines."
arcane_ranger.png — "An elite arcane ranger with a golden energy bow, rune arrows."
shadow_guardian.png — "An elite shadow guardian with a void shield, dark energy barrier."
lightning_warrior_4.png — "An elite lightning warrior with a thunder greatsword, storm aura."
arcane_assassin.png — "An elite arcane assassin with golden runic daggers, magic trails."
void_warrior.png — "An elite void warrior in warped armor, reality-bending sword."
```

**Cost 5 (legendary, maximum detail + aura):**
```
fire_legendary.png — "A legendary fire guardian wreathed in flames, phoenix wings, molten shield. Glowing aura."
shadow_legendary.png — "A legendary shadow assassin, living darkness, twin abyssal blades. Death incarnate."
ice_legendary.png — "A legendary ice mage, blizzard swirling around, diamond ice staff. Frozen crown."
nature_legendary.png — "A legendary nature guardian, ancient treant armor, world-tree shield. Root tendrils."
lightning_legendary.png — "A legendary lightning mage, storm personified, thunder staff crackling. Lightning crown."
void_legendary.png — "A legendary void ranger, reality shattered around them, cosmic bow. Starfield cloak."
ice_guardian.png — "A legendary ice guardian in glacier armor, massive frost shield. Absolute zero aura."
arcane_legendary.png — "A legendary arcane warrior, golden runic fullplate, galaxy sword. Constellation aura."
```

**Default placeholder:**
```
default.png — "A grey silhouette of a generic warrior, placeholder style."
```

---

## 2. ENEMIES (28x28 px) — `public/assets/enemies/`

```
basic.png — "A small red goblin creature, hunched, yellow eyes, crude club. Basic enemy."
fast.png — "An orange wolf, low to the ground, sleek body, red eyes, running pose."
tank.png — "A large purple ogre, wide bulky body, small red eyes, belt, armored."
boss.png — "A dark red dragon, wings spread, golden horns, orange glowing eyes. Boss enemy."
```

---

## 3. TILES (64x32 px, isometric diamond) — `public/assets/tiles/`

All tiles must be **isometric diamond shaped** (2:1 ratio, diamond fills the 64x32 canvas).

```
placeable_0.png through placeable_3.png — "Isometric grass tile, lush green with subtle variation. Diamond shape, dark fantasy style." (4 variants with slightly different grass patterns)

path_0.png through path_3.png — "Isometric dirt/cobblestone path tile, brown-tan with worn stones. Diamond shape." (4 variants)

blocked_0.png through blocked_3.png — "Isometric dark stone/rock tile, grey cracked surface, impassable look. Diamond shape." (4 variants)

hover.png — "Isometric diamond outline, yellow semi-transparent highlight overlay."
selected.png — "Isometric diamond outline, cyan semi-transparent selection overlay."
drag_valid.png — "Isometric diamond outline, green semi-transparent valid placement overlay."
drag_invalid.png — "Isometric diamond outline, red semi-transparent invalid placement overlay."
```

---

## 4. PROJECTILES — `public/assets/projectiles/`

```
normal.png (10x10) — "A small yellow-white glowing energy ball, soft glow."
splash.png (12x12) — "A small orange fireball with trailing flames."
slow.png (10x10) — "A small blue ice crystal shard, cold glow."
chain.png (10x10) — "A small blue-white electric spark, lightning bolt."
dot.png (10x10) — "A small green poison droplet, toxic glow."
range_indicator.png (128x128) — "A subtle white semi-transparent circle, range indicator."
```

---

## 5. LANDMARKS — `public/assets/landmarks/`

```
portal.png (40x48) — "A dark purple magical portal, swirling energy vortex, oval shaped. Enemy spawn point. Ominous violet and magenta energy."
shard.png (32x48) — "A glowing blue crystal shard, tall pointed gem floating above ground, cyan glow underneath. Magical defense objective."
```

---

## 6. UI ICONS — `public/assets/ui/`

```
star_icon.png (16x16) — "A small golden star icon, bright, game UI style."
gold_icon.png (16x16) — "A small golden coin icon, shiny, game UI style."
```

---

## 7. ITEMS (20x20 px) — `public/assets/items/`

### Base Components (8)
```
bf_sword.png — "A small red sword icon, pixel art item."
recurve_bow.png — "A small green bow icon, pixel art item."
chain_vest.png — "A small grey chain mail vest icon, pixel art item."
negatron_cloak.png — "A small purple magic cloak icon, pixel art item."
needlessly_rod.png — "A small blue magic rod icon, pixel art item."
tear.png — "A small blue teardrop gem icon, pixel art item."
giants_belt.png — "A small brown leather belt icon, pixel art item."
sparring_gloves.png — "A small red boxing gloves icon, pixel art item."
```

### Combined Items (36)
```
infinity_edge.png — "A glowing golden sword, critical strike weapon, pixel art."
bloodthirster.png — "A dark red vampiric blade, lifesteal weapon, pixel art."
giant_slayer.png — "A massive silver greatsword, giant-killer, pixel art."
deathblade.png — "A menacing black blade with red glow, pixel art."
hextech_gunblade.png — "A hybrid sword-gun, blue hextech energy, pixel art."
zeals_edge.png — "A swift shimmering blade, speed enchanted, pixel art."
shojin.png — "A golden spear, mana weapon, pixel art."
titans_resolve.png — "A glowing red-gold gauntlet, power item, pixel art."
rapid_firecannon.png — "A golden cannon/crossbow, rapid fire, pixel art."
runaans_hurricane.png — "A green wind bow, multi-shot, pixel art."
guinsoos_rageblade.png — "A purple-red curved blade, rage enchanted, pixel art."
statikk_shiv.png — "A lightning-charged dagger, electric sparks, pixel art."
titans_bow.png — "A massive golden bow, titan-sized, pixel art."
bramble_vest.png — "A thorny green-grey vest, reflect damage, pixel art."
frozen_heart.png — "A blue ice-encased heart, frost aura, pixel art."
gargoyle_stoneplate.png — "A grey stone shield, gargoyle face, pixel art."
protectors_vow.png — "A golden shield with holy symbol, protection, pixel art."
edge_of_night.png — "A dark purple blade, shadow magic, pixel art."
quicksilver.png — "A silver mercury-like flowing sash, cleanse item, pixel art."
chalice_of_power.png — "A blue glowing chalice, magic power, pixel art."
zephyr.png — "A swirling wind token, tornado, pixel art."
steadfast_heart.png — "A red crystal heart, defensive, pixel art."
rabadons_deathcap.png — "A large purple wizard hat, magic amplifier, pixel art."
ionic_spark.png — "A blue-white lightning rod, electric damage, pixel art."
morellos.png — "A burning red tome, grievous wounds, pixel art."
archangels_staff.png — "A blue angelic winged staff, mana scaling, pixel art."
blue_buff.png — "A glowing blue crystal buff, mana regen, pixel art."
redemption.png — "A golden holy cross/staff, healing, pixel art."
warmogs.png — "A large red health gem/heart, max health, pixel art."
zekes_herald.png — "A golden banner/flag, ally buff, pixel art."
sunfire_cape.png — "A flaming orange cape/cloak, burn aura, pixel art."
guardbreaker.png — "A spiked black mace, armor penetration, pixel art."
jeweled_gauntlet.png — "A golden gauntlet with gems, spell crit, pixel art."
thiefs_gloves.png — "Red gloves with sparkles, random items, pixel art."
hand_of_justice.png — "A golden balanced scale, justice, pixel art."
last_whisper.png — "A sleek silver arrow, armor piercing, pixel art."
```

---

## Tips for Best Results

1. **Batch by category** — Generate all champions of one element together for consistent style
2. **Specify transparent background** in every prompt
3. **Downscale from larger** — Generate at 128x128 or 256x256 then downscale to target size for better detail
4. **Check diamond alignment** — Tile sprites must perfectly fill the isometric diamond shape
5. **Test incrementally** — Drop in a few PNGs, refresh the game, verify they look right before doing all of them
6. **Consistent lighting** — All sprites should be lit from the upper-left to match the isometric perspective
