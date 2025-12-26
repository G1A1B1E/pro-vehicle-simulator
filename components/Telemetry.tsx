import React, { useEffect, useRef } from 'react';
import { PhysicsState } from '../types';

export const Telemetry: React.FC<{ state: PhysicsState, maxRpm: number }> = ({ state, maxRpm }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<{rpm: number, speed: number, slip: number}[]>([]);
  const maxHistory = 300; // 5 seconds at 60fps

  useEffect(() => {
    // Update history
    history.current.push({ rpm: state.rpm, speed: state.speed, slip: state.wheelSlip });
    if (history.current.length > maxHistory) history.current.shift();

    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const w = cvs.width;
    const h = cvs.height;
    
    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const y = (i / 4) * h;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
    }
    ctx.stroke();

    if (history.current.length < 2) return;

    // Draw RPM (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    history.current.forEach((pt, i) => {
        const x = (i / maxHistory) * w;
        const y = h - (pt.rpm / maxRpm) * h;
        if (i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Speed (Purple) - Scaled roughly to 0-300kmh
    ctx.beginPath();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    history.current.forEach((pt, i) => {
        const x = (i / maxHistory) * w;
        const y = h - ((pt.speed * 3.6) / 300) * h;
        if (i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Slip (Red Fill at bottom)
    ctx.fillStyle = '#f43f5e';
    history.current.forEach((pt, i) => {
        if (pt.slip > 0.1) {
            const x = (i / maxHistory) * w;
            const hBar = Math.min(1, pt.slip) * (h * 0.3);
            ctx.fillRect(x, h - hBar, w/maxHistory + 1, hBar);
        }
    });

  }, [state, maxRpm]);

  return (
    <div className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden">
        <canvas ref={canvasRef} width={600} height={128} className="w-full h-full block" />
        <div className="absolute top-2 right-2 flex gap-3">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] text-slate-400">RPM</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[10px] text-slate-400">SPD</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-slate-400">SLIP</span></div>
        </div>
    </div>
  );
};
