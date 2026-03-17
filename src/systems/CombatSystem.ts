import { GameScene } from '../scenes/GameScene';
import { Champion } from '../entities/Champion';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';

export class CombatSystem {
  private scene: GameScene;
  private projectiles: Projectile[] = [];

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  fireProjectile(champion: Champion, target: Enemy): void {
    const projectile = new Projectile(
      this.scene,
      champion.sprite.x,
      champion.sprite.y - 4,
      target,
      champion.damage,
      champion.synergyBonuses,
    );
    this.projectiles.push(projectile);

    // Multishot: fire extra projectiles at other nearby enemies
    if (champion.synergyBonuses.multishot > 0) {
      const extraTargets = this.findMultishotTargets(champion, target, champion.synergyBonuses.multishot);
      for (const extraTarget of extraTargets) {
        const extra = new Projectile(
          this.scene,
          champion.sprite.x,
          champion.sprite.y - 4,
          extraTarget,
          champion.damage,
          champion.synergyBonuses,
        );
        this.projectiles.push(extra);
      }
    }
  }

  /** Execute a champion's ultimate ability */
  castUltimate(champion: Champion): void {
    const ult = champion.ultimate;
    const cx = champion.sprite.x;
    const cy = champion.sprite.y;

    switch (ult.type) {
      case 'aoe_damage': {
        const radius = ult.radius ?? champion.range;
        const dmg = ult.damage ?? champion.damage * 3;
        this.showAoEEffect(cx, cy, radius, 0xff6600);
        for (const enemy of this.scene.enemies) {
          if (!enemy.isAlive()) continue;
          const pos = enemy.getPosition();
          if (this.dist(cx, cy, pos.x, pos.y) <= radius) {
            enemy.takeDamage(dmg);
          }
        }
        break;
      }

      case 'meteor': {
        const target = champion.target;
        if (!target || !target.isAlive()) break;
        const pos = target.getPosition();
        const radius = ult.radius ?? 60;
        const dmg = ult.damage ?? champion.damage * 5;
        this.showAoEEffect(pos.x, pos.y, radius, 0xff4400);
        for (const enemy of this.scene.enemies) {
          if (!enemy.isAlive()) continue;
          const ePos = enemy.getPosition();
          if (this.dist(pos.x, pos.y, ePos.x, ePos.y) <= radius) {
            enemy.takeDamage(dmg);
          }
        }
        break;
      }

      case 'freeze_all': {
        const radius = ult.radius ?? champion.range;
        const dur = ult.duration ?? 2.0;
        this.showAoEEffect(cx, cy, radius, 0x66ccff);
        for (const enemy of this.scene.enemies) {
          if (!enemy.isAlive()) continue;
          const pos = enemy.getPosition();
          if (this.dist(cx, cy, pos.x, pos.y) <= radius) {
            enemy.applySlow(0, dur); // 0 speed = frozen
          }
        }
        break;
      }

      case 'stun_aoe': {
        const radius = ult.radius ?? champion.range;
        const dur = ult.duration ?? 2.0;
        this.showAoEEffect(cx, cy, radius, 0xffff00);
        for (const enemy of this.scene.enemies) {
          if (!enemy.isAlive()) continue;
          const pos = enemy.getPosition();
          if (this.dist(cx, cy, pos.x, pos.y) <= radius) {
            enemy.applyStun(dur);
          }
        }
        break;
      }

      case 'poison_cloud': {
        const radius = ult.radius ?? champion.range;
        const dmg = ult.damage ?? 10;
        const dur = ult.duration ?? 4.0;
        this.showAoEEffect(cx, cy, radius, 0x44ff44);
        for (const enemy of this.scene.enemies) {
          if (!enemy.isAlive()) continue;
          const pos = enemy.getPosition();
          if (this.dist(cx, cy, pos.x, pos.y) <= radius) {
            enemy.applyDot(dmg, dur, 2);
          }
        }
        break;
      }

      case 'ally_boost': {
        const mult = ult.value ?? 0.4;
        const dur = ult.duration ?? 4.0;
        this.showAoEEffect(cx, cy, 80, 0x44ccff);
        for (const ally of this.scene.champions) {
          if (!ally.placed) continue;
          ally.applyAttackSpeedBuff(mult, dur);
        }
        break;
      }

      case 'chain_nova': {
        const chainCount = ult.value ?? 6;
        const dmg = ult.damage ?? champion.damage * 2;
        const chainRange = 100;
        const chainFrac = 0.85;

        // Find first target
        let currentTarget: Enemy | null = champion.target;
        if (!currentTarget || !currentTarget.isAlive()) break;

        currentTarget.takeDamage(dmg);
        const hit = new Set<Enemy>([currentTarget]);
        let currentDamage = dmg;

        for (let i = 0; i < chainCount; i++) {
          currentDamage = Math.round(currentDamage * chainFrac);
          if (currentDamage < 1) break;

          const currentPos = currentTarget!.getPosition();
          let bestEnemy: Enemy | null = null;
          let bestDist = Infinity;

          for (const enemy of this.scene.enemies) {
            if (!enemy.isAlive() || hit.has(enemy)) continue;
            const pos = enemy.getPosition();
            const d = this.dist(currentPos.x, currentPos.y, pos.x, pos.y);
            if (d <= chainRange && d < bestDist) {
              bestDist = d;
              bestEnemy = enemy;
            }
          }

          if (!bestEnemy) break;
          this.showChainEffect(currentTarget!.getPosition(), bestEnemy.getPosition());
          bestEnemy.takeDamage(currentDamage);
          hit.add(bestEnemy);
          currentTarget = bestEnemy;
        }
        break;
      }

      case 'snipe': {
        const target = champion.target;
        if (!target || !target.isAlive()) break;
        const dmg = ult.damage ?? champion.damage * 5;
        target.takeDamage(dmg);
        this.showSnipeEffect(cx, cy, target.getPosition());
        break;
      }

      case 'gold_rush': {
        const target = champion.target;
        if (!target || !target.isAlive()) break;
        const dmg = ult.damage ?? 500;
        const gold = ult.value ?? 3;
        target.takeDamage(dmg);
        if (!target.isAlive()) {
          this.scene.economyManager.addGold(gold);
          this.scene.events.emit('goldChanged', this.scene.economyManager.getGold());
          this.showGoldEffect(target.getPosition(), gold);
        }
        break;
      }

      case 'heal_wave': {
        const manaAmount = ult.value ?? 30;
        this.showAoEEffect(cx, cy, 80, 0x88ff88);
        for (const ally of this.scene.champions) {
          if (!ally.placed) continue;
          ally.addMana(manaAmount);
        }
        // If this ult also has a duration, also grant attack speed buff
        if (ult.duration) {
          for (const ally of this.scene.champions) {
            if (!ally.placed) continue;
            ally.applyAttackSpeedBuff(0.6, ult.duration);
          }
        }
        break;
      }
    }
  }

