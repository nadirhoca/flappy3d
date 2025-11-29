import * as THREE from 'three';

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'LEVEL_TRANSITION';

export type PlanetType = 'MOON' | 'EARTH' | 'JUPITER';

export interface PlanetConfig {
  id: PlanetType;
  name: string;
  icon: string;
  gravity: number;
  jumpStrength: number;
  gameSpeed: number;
  bgColor: number;
  fogColor: number;
  textColor: string;
  musicType: 'AMBIENT' | 'MELODIC' | 'INTENSE';
}

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  readableTime: string;
  uid?: string;
}

export interface GameStats {
  score: number;
  planet: PlanetType;
  multiplier: number;
}

export interface CelestialBody {
  mesh: THREE.Mesh | THREE.Group;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  type: 'EARTH' | 'MOON' | 'COMET' | 'SUN' | 'BIRD';
}