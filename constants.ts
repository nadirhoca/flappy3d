import { PlanetConfig } from './types';

export const PIPE_SPAWN_RATE = 120; // Increased spacing slightly
export const PIPE_GAP = 6.0; // Slightly wider gap for fair play
export const BIRD_X = -3;
export const PIPES_PER_LEVEL = 5; // Score needed to increase multiplier

// Planet Physics Profiles
// Updated to be generally slower and more controllable
export const PLANETS: Record<string, PlanetConfig> = {
  MOON: {
    id: 'MOON',
    name: 'MOON',
    icon: '🌑',
    gravity: -0.045,       // Extremely floaty
    jumpStrength: 0.11,    // Gentle tap
    gameSpeed: 0.08,       // Slow, relaxing pace
    bgColor: 0x050505,
    fogColor: 0x050505,
    textColor: '#ffffff',
    musicType: 'AMBIENT'
  },
  EARTH: {
    id: 'EARTH',
    name: 'EARTH',
    icon: '🌍',
    gravity: -0.08,        // Standard gravity
    jumpStrength: 0.16,    // Standard tap
    gameSpeed: 0.12,       // Moderate pace (reduced from 0.16)
    bgColor: 0x60a5fa,     // Lighter blue
    fogColor: 0x60a5fa,
    textColor: '#1e3a8a',
    musicType: 'MELODIC'
  },
  JUPITER: {
    id: 'JUPITER',
    name: 'JUPITER',
    icon: '🪐',
    gravity: -0.18,        // Heavy gravity
    jumpStrength: 0.28,    // Snappy tap
    gameSpeed: 0.16,       // Fast, but not impossible (reduced from 0.28)
    bgColor: 0x4a0404,     // Deep Red
    fogColor: 0x4a0404,
    textColor: '#fcd34d',
    musicType: 'INTENSE'
  }
};