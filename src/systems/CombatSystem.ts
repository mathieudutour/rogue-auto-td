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
