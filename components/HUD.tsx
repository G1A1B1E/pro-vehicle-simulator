import React from 'react';
import { PhysicsState } from '../types';

export const HUD: React.FC<{ state: PhysicsState }> = ({ state }) => {
  return (
    <div className="fixed top-6 left-6 flex flex-col gap-2 z-50 pointer-events-none">
      <div className="flex items-center gap-4">
        {/* Gear Indicator */}
        <div className="w-20 h-24 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
            {state.grinding && <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />}
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Gear</span>
            <span className={`text-5xl font-black ${state.isNeutral ? 'text-amber-400' : 'text-cyan-400'}`}>
                {state.isNeutral ? 'N' : state.gear}
            </span>
        </div>

        {/* Speed Digital */}
        <div className="flex flex-col">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                {Math.round(state.speed * 3.6)}
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">KM/H</span>
        </div>
      </div>

      {/* Warnings */}
      <div className="flex flex-col gap-1 items-start mt-2">
          {state.limiterHit && (
              <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/50 text-rose-500 text-[10px] font-bold uppercase rounded animate-pulse">
                  Limiter Cut
              </span>
          )}
          {state.grinding && (
              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/50 text-amber-500 text-[10px] font-bold uppercase rounded animate-bounce">
                  Gear Grind
              </span>
          )}
      </div>
    </div>
  );
};
