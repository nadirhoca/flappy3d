
import * as THREE from 'three';

// Procedural 8-bit Texture Generator
// Creates CanvasTextures to simulate pixel art assets without external files

const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if(ctx) ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
};

// Helper to draw pixel arrays - unused for simple patterns but kept for reference
const drawPixels = (ctx: CanvasRenderingContext2D, pixels: string[], colorMap: Record<string, string>, offsetX: number, offsetY: number, scale: number) => {
    pixels.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            if (char !== ' ' && colorMap[char]) {
                ctx.fillStyle = colorMap[char];
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    });
};

export const createPipeTexture = (type: 'MOON' | 'EARTH' | 'JUPITER') => {
    const { canvas, ctx } = createCanvas(64, 64);
    if (!ctx) return new THREE.CanvasTexture(canvas);

    let baseColor, highlight, shadow, border;

    if (type === 'MOON') {
        baseColor = '#6B7280'; // Grey
        highlight = '#9CA3AF';
        shadow = '#374151';
        border = '#1F2937';
    } else if (type === 'EARTH') {
        baseColor = '#22c55e'; // Green
        highlight = '#4ade80';
        shadow = '#15803d';
        border = '#052e16';
    } else { // JUPITER
        baseColor = '#b91c1c'; // Red Industrial
        highlight = '#ef4444';
        shadow = '#7f1d1d';
        border = '#450a0a';
    }

    // Main Pipe Body
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 64, 64);

    // Highlights (Left side)
    ctx.fillStyle = highlight;
    ctx.fillRect(4, 0, 8, 64);
    ctx.fillRect(16, 0, 4, 64);

    // Shadows (Right side)
    ctx.fillStyle = shadow;
    ctx.fillRect(52, 0, 8, 64);
    
    // Borders (simulating brick/segments)
    ctx.fillStyle = border;
    ctx.fillRect(0, 0, 4, 64); // Left edge
    ctx.fillRect(60, 0, 4, 64); // Right edge
    
    // Horizontal segment lines
    if (type === 'MOON') {
        // Bricks
        ctx.fillStyle = border;
        ctx.fillRect(0, 30, 64, 4);
    } else if (type === 'JUPITER') {
        // Industrial rivets
        ctx.fillStyle = border;
        ctx.fillRect(4, 4, 4, 4);
        ctx.fillRect(56, 4, 4, 4);
        ctx.fillRect(4, 56, 4, 4);
        ctx.fillRect(56, 56, 4, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
};

export const createGroundTexture = (type: 'MOON' | 'EARTH' | 'JUPITER') => {
    const { canvas, ctx } = createCanvas(64, 64);
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Checkerboard pattern for retro feel
    const c1 = type === 'MOON' ? '#374151' : (type === 'EARTH' ? '#d97706' : '#450a0a');
    const c2 = type === 'MOON' ? '#4B5563' : (type === 'EARTH' ? '#b45309' : '#7f1d1d');

    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, 64, 64);
    
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

// --- New Textures for Backgrounds ---

export const createEarthTexture = () => {
    const { canvas, ctx } = createCanvas(64, 64);
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Ocean
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0,0,64,64);

    // Continents (blocky)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(10, 10, 20, 30);
    ctx.fillRect(40, 20, 15, 25);
    ctx.fillRect(30, 5, 10, 10);
    
    // Clouds
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 40, 15, 5);
    ctx.fillRect(35, 15, 10, 4);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
};

export const createMoonTexture = (colorHex: string) => {
    const { canvas, ctx } = createCanvas(32, 32);
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = colorHex;
    ctx.fillRect(0,0,32,32);
    
    // Craters
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(5,5,4,4);
    ctx.fillRect(20,15,6,6);
    ctx.fillRect(10,25,3,3);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
};
