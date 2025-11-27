import { PlanetConfig } from './types';

export const PIPE_SPAWN_RATE = 120; 
export const PIPE_GAP_MIN = 4.5; // Minimum ~5.5 bird heights (tight squeeze)
export const PIPE_GAP_MAX = 7.5; // Wide gap (easier)
export const BIRD_X = -3;
export const PIPES_PER_LEVEL = 5; 

// Planet Physics Profiles
export const PLANETS: Record<string, PlanetConfig> = {
  MOON: {
    id: 'MOON',
    name: 'MOON',
    icon: '🌑',
    gravity: -0.045,       
    jumpStrength: 0.11,    
    gameSpeed: 0.08,       
    bgColor: 0x050505,
    fogColor: 0x050505,
    textColor: '#ffffff',
    musicType: 'AMBIENT'
  },
  EARTH: {
    id: 'EARTH',
    name: 'EARTH',
    icon: '🌍',
    gravity: -0.08,        
    jumpStrength: 0.16,    
    gameSpeed: 0.12,       
    bgColor: 0x60a5fa,     
    fogColor: 0x60a5fa,
    textColor: '#1e3a8a',
    musicType: 'MELODIC'
  },
  JUPITER: {
    id: 'JUPITER',
    name: 'JUPITER',
    icon: '🪐',
    gravity: -0.18,        
    jumpStrength: 0.28,    
    gameSpeed: 0.16,       
    bgColor: 0x4a0404,     
    fogColor: 0x4a0404,
    textColor: '#fcd34d',
    musicType: 'INTENSE'
  }
};