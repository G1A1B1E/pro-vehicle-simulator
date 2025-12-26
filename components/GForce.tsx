import React from 'react';

export const GForce: React.FC<{ gLong: number }> = ({ gLong }) => {
  // Clamp G to circle
  const maxG = 1.5;
  const normalizedG = Math.max(-maxG, Math.min(maxG, gLong));
  const pct = normalizedG / maxG;
  
  // Moves up (braking/neg G) and down (accel/pos G) visually usually,
  // But conventionally in racing sims: 
  // Accel = dot moves down (weight transfer back)
  // Brake = dot moves up (weight transfer forward)
  const y = 50 + (pct * 40); 
  
  return (
    <div className="relative w-full aspect-square max-w-[120px] bg-slate-900 rounded-full border border-slate-800 shadow-inner flex items-center justify-center overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 opacity-20">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500" />
             <div className="absolute left-1/2 top-0 h-full w-[1px] bg-cyan-500" />
             <div className="absolute inset-4 rounded-full border border-cyan-500" />
        </div>
        
        {/* G-Dot */}
        <div 
            className="absolute w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e] transition-transform duration-75 will-change-transform"
            style={{ 
                transform: `translate(-50%, -50%)`, 
                top: `${y}%`,
                left: '50%' 
            }}
        />
        
        <span className="absolute bottom-2 text-[8px] text-slate-500 font-mono">G-FORCE</span>
        <span className="absolute top-2 text-[10px] text-white font-mono font-bold">{gLong.toFixed(2)}</span>
    </div>
  );
};
