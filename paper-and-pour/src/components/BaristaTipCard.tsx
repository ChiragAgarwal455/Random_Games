import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { BaristaTip } from '../types/game';

interface BaristaTipCardProps {
  tip: BaristaTip;
  onDismiss: () => void;
}

export const BaristaTipCard: React.FC<BaristaTipCardProps> = ({ tip, onDismiss }) => {
  return (
    <div className="pointer-events-auto w-full bg-[#FFF9ED]/95 border-2 border-[#3B2318] rounded-2xl shadow-[3px_4px_0_rgba(59,35,24,0.22)] px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#B85438] text-[11px] font-bold uppercase tracking-wide">
          <Lightbulb className="w-3.5 h-3.5 fill-[#F4C95D] text-[#3B2318]" />
          <span>Barista Field Note • {tip.category}</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#6B4F41] hover:text-[#3B2318] p-0.5 rounded"
          aria-label="Dismiss barista tip"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <h4 className="font-sketch text-base text-[#3B2318] mt-0.5 leading-tight">{tip.title}</h4>
      <p className="text-[11px] text-[#54392D] mt-0.5 leading-snug">{tip.fact}</p>
      <p className="text-[11px] font-semibold text-[#4B6B44] bg-[#E8F1DE] rounded-lg px-2 py-0.5 mt-1 leading-snug">
        ☕ Trick: {tip.proTrick}
      </p>
    </div>
  );
};
