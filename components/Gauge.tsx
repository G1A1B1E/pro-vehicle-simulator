import React from 'react';

interface GaugeProps {
  label: string;
  subLabel: string;
  min: number;
  max: number;
  value: number; 
  dangerStart?: number;
  needleRef?: React.RefObject<HTMLDivElement>;
  size?: "sm" | "md" | "lg";
  showDigital?: boolean; // New prop to toggle digital readout
}

export const Gauge: React.FC<GaugeProps> = ({ 
  label, subLabel, min, max, value, dangerStart, needleRef, size = "lg", showDigital = false 
}) => {
  const angleStart = -135;
  const angleEnd = 135;
  
  const ticks = [];
  const majorStep = (max - min) / 10;
  
  const showShiftLights = !!dangerStart && size === "lg";
  const shiftLightEls = [];
  
  if (showShiftLights && dangerStart) {
      const lightsCount = 8;
      const startActivation = dangerStart - 1500;
      
      for(let i=0; i<lightsCount; i++) {
          const threshold = startActivation + (i / lightsCount) * 1500;
          const isActive = value >= threshold;
          const isRed = i >= lightsCount - 2;
          const isFlashing = value >= dangerStart;
          
          let bgClass = "bg-slate-800";
          if (isActive) {
             if (isFlashing) bgClass = isRed ? "bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" : "bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]";
             else bgClass = isRed ? "bg-rose-500 shadow-[0_0_5px_#f43f5e]" : "bg-cyan-500 shadow-[0_0_5px_#06b6d4]";
          }

          shiftLightEls.push(
              <div key={i} className={`w-2 h-2 rounded-full ${bgClass} transition-colors duration-75`} />
          );
      }
  }

  for (let i = min; i <= max; i += majorStep) {
    const percent = (i - min) / (max - min);
    const angle = angleStart + percent * (angleEnd - angleStart);
    const isMajor = true;
    
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = 50 + 42 * Math.cos(rad);
    const y1 = 50 + 42 * Math.sin(rad);
    const x2 = 50 + (isMajor ? 34 : 38) * Math.cos(rad);
    const y2 = 50 + (isMajor ? 34 : 38) * Math.sin(rad);

    let color = "stroke-slate-700";
    if (dangerStart && i >= dangerStart) color = "stroke-rose-600";

    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={`${color} stroke-[1.5px]`} strokeLinecap="round" />
    );
    
    if (i % (majorStep * 2) === 0 || i === max) {
       const tx = 50 + 26 * Math.cos(rad);
       const ty = 50 + 26 * Math.sin(rad);
       ticks.push(
         <text key={`t-${i}`} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" 
           className={`font-black font-mono ${size === 'sm' ? 'text-[8px]' : 'text-[5px]'} ${dangerStart && i >= dangerStart ? 'fill-rose-500' : 'fill-slate-400'}`}>
           {i >= 1000 ? i / 1000 : i}
         </text>
       );
    }
  }

  let redZonePath = "";
  if (dangerStart) {
    const startP = (dangerStart - min) / (max - min);
    const startA = (angleStart + startP * (angleEnd - angleStart) - 90) * (Math.PI / 180);
    const endA = (angleEnd - 90) * (Math.PI / 180);
    const r = 42;
    const xStart = 50 + r * Math.cos(startA);
    const yStart = 50 + r * Math.sin(startA);
    const xEnd = 50 + r * Math.cos(endA);
    const yEnd = 50 + r * Math.sin(endA);
    const largeArc = (endA - startA) > Math.PI ? 1 : 0;
    redZonePath = `M ${xStart} ${yStart} A ${r} ${r} 0 ${largeArc} 1 ${xEnd} ${yEnd}`;
  }

  const containerClass = size === 'sm' ? 'w-full max-w-[140px]' : 'w-full max-w-[320px]';

  return (
    <div className={`flex flex-col items-center gap-2 ${containerClass} aspect-square`}>
        {showShiftLights && (
            <div className="flex gap-1 mb-[-10px] z-10 p-1 bg-slate-950/80 rounded-full border border-slate-800">
                {shiftLightEls}
            </div>
        )}
        <div className="relative w-full h-full">
        {/* Bezel */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 shadow-[inset_0_2px_20px_rgba(0,0,0,1),0_5px_10px_rgba(0,0,0,0.5)] border border-slate-800" />
        
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-2">
            <path d="M 20 85 A 40 40 0 1 1 80 85" fill="none" className="stroke-slate-900 stroke-[8px]" />
            {redZonePath && <path d={redZonePath} fill="none" className="stroke-rose-900/40 stroke-[4px]" />}
            {ticks}
        </svg>

        {/* Needle */}
        <div 
            ref={needleRef}
            className="absolute inset-0 transition-transform duration-75 ease-linear will-change-transform"
            style={{ transform: `rotate(${angleStart}deg)` }}
        >
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1.5px] h-[35%] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-full" />
        </div>

        {/* Center Cap / Digital Readout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full bg-[radial-gradient(circle_at_30%_30%,_#334155,_#020617)] border border-slate-800 flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10">
            {showDigital ? (
                <div className="flex flex-col items-center justify-center pt-1">
                   <span className="text-white text-2xl md:text-3xl font-black tracking-tighter leading-none tabular-nums">
                       {Math.round(value)}
                   </span>
                   <span className="text-slate-500 text-[6px] md:text-[8px] font-bold uppercase tracking-widest">{subLabel}</span>
                </div>
            ) : (
                <>
                  <span className="text-slate-400 text-[10px] tracking-widest font-black uppercase">{label}</span>
                  <span className="text-slate-600 text-[7px] font-mono">{subLabel}</span>
                </>
            )}
        </div>
        
        {/* Glare */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
    </div>
  );
};
