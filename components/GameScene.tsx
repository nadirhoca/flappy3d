
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, PlanetType, CelestialBody } from '../types';
import { PLANETS, PIPE_GAP_MIN, PIPE_GAP_MAX, PIPE_SPAWN_RATE, BIRD_X, PIPES_PER_LEVEL } from '../constants';
import { audioManager } from '../services/audio';
import { 
    createPipeTexture, 
    createGroundTexture, 
    createEarthTexture, 
    createMoonTexture 
} from '../services/textures';

interface GameSceneProps {
  gameState: GameState;
  onScoreUpdate: (score: number) => void;
  onPlanetUpdate: (planet: PlanetType, multiplier: number) => void;
  onGameOver: (score: number) => void;
}

const GameScene: React.FC<GameSceneProps> = ({ gameState, onScoreUpdate, onPlanetUpdate, onGameOver }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game Loop Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Objects
  const birdGroupRef = useRef<THREE.Group | null>(null);
  const wingsRef = useRef<THREE.Group[]>([]); 
  
  const pipesRef = useRef<THREE.Group[]>([]);
  const cloudsRef = useRef<THREE.Group[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const celestialBodiesRef = useRef<CelestialBody[]>([]);
  
  // Textures Storage
  const texturesRef = useRef<{
    pipeMoon: THREE.Texture;
    pipeEarth: THREE.Texture;
    pipeJupiter: THREE.Texture;
    groundMoon: THREE.Texture;
    groundEarth: THREE.Texture;
    groundJupiter: THREE.Texture;
    bgEarth: THREE.Texture;
    bgMoonEuropa: THREE.Texture;
    bgMoonIo: THREE.Texture;
  } | null>(null);

  const frameIdRef = useRef<number>(0);
  const stateRef = useRef<GameState>('START');
  const scoreRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const multiplierRef = useRef<number>(1);
  const frameCountRef = useRef<number>(0);
  const currentPlanetRef = useRef<PlanetType>('MOON');

  // Refs for callbacks to prevent stale closures in animation loop
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onPlanetUpdateRef = useRef(onPlanetUpdate);
  const onGameOverRef = useRef(onGameOver);

  // Update refs when props change
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onPlanetUpdateRef.current = onPlanetUpdate;
    onGameOverRef.current = onGameOver;
  }, [onScoreUpdate, onPlanetUpdate, onGameOver]);

  // Sync prop state
  useEffect(() => {
    stateRef.current = gameState;
    if (gameState === 'START') {
        resetGame();
    } else if (gameState === 'PLAYING') {
        if (frameCountRef.current === 0) jump(); 
    }
  }, [gameState]);

  const jump = () => {
    const config = PLANETS[currentPlanetRef.current];
    velocityRef.current = config.jumpStrength;
    audioManager.playJump();
    spawnParticles();
  };

  const spawnParticles = () => {
    if (!birdGroupRef.current || !sceneRef.current) return;
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    
    for(let i=0; i<3; i++) {
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(birdGroupRef.current.position);
        p.position.x -= 0.4; 
        p.position.y -= 0.1;
        p.userData = { life: 1.0, driftY: (Math.random() - 0.5) * 0.1, driftX: -0.1, isParticle: true };
        sceneRef.current.add(p);
        particlesRef.current.push(p);
    }
  };

  const resetGame = () => {
    scoreRef.current = 0;
    velocityRef.current = 0;
    multiplierRef.current = 1;
    frameCountRef.current = 0;
    currentPlanetRef.current = 'MOON';

    if (birdGroupRef.current) {
        birdGroupRef.current.position.set(BIRD_X, 0, 0);
        birdGroupRef.current.rotation.set(0, 0, 0);
    }

    // Robust Cleanup
    if (sceneRef.current) {
        const toRemove: THREE.Object3D[] = [];
        sceneRef.current.traverse((obj) => {
            if (obj.userData.isPipe || obj.userData.isParticle || obj.userData.isCelestial) {
                toRemove.push(obj);
            }
        });
        toRemove.forEach(obj => sceneRef.current?.remove(obj));
    }
    
    pipesRef.current = [];
    particlesRef.current = [];
    celestialBodiesRef.current = []; // Clear old backgrounds

    updateVisuals('MOON');
    setupCelestialBodies('MOON');
    onScoreUpdateRef.current(0);
    onPlanetUpdateRef.current('MOON', 1);
  };

  const setupCelestialBodies = (planetId: PlanetType) => {
      if (!sceneRef.current || !texturesRef.current) return;

      // Clear existing bodies first
      celestialBodiesRef.current.forEach(b => sceneRef.current?.remove(b.mesh));
      celestialBodiesRef.current = [];

      if (planetId === 'MOON') {
          // Add Earth in background
          const geo = new THREE.SphereGeometry(4, 32, 32);
          const mat = new THREE.MeshStandardMaterial({ 
              map: texturesRef.current.bgEarth, 
              roughness: 0.8 
          });
          const earth = new THREE.Mesh(geo, mat);
          earth.position.set(10, 5, -30);
          earth.userData = { isCelestial: true };
          sceneRef.current.add(earth);
          
          celestialBodiesRef.current.push({
              mesh: earth,
              speedX: -0.005, // Slowly moves across sky
              speedY: 0.001,
              rotationSpeed: 0.002,
              type: 'EARTH'
          });
      }

      if (planetId === 'JUPITER') {
          // Add Moons (Io & Europa)
          const moons = [
              { tex: texturesRef.current.bgMoonIo, size: 1.5, pos: [5, 8, -20], speed: 0.02 },
              { tex: texturesRef.current.bgMoonEuropa, size: 1.2, pos: [-8, -5, -25], speed: 0.015 },
              { tex: texturesRef.current.bgMoonEuropa, size: 0.8, pos: [12, -8, -15], speed: 0.03 } // Callisto-ish
          ];

          moons.forEach((m, i) => {
              const geo = new THREE.SphereGeometry(m.size, 16, 16);
              const mat = new THREE.MeshStandardMaterial({ map: m.tex });
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.set(m.pos[0], m.pos[1], m.pos[2]);
              mesh.userData = { isCelestial: true };
              sceneRef.current?.add(mesh);
              
              celestialBodiesRef.current.push({
                  mesh: mesh,
                  speedX: m.speed * (i % 2 === 0 ? 1 : -1),
                  speedY: 0,
                  rotationSpeed: 0.01,
                  type: 'MOON'
              });
          });
      }
  };

  const spawnComet = () => {
      if (!sceneRef.current) return;
      // Chance to spawn comet on Moon or Jupiter
      if (Math.random() > 0.01) return; 

      const geo = new THREE.BoxGeometry(0.2, 0.2, 2); // Long tail
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(geo, mat);
      
      const startY = (Math.random() * 20) - 5;
      mesh.position.set(20, startY, -10 - Math.random() * 10);
      mesh.rotation.z = Math.PI / 4; // Angled
      mesh.userData = { isCelestial: true };
      
      sceneRef.current.add(mesh);
      celestialBodiesRef.current.push({
          mesh: mesh,
          speedX: -0.5, // Fast!
          speedY: -0.2,
          rotationSpeed: 0,
          type: 'COMET'
      });
  };

  const spawnBackgroundBird = () => {
      if (!sceneRef.current || Math.random() > 0.005) return;

      const group = new THREE.Group();
      // Simple V shape
      const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), mat);
      w1.rotation.z = 0.5;
      w1.position.x = -0.1;
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), mat);
      w2.rotation.z = -0.5;
      w2.position.x = 0.1;
      group.add(w1, w2);

      group.position.set(20, (Math.random() * 10), -5 - Math.random() * 5);
      group.userData = { isCelestial: true };
      sceneRef.current.add(group);

      celestialBodiesRef.current.push({
          mesh: group,
          speedX: -0.1 - Math.random() * 0.1,
          speedY: 0,
          rotationSpeed: 0,
          type: 'BIRD'
      });
  };

  const updateVisuals = (planetId: PlanetType) => {
    const config = PLANETS[planetId];
    if (!config || !sceneRef.current || !texturesRef.current) return;

    // Toggle Stars/Clouds
    if (starsRef.current) starsRef.current.visible = (planetId === 'MOON' || planetId === 'JUPITER');
    cloudsRef.current.forEach(c => c.visible = (planetId === 'EARTH'));
    
    // Update Ground
    if (groundRef.current) {
        const mat = groundRef.current.material as THREE.MeshStandardMaterial;
        if (planetId === 'MOON') mat.map = texturesRef.current.groundMoon;
        if (planetId === 'EARTH') mat.map = texturesRef.current.groundEarth;
        if (planetId === 'JUPITER') mat.map = texturesRef.current.groundJupiter;
        mat.needsUpdate = true;
    }

    audioManager.setMusicMode(config.musicType);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Generate Textures ---
    texturesRef.current = {
        pipeMoon: createPipeTexture('MOON'),
        pipeEarth: createPipeTexture('EARTH'),
        pipeJupiter: createPipeTexture('JUPITER'),
        groundMoon: createGroundTexture('MOON'),
        groundEarth: createGroundTexture('EARTH'),
        groundJupiter: createGroundTexture('JUPITER'),
        bgEarth: createEarthTexture(),
        bgMoonIo: createMoonTexture('#fcd34d'),
        bgMoonEuropa: createMoonTexture('#bfdbfe')
    };

    // --- Init Three.js ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(PLANETS.MOON.bgColor);
    scene.fog = new THREE.Fog(PLANETS.MOON.bgColor, 10, 50);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 0, 15);
    camera.lookAt(2, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // --- Objects ---
    create3DBird(scene);
    createGround(scene, texturesRef.current.groundMoon);
    createEnvironment(scene);

    setupCelestialBodies('MOON');

    // --- Event Listeners ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (window.innerWidth / window.innerHeight < 1) {
          camera.position.set(0, 0, 25);
      } else {
          camera.position.set(0, 0, 15);
      }
      camera.lookAt(2, 0, 0);
    };

    const handleInput = (e: Event) => {
        if (stateRef.current === 'PLAYING') {
            e.preventDefault();
            jump();
        }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleInput(e);
    });

    handleResize();

    // --- Animation Loop ---
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const planetConfig = PLANETS[currentPlanetRef.current];

      // Smooth Background Transition
      if (sceneRef.current) {
          const targetColor = new THREE.Color(planetConfig.bgColor);
          if (sceneRef.current.background instanceof THREE.Color) {
             sceneRef.current.background.lerp(targetColor, 0.05);
          }
          if (sceneRef.current.fog) {
              sceneRef.current.fog.color.lerp(targetColor, 0.05);
          }
      }

      // 3D Bird Animation (Flap Wings)
      if (wingsRef.current.length === 2 && birdGroupRef.current) {
          const wingSpeed = 0.3;
          let targetRot = 0;
          
          if (stateRef.current === 'PLAYING') {
              // Flap fast when going up, glide when going down
              const flapIntensity = velocityRef.current > 0 ? 0.8 : 0.2;
              targetRot = Math.sin(Date.now() * 0.02) * flapIntensity;
          } else {
              // Idle flap
              targetRot = Math.sin(Date.now() * 0.005) * 0.3;
          }
          
          // Apply rotation (Left wing z+, Right wing z-)
          wingsRef.current[0].rotation.z = targetRot;
          wingsRef.current[1].rotation.z = -targetRot;
      }

      // Background Celestial Bodies
      if (stateRef.current === 'PLAYING' || stateRef.current === 'START' || stateRef.current === 'LEVEL_TRANSITION') {
          // Spawn Comets/Birds logic
          if (currentPlanetRef.current === 'MOON' || currentPlanetRef.current === 'JUPITER') {
              spawnComet();
          }
          if (currentPlanetRef.current === 'EARTH') {
              spawnBackgroundBird();
          }

          // Move Bodies
          for (let i = celestialBodiesRef.current.length - 1; i >= 0; i--) {
              const body = celestialBodiesRef.current[i];
              
              // Move faster in transition (hyperdrive)
              const speedMult = stateRef.current === 'LEVEL_TRANSITION' ? 5 : 1;
              
              body.mesh.position.x += body.speedX * speedMult;
              body.mesh.position.y += body.speedY * speedMult;
              body.mesh.rotation.y += body.rotationSpeed;

              // Cleanup
              if ((body.type === 'COMET' || body.type === 'BIRD') && body.mesh.position.x < -30) {
                  sceneRef.current?.remove(body.mesh);
                  celestialBodiesRef.current.splice(i, 1);
              }
              // Loop Planets/Moons
              else if (body.type !== 'COMET' && body.type !== 'BIRD' && (body.mesh.position.x < -40 || body.mesh.position.x > 40)) {
                  if (body.mesh.position.x < -40) body.mesh.position.x = 40;
                  if (body.mesh.position.x > 40) body.mesh.position.x = -40;
              }
          }
          
          // Move Stars (Warp effect)
          if (starsRef.current) {
              const starSpeed = stateRef.current === 'LEVEL_TRANSITION' ? 0.5 : 0.02;
              starsRef.current.rotation.x += starSpeed * 0.1;
          }
      }

      if (stateRef.current === 'PLAYING') {
        frameCountRef.current++;
        
        // Physics
        velocityRef.current += planetConfig.gravity * 0.15;
        if (birdGroupRef.current) {
            birdGroupRef.current.position.y += velocityRef.current;
            
            // Rotation
            if (birdGroupRef.current.rotation.z > -0.8) {
                birdGroupRef.current.rotation.z -= 0.03;
            } else if (velocityRef.current > 0) {
                 birdGroupRef.current.rotation.z = 0.5;
            }
            
            if (birdGroupRef.current.position.y < -9 || birdGroupRef.current.position.y > 12) {
                triggerGameOver();
            }
        }

        // Pipe Spawning
        const currentSpawnRate = Math.floor(PIPE_SPAWN_RATE / (planetConfig.gameSpeed * 10));

        if (frameCountRef.current % currentSpawnRate === 0) {
            createPipe(scene, 20, currentPlanetRef.current);
        }

        // Pipe Movement
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
            const pipe = pipesRef.current[i];
            pipe.position.x -= planetConfig.gameSpeed;

            if (!pipe.userData.passed && pipe.position.x < BIRD_X) {
                pipe.userData.passed = true;
                scoreRef.current++;
                audioManager.playScore();
                onScoreUpdateRef.current(scoreRef.current);
                
                // Difficulty Logic
                const newLevel = Math.floor(scoreRef.current / PIPES_PER_LEVEL) + 1;
                multiplierRef.current = newLevel;
                
                let nextPlanet: PlanetType = 'MOON';
                if (scoreRef.current >= 20) nextPlanet = 'EARTH'; 
                if (scoreRef.current >= 40) nextPlanet = 'JUPITER'; 

                if (nextPlanet !== currentPlanetRef.current) {
                    currentPlanetRef.current = nextPlanet;
                    updateVisuals(nextPlanet);
                    setupCelestialBodies(nextPlanet);
                    
                    // Trigger Transition on App side
                    onPlanetUpdateRef.current(currentPlanetRef.current, multiplierRef.current); 
                } else {
                    // Just update multiplier UI
                    onPlanetUpdateRef.current(currentPlanetRef.current, multiplierRef.current);
                }
            }

            if (pipe.position.x < -15) {
                scene.remove(pipe);
                pipesRef.current.splice(i, 1);
            }

            // Collision
            if (birdGroupRef.current) {
                const birdBox = new THREE.Box3().setFromObject(birdGroupRef.current);
                birdBox.expandByScalar(-0.3); // Tolerance
                
                const topPipe = pipe.children[0];
                const bottomPipe = pipe.children[1];
                
                const boxTop = new THREE.Box3().setFromObject(topPipe);
                const boxBottom = new THREE.Box3().setFromObject(bottomPipe);
                
                if (birdBox.intersectsBox(boxTop) || birdBox.intersectsBox(boxBottom)) {
                    triggerGameOver();
                }
            }
        }

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.position.x += p.userData.driftX;
            p.position.y += p.userData.driftY;
            p.userData.life -= 0.05;
            p.scale.setScalar(p.userData.life);
            if (p.userData.life <= 0) {
                scene.remove(p);
                particlesRef.current.splice(i, 1);
            }
        }

        // Clouds
        if (currentPlanetRef.current === 'EARTH') {
             cloudsRef.current.forEach(c => {
                 c.position.x -= planetConfig.gameSpeed * 0.3;
                 if (c.position.x < -20) c.position.x = 20;
             });
        }

      } else {
          // Idle OR Transition
          if (birdGroupRef.current) {
              birdGroupRef.current.position.y = Math.sin(Date.now() * 0.004) * 0.5;
              birdGroupRef.current.rotation.z = 0;
          }
      }
      renderer.render(scene, camera);
    };

    const triggerGameOver = () => {
        stateRef.current = 'GAMEOVER';
        audioManager.playCrash();
        audioManager.stopMusic();
        onGameOverRef.current(scoreRef.current);
    };

    // --- Helper Creation Functions ---

    function create3DBird(s: THREE.Scene) {
        const group = new THREE.Group();
        
        // Materials (Cartoon Shadingish)
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 }); // Yellow
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const beakMat = new THREE.MeshLambertMaterial({ color: 0xf97316 }); // Orange

        // 1. Body (Main Box)
        const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1), bodyMat);
        body.castShadow = true;
        group.add(body);

        // 2. Eyes
        const eyeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const pupilGeo = new THREE.BoxGeometry(0.1, 0.1, 0.15);
        
        // Left Eye
        const eyeL = new THREE.Mesh(eyeGeo, whiteMat);
        eyeL.position.set(0.2, 0.2, 0.5);
        const pupL = new THREE.Mesh(pupilGeo, blackMat);
        pupL.position.set(0.3, 0.2, 0.55);
        
        // Right Eye
        const eyeR = new THREE.Mesh(eyeGeo, whiteMat);
        eyeR.position.set(0.2, 0.2, -0.5);
        const pupR = new THREE.Mesh(pupilGeo, blackMat);
        pupR.position.set(0.3, 0.2, -0.55);

        group.add(eyeL, pupL, eyeR, pupR);

        // 3. Beak
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), beakMat);
        beak.position.set(0.6, -0.1, 0);
        group.add(beak);

        // 4. Wings (Pivot Groups)
        const wingGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        
        // Left Wing Group (Pivot is 0,0,0 relative to parent, but we offset mesh)
        const wingLGroup = new THREE.Group();
        wingLGroup.position.set(-0.2, 0, 0.5);
        const wingL = new THREE.Mesh(wingGeo, whiteMat);
        wingL.position.set(0.3, 0, 0.2); // Offset from pivot
        wingLGroup.add(wingL);
        
        const wingRGroup = new THREE.Group();
        wingRGroup.position.set(-0.2, 0, -0.5);
        const wingR = new THREE.Mesh(wingGeo, whiteMat);
        wingR.position.set(0.3, 0, -0.2); // Offset from pivot
        wingRGroup.add(wingR);

        group.add(wingLGroup, wingRGroup);
        wingsRef.current = [wingLGroup, wingRGroup];

        group.position.set(BIRD_X, 0, 0);
        birdGroupRef.current = group;
        s.add(group);
    }

    function createPipe(s: THREE.Scene, xPos: number, planet: PlanetType) {
        // Variable gap size (between 4.5 and 7.5 units)
        const gap = Math.random() * (PIPE_GAP_MAX - PIPE_GAP_MIN) + PIPE_GAP_MIN;
        const spread = 6;
        const centerY = (Math.random() * spread) - (spread / 2);
        
        let tex = texturesRef.current?.pipeMoon;
        if(planet === 'EARTH') tex = texturesRef.current?.pipeEarth;
        if(planet === 'JUPITER') tex = texturesRef.current?.pipeJupiter;

        const mat = new THREE.MeshLambertMaterial({ map: tex });
        const geo = new THREE.BoxGeometry(2.5, 20, 2.5);

        const group = new THREE.Group();
        group.userData = { passed: false, isPipe: true };

        const topPipe = new THREE.Mesh(geo, mat);
        topPipe.position.y = centerY + gap / 2 + 10;
        topPipe.castShadow = true;
        topPipe.receiveShadow = true;

        const bottomPipe = new THREE.Mesh(geo, mat);
        bottomPipe.position.y = centerY - gap / 2 - 10;
        bottomPipe.castShadow = true;
        bottomPipe.receiveShadow = true;

        group.add(topPipe);
        group.add(bottomPipe);
        group.position.set(xPos, 0, 0);

        s.add(group);
        pipesRef.current.push(group);
    }

    function createGround(s: THREE.Scene, tex: THREE.Texture) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 10);
        
        const geo = new THREE.PlaneGeometry(100, 100);
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -11;
        mesh.receiveShadow = true;
        groundRef.current = mesh;
        s.add(mesh);
    }

    function createEnvironment(s: THREE.Scene) {
         // Stars
         const starGeo = new THREE.BufferGeometry();
         const starPos = [];
         for(let i=0; i<400; i++) {
             starPos.push((Math.random() - 0.5) * 100);
             starPos.push((Math.random() - 0.5) * 60 + 20);
             starPos.push((Math.random() - 0.5) * 50 - 20);
         }
         starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
         const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.4, sizeAttenuation: true});
         const stars = new THREE.Points(starGeo, starMat);
         s.add(stars);
         starsRef.current = stars;

         // Clouds
         for(let i=0; i<6; i++) {
             const cGroup = new THREE.Group();
             const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
             const cGeo = new THREE.BoxGeometry(1, 1, 1);
             for(let j=0; j<5; j++) {
                 const part = new THREE.Mesh(cGeo, cMat);
                 part.position.set(Math.random()*2, Math.random(), Math.random());
                 cGroup.add(part);
             }
             cGroup.position.set((Math.random() * 40) - 10, (Math.random() * 10) + 5, -10 - Math.random() * 10);
             cGroup.scale.setScalar(2 + Math.random());
             cGroup.visible = false;
             s.add(cGroup);
             cloudsRef.current.push(cGroup);
         }
    }

    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousedown', handleInput);
        window.removeEventListener('touchstart', handleInput);
        window.removeEventListener('keydown', handleInput as any);
        cancelAnimationFrame(frameIdRef.current);
        if (containerRef.current && rendererRef.current) {
            containerRef.current.removeChild(rendererRef.current.domElement);
        }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};

export default GameScene;
