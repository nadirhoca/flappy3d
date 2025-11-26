
import React, { useState, useEffect, useCallback } from 'react';
import GameScene from './components/GameScene';
import { GameState, PlanetType, LeaderboardEntry } from './types';
import { PLANETS } from './constants';
import { initFirebase, getLeaderboard, submitScoreToDB } from './services/firebase';
import { audioManager } from './services/audio';

// Initialize firebase once
initFirebase();

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [planet, setPlanet] = useState<PlanetType>('MOON');
  const [multiplier, setMultiplier] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load Leaderboard
  const fetchLeaderboard = useCallback(async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  }, []);

  const handleStart = () => {
    setGameState('PLAYING');
    setScore(0);
    setPlanet('MOON');
    setMultiplier(1);
    
    // Start procedural music
    audioManager.resume();
    audioManager.startMusic();
  };

  const handleGameOver = (finalScore: number) => {
    setGameState('GAMEOVER');
    fetchLeaderboard();
  };

  const handleSubmitScore = async () => {
    if (!playerName || isSubmitting) return;
    setIsSubmitting(true);
    try {
        await submitScoreToDB(playerName, score);
        await fetchLeaderboard();
        setPlayerName(''); // Clear input after submit
    } catch(e) {
        alert("Failed to submit score");
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !isMuted;
    setIsMuted(newVal);
    audioManager.setMute(newVal);
  };

  const planetConfig = PLANETS[planet];

  // Helper for dynamic planet-based border colors
  const getBorderColor = () => {
      if(planet === 'EARTH') return 'border-blue-400 shadow-blue-500/50';
      if(planet === 'JUPITER') return 'border-red-500 shadow-red-500/50';
      return 'border-gray-300 shadow-white/30';
  }

  return (
    <div className="relative w-full h-screen overflow-hidden font-['Press_Start_2P']">
      
      {/* 3D Game Layer */}
      <GameScene 
        gameState={gameState} 
        onScoreUpdate={setScore} 
        onPlanetUpdate={(p, m) => { setPlanet(p); setMultiplier(m); }}
        onGameOver={handleGameOver}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
        
        {/* HUD */}
        <div className={`absolute top-5 left-5 text-white text-xs bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/20 flex items-center gap-2 shadow-lg transition-all duration-500`}>
           <span className="text-xl animate-bounce">{planetConfig.icon}</span>
           <span style={{ color: planetConfig.textColor }} className="drop-shadow-md">GRAVITY: {multiplier}x</span>
        </div>

        <button 
           onClick={toggleMute}
           className="absolute top-5 right-5 pointer-events-auto text-white text-xl hover:text-yellow-400 transition-colors drop-shadow-md"
        >
           {isMuted ? '🔇' : '🔊'}
        </button>

        <div className="absolute top-[10%] text-6xl text-white drop-shadow-[4px_4px_0_#000]">
            {score}
        </div>

        {/* Start Screen */}
        {gameState === 'START' && (
            <div className={`bg-black/60 backdrop-blur-md p-8 rounded-xl border-2 ${getBorderColor()} text-center pointer-events-auto max-w-sm w-full mx-4 shadow-2xl transition-all`}>
                <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 text-3xl mb-4 leading-relaxed drop-shadow-sm">GALACTIC<br/>FLAPPY</h1>
                <p className="text-gray-200 text-xs mb-8 leading-6">
                    Tap to Jump.<br/>
                    Survive different planets.<br/>
                    <span className="text-blue-300 mt-2 block opacity-80">(Headphones Recommended)</span>
                </p>
                <button 
                  onClick={handleStart}
                  className="animate-pulse bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all text-xs"
                >
                    INITIATE LAUNCH
                </button>
            </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
            <div className={`bg-gray-900/80 backdrop-blur-lg p-6 rounded-xl border-2 ${getBorderColor()} text-center pointer-events-auto max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-all`}>
                <h1 className="text-red-500 text-2xl mb-4 drop-shadow-md">MISSION FAILED</h1>
                
                <div className="text-yellow-400 text-xs mb-2">FINAL SCORE</div>
                <div className="text-white text-4xl mb-6 font-bold drop-shadow-lg">{score}</div>

                <div className="flex gap-2 mb-6 justify-center">
                    <input 
                      type="text" 
                      maxLength={5}
                      placeholder="PILOT"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                      className="bg-gray-800/80 border border-gray-500 text-white p-2 text-xs w-32 text-center uppercase focus:border-yellow-400 outline-none rounded"
                    />
                    <button 
                      onClick={handleSubmitScore}
                      disabled={isSubmitting || !playerName}
                      className="bg-yellow-600 border border-yellow-400 text-white text-xs px-4 py-2 hover:bg-yellow-500 disabled:bg-gray-700 disabled:border-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      {isSubmitting ? '...' : 'SAVE'}
                    </button>
                </div>

                <div className="bg-black/40 rounded-lg p-4 border border-white/10 w-full">
                    <h2 className="text-blue-300 text-xs mb-4 border-b border-white/10 pb-2">ELITE SQUADRON</h2>
                    {leaderboard.length === 0 ? (
                        <p className="text-gray-500 text-[10px]">Retrieving data...</p>
                    ) : (
                        <ul className="text-left space-y-2 h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {leaderboard.map((entry, idx) => (
                                <li key={idx} className="flex justify-between text-[10px] text-gray-300 border-b border-gray-800 pb-1 last:border-0">
                                    <div className="flex gap-2 items-center">
                                        <span className={`w-5 ${idx < 3 ? 'text-yellow-400' : 'text-gray-600'}`}>#{idx+1}</span>
                                        <span className="text-white truncate max-w-[100px]">{entry.name}</span>
                                    </div>
                                    <span className="text-yellow-500">{entry.score}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button 
                  onClick={() => setGameState('START')}
                  className="mt-6 text-green-400 text-xs hover:text-green-300 underline underline-offset-4 decoration-dotted"
                >
                    RETRY MISSION
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
