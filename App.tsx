import React, { useState, useEffect, useRef } from 'react';
import { AudioEngine } from './services/audioEngine';
import { useVehiclePhysics } from './hooks/useVehiclePhysics';
import { ENGINES } from './constants';
import { EngineProfile, PhysicsState, InputState } from './types';
import { Gauge } from './components/Gauge';
import { Controls } from './components/Controls';
import { Telemetry } from './components/Telemetry';
import { GForce } from './components/GForce';

const audioEngine = new AudioEngine();

const App: React.FC = () => {
  const [active, setActive] = useState(false);
  const [engineProfile, setEngineProfile] = useState<EngineProfile>(ENGINES[1]);
  
  const rpmNeedleRef = useRef<HTMLDivElement>(null);
  const speedNeedleRef = useRef<HTMLDivElement>(null);
  const boostNeedleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [uiState, setUiState] = useState<PhysicsState>({
      rpm: 0, speed: 0, gear: 1, throttleInput: 0, brakeInput: 0, 
      clutchEngaged: true, isNeutral: false, limiterHit: false, grinding: false, wheelSlip: 0,
      boost: 0, gLong: 0, engineOn: false, cranking: false, launchControl: false
  });

  const [inputState, setInputState] = useState<InputState>({
      throttle: false, brake: false, clutch: false, shiftUp: false, shiftDown: false, neutral: false, ignition: false
  });

  // Frame counter for throttling UI updates
  const frameCount = useRef(0);

  const onPhysicsUpdate = (state: PhysicsState) => {
    // 1. High Frequency DOM Updates (60fps+)
    if (rpmNeedleRef.current) {
        const rpmPct = (state.rpm) / engineProfile.maxRpm;
        const deg = -135 + (Math.min(1, Math.max(0, rpmPct)) * 270);
        rpmNeedleRef.current.style.transform = `rotate(${deg}deg)`;
    }
    if (speedNeedleRef.current) {
        const spdPct = (state.speed * 3.6) / 280; 
        const deg = -135 + (Math.min(1, Math.max(0, spdPct)) * 270);
        speedNeedleRef.current.style.transform = `rotate(${deg}deg)`;
    }
    if (boostNeedleRef.current) {
        const boostPct = state.boost / 2.0; 
        const deg = -135 + (Math.min(1, Math.max(0, boostPct)) * 270);
        boostNeedleRef.current.style.transform = `rotate(${deg}deg)`;
    }

    if (containerRef.current) {
        let shake = 0;
        if (state.engineOn) {
            if (state.rpm > 0) shake += 0.3;
            if (state.rpm > engineProfile.redlineRpm - 1000) shake += 1;
            if (state.limiterHit) shake += 3;
            if (state.wheelSlip > 0.2) shake += 3;
            if (state.launchControl) shake += 2;
        } else if (state.cranking) {
            shake += 1.5;
        }
        
        if (shake > 0) {
            const x = (Math.random() - 0.5) * shake;
            const y = (Math.random() - 0.5) * shake;
            containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
        } else {
            containerRef.current.style.transform = `none`;
        }
    }

    // 2. Low Frequency React Updates (Throttle to ~20fps to save CPU for physics/audio)
    frameCount.current++;
    if (frameCount.current % 3 === 0) {
        setUiState({...state});
    }
  };

  const { setInput, shift, toggleNeutral, toggleIgnition } = useVehiclePhysics(
    engineProfile, 
    audioEngine, 
    active,
    onPhysicsUpdate
  );

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
        if (!active) return;
        if (e.repeat) return;
        switch(e.code) {
            case 'Space': setInput('throttle', true); setInputState(p => ({...p, throttle: true})); break;
            case 'KeyB': setInput('brake', true); setInputState(p => ({...p, brake: true})); break;
            case 'ShiftLeft': setInput('clutch', true); setInputState(p => ({...p, clutch: true})); break;
            case 'KeyE': shift(1); setInputState(p => ({...p, shiftUp: true})); break;
            case 'KeyQ': shift(-1); setInputState(p => ({...p, shiftDown: true})); break;
            case 'KeyN': toggleNeutral(); setInputState(p => ({...p, neutral: !p.neutral})); break;
            case 'KeyI': toggleIgnition(); setInputState(p => ({...p, ignition: true})); break;
        }
    };
    const handleUp = (e: KeyboardEvent) => {
        switch(e.code) {
            case 'Space': setInput('throttle', false); setInputState(p => ({...p, throttle: false})); break;
            case 'KeyB': setInput('brake', false); setInputState(p => ({...p, brake: false})); break;
            case 'ShiftLeft': setInput('clutch', false); setInputState(p => ({...p, clutch: false})); break;
            case 'KeyE': setInputState(p => ({...p, shiftUp: false})); break;
            case 'KeyQ': setInputState(p => ({...p, shiftDown: false})); break;
            case 'KeyI': setInput('ignition', false); setInputState(p => ({...p, ignition: false})); break;
        }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
        window.removeEventListener('keydown', handleDown);
        window.removeEventListener('keyup', handleUp);
    };
  }, [active, shift, toggleNeutral, toggleIgnition]);

  const startSimulation = () => {
      audioEngine.init();
      audioEngine.resume();
      setActive(true);
  };

  return (
    <div ref={containerRef} className="h-screen max-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col will-change-transform">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_#020617_80%)] pointer-events-none" />
      <div className="fixed inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
      
      {/* --- HEADER --- */}
      <header className="flex-none h-16 px-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur z-10">
          <h1 className="text-2xl font-black italic tracking-tighter text-white">PRO<span className="text-cyan-400">SIM</span></h1>
          <select 
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-xs font-bold text-slate-200 uppercase tracking-wide cursor-pointer focus:border-cyan-500"
            value={engineProfile.id}
            onChange={(e) => { const eng = ENGINES.find(eng => eng.id === e.target.value); if(eng) setEngineProfile(eng); }}
          >
            {ENGINES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
      </header>

      {/* --- MAIN DASHBOARD GRID --- */}
      <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 p-4 z-0 h-full max-h-[calc(100vh-4rem)]">
          
          {/* LEFT: Boost & G-Force */}
          <div className="col-span-3 row-span-4 flex flex-col items-center justify-center gap-8 border-r border-white/5">
             <div className="text-center w-full">
                <Gauge label="BOOST" subLabel="BAR" min={0} max={2.0} value={uiState.boost} needleRef={boostNeedleRef} size="sm" />
             </div>
             <div className="flex flex-col items-center">
                 <GForce gLong={uiState.gLong} />
             </div>
          </div>

          {/* CENTER: Main Gauges */}
          <div className="col-span-6 row-span-4 flex items-center justify-center gap-2 lg:gap-8 relative">
              <div className="absolute top-4 flex gap-4">
                  <div className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${uiState.engineOn ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-900'}`}>
                      {uiState.engineOn ? 'IGNITION ON' : 'IGNITION OFF'}
                  </div>
                  {uiState.launchControl && (
                       <div className="px-3 py-1 rounded text-xs font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 animate-pulse">
                          LAUNCH CONTROL
                       </div>
                  )}
              </div>
              
              <div className="scale-90 lg:scale-100 transition-transform">
                <Gauge 
                    label="RPM" subLabel="x1000" 
                    min={0} max={engineProfile.maxRpm} value={uiState.rpm} 
                    dangerStart={engineProfile.redlineRpm} needleRef={rpmNeedleRef} 
                    size="lg"
                />
              </div>
              <div className="scale-90 lg:scale-100 transition-transform">
                <Gauge 
                    label="SPEED" subLabel="KM/H" 
                    min={0} max={280} value={uiState.speed * 3.6} 
                    needleRef={speedNeedleRef} 
                    size="lg"
                    showDigital={true}
                />
              </div>

              {/* Center Gear Indicator Overlay */}
              <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-16 h-20 bg-slate-950 border border-slate-700 rounded flex items-center justify-center shadow-2xl relative overflow-hidden">
                      {uiState.grinding && <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />}
                      <span className={`text-4xl font-black ${uiState.isNeutral ? 'text-amber-400' : 'text-white'}`}>
                          {uiState.isNeutral ? 'N' : uiState.gear}
                      </span>
                  </div>
              </div>
          </div>

          {/* RIGHT: Status & Info */}
          <div className="col-span-3 row-span-4 flex flex-col justify-center gap-4 px-4 border-l border-white/5">
              <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400"><span>Throttle</span> <span>{(uiState.throttleInput * 100).toFixed(0)}%</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div style={{width: `${uiState.throttleInput*100}%`}} className="h-full bg-emerald-500"/></div>
                  
                  <div className="flex justify-between text-xs text-slate-400"><span>Brake</span> <span>{(uiState.brakeInput * 100).toFixed(0)}%</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div style={{width: `${uiState.brakeInput*100}%`}} className="h-full bg-rose-500"/></div>
                  
                  <div className="flex justify-between text-xs text-slate-400"><span>Clutch</span> <span className={uiState.clutchEngaged ? "text-cyan-400" : "text-amber-500"}>{uiState.clutchEngaged ? "CLOSED" : "OPEN"}</span></div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div style={{width: `${Number(!uiState.clutchEngaged)*100}%`}} className="h-full bg-amber-500"/></div>
              </div>

              <div className="bg-slate-900/50 p-3 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase text-slate-500 font-bold">Tire Status</span>
                      <span className={`text-[10px] font-bold ${uiState.wheelSlip > 0.1 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                          {uiState.wheelSlip > 0.1 ? "SLIP DETECTED" : "OPTIMAL"}
                      </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 transition-all duration-75" style={{width: `${uiState.wheelSlip * 100}%`}} />
                  </div>
              </div>
          </div>

          {/* BOTTOM: Telemetry & Controls */}
          <div className="col-span-12 row-span-2 flex gap-4 items-end pb-4">
              <div className="flex-1 h-full">
                  <Telemetry state={uiState} maxRpm={engineProfile.maxRpm} />
              </div>
              <div className="flex-none">
                  <Controls inputs={inputState} />
              </div>
          </div>

          {!active && (
              <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col gap-4 items-center justify-center">
                  <button 
                    onClick={startSimulation}
                    className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl uppercase tracking-widest rounded transition-all hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
                  >
                      Enter Cockpit
                  </button>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Headphones Recommended</p>
              </div>
          )}

          {active && !uiState.engineOn && !uiState.cranking && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse">
                 <div className="px-6 py-2 bg-slate-900/80 backdrop-blur border border-cyan-500/50 rounded text-cyan-400 font-bold text-sm tracking-widest uppercase">
                     Hold 'I' to Start Engine
                 </div>
             </div>
          )}

      </main>
    </div>
  );
};

export default App;
