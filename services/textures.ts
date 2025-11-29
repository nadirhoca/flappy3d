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
    const { canvas, ctx } = createCanvas(128, 128); // Increased res for noise
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base Fill
    if (type === 'MOON') {
        ctx.fillStyle = '#4B5563'; // Gray
        ctx.fillRect(0, 0, 128, 128);
        
        // Add Noise (Dust/Craters)
        for(let i=0; i<400; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#374151' : '#6B7280';
            const size = Math.random() * 4 + 2;
            ctx.fillRect(Math.random()*128, Math.random()*128, size, size);
        }
        
        // Big Craters
        for(let i=0; i<5; i++) {
             ctx.fillStyle = '#1F2937';
             const size = Math.random() * 10 + 5;
             const x = Math.random()*110;
             const y = Math.random()*110;
             ctx.fillRect(x, y, size, size);
             ctx.fillStyle = '#374151'; // Inner
             ctx.fillRect(x+2, y+2, size-4, size-4);
        }

    } else if (type === 'EARTH') {
        ctx.fillStyle = '#65a30d'; // Grass Green
        ctx.fillRect(0, 0, 128, 128);

        // Grass Noise
        for(let i=0; i<600; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#4d7c0f' : '#84cc16';
            const w = 2;
            const h = Math.random() * 4 + 2;
            ctx.fillRect(Math.random()*128, Math.random()*128, w, h);
        }
        
        // Dirt Patches
        for(let i=0; i<3; i++) {
            ctx.fillStyle = '#78350f';
            const size = Math.random() * 12 + 4;
            ctx.fillRect(Math.random()*128, Math.random()*128, size, size/2);
        }

    } else { // JUPITER
        ctx.fillStyle = '#7f1d1d'; // Dark Red
        ctx.fillRect(0, 0, 128, 128);

        // Rocky/Banded Noise
        for(let i=0; i<128; i+=4) {
             // Bands
             if (Math.random() > 0.3) {
                 ctx.fillStyle = Math.random() > 0.5 ? '#991b1b' : '#450a0a';
                 ctx.fillRect(0, i, 128, 4);
             }
        }
        
        // Rocks
        for(let i=0; i<200; i++) {
            ctx.fillStyle = '#450a0a';
            const size = Math.random() * 4 + 2;
            ctx.fillRect(Math.random()*128, Math.random()*128, size, size);
        }
    }

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