  private findMultishotTargets(champion: Champion, primary: Enemy, count: number): Enemy[] {
    const targets: Enemy[] = [];
    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive() || enemy === primary) continue;
      const pos = enemy.getPosition();
      const dx = pos.x - champion.sprite.x;
      const dy = pos.y - champion.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= champion.range) {
        targets.push(enemy);
        if (targets.length >= count) break;
      }
    }
    return targets;
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Visual effects for ultimates ────────────────────

  private showAoEEffect(x: number, y: number, radius: number, color: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.3);
    circle.setDepth(9998);
    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      onComplete: () => circle.destroy(),
    });
  }

  private showChainEffect(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const line = this.scene.add.graphics();
    line.lineStyle(3, 0x88ccff, 0.9);
    line.lineBetween(from.x, from.y, to.x, to.y);
    line.setDepth(9998);
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 300,
      onComplete: () => line.destroy(),
    });
  }

  private showSnipeEffect(fromX: number, fromY: number, to: { x: number; y: number }): void {
    const line = this.scene.add.graphics();
    line.lineStyle(3, 0xff4444, 1);
    line.lineBetween(fromX, fromY, to.x, to.y);
    line.setDepth(9998);
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 400,
      onComplete: () => line.destroy(),
    });
  }

  private showGoldEffect(pos: { x: number; y: number }, gold: number): void {
    const text = this.scene.add.text(pos.x + 8, pos.y - 5, `+${gold}g`, {
      fontSize: '12px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1).setDepth(10000);
    this.scene.tweens.add({
      targets: text,
      y: pos.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  update(delta: number): void {
    this.projectiles = this.projectiles.filter(p => p.update(delta));
  }

  clearProjectiles(): void {
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
  }
}
