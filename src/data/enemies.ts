export interface EnemyData {
  id: string;
  name: string;
  textureKey: string;
  health: number;
  speed: number;       // pixels per second along path
  damage: number;      // damage to lives when reaching end
  goldReward: number;
}

export const ENEMY_TYPES: Record<string, EnemyData> = {
  basic: {
    id: 'basic',
    name: 'Goblin',
    textureKey: 'enemy_basic',
    health: 50,
    speed: 40,
    damage: 1,
    goldReward: 1,
  },
  fast: {
    id: 'fast',
    name: 'Wolf',
    textureKey: 'enemy_fast',
    health: 30,
    speed: 70,
    damage: 1,
    goldReward: 1,
  },
  tank: {
    id: 'tank',
    name: 'Ogre',
    textureKey: 'enemy_tank',
    health: 150,
    speed: 25,
    damage: 2,
    goldReward: 2,
  },
  boss: {
    id: 'boss',
    name: 'Dragon',
    textureKey: 'enemy_boss',
    health: 500,
    speed: 20,
    damage: 5,
    goldReward: 5,
  },
};
