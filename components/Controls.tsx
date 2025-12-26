import React from 'react';
import { InputState } from '../types';

interface KeyProps {
  label: string;
  active: boolean;
  sub?: string;
  color?: string;
  wide?: boolean;
}

const Key: React.FC<KeyProps> = ({ label, active, sub, color = "border-cyan-500", wide }) => (
  <div className={`
    flex flex-col items-center justify-center border-b-2 rounded transition-all duration-75
    ${wide ? 'w-24' : 'w-10'} h-10
    ${active 
      ? `bg-slate-700 ${color} border-b-0 translate-y-0.5 shadow-[0_0_10px_rgba(255,255,255,0.1)]` 
      : 'bg-slate-800 border-slate-900'
    }
  `}>
    <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
  </div>
);

export const Controls: React.FC<{ inputs: InputState }> = ({ inputs }) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-lg backdrop-blur-sm">
      <div className="flex justify-center gap-2">
         <Key label="Q" active={inputs.shiftDown} sub="Down" color="border-amber-500" />
         <Key label="E" active={inputs.shiftUp} sub="Up" color="border-amber-500" />
      </div>
      
      <div className="flex justify-center gap-2 items-end">
        <Key label="Shift" active={inputs.clutch} sub="Clutch" color="border-rose-500" wide />
        <Key label="B" active={inputs.brake} sub="Brake" color="border-rose-500" />
        <Key label="Space" active={inputs.throttle} sub="Gas" color="border-emerald-500" wide />
      </div>

      <div className="flex justify-center gap-2 mt-1 pt-2 border-t border-slate-800">
         <Key label="N" active={inputs.neutral} sub="Neutral" />
         <Key label="I" active={inputs.ignition} sub="Start" color="border-emerald-500" />
      </div>
    </div>
  );
};
