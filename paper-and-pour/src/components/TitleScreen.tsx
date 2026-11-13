import React from 'react';
import { Coffee, Sparkles, Volume2 } from 'lucide-react';
import { GameProgressSave } from '../types/game';

interface TitleScreenProps {
  save: GameProgressSave;
  onStartNew: () => void;
  onContinue: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ save, onStartNew, onContinue }) => {
  const hasProgress = save.seenPrologue || save.cupsServed > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at 50% 35%, #FAF3E3 0%, #EAD9BC 68%, #D4BC96 100%)',
      }}
    >
      {/* Decorative notebook rings along left edge */}
      <div className="pointer-events-none fixed left-2 top-0 bottom-0 hidden sm:flex flex-col justify-evenly opacity-55">
        {Array.from({ length: 11 }).map((_, idx) => (
          <div
            key={idx}
            className="w-7 h-3 rounded-full border-2 border-[#3B2820] bg-[#DFD7CC]"
          />
        ))}
      </div>

      <div className="sketch-card washi-tape relative max-w-xl w-full p-7 sm:p-9 text-center">
        {/* Cute Coffee Stain Accent */}
        <div
          className="pointer-events-none absolute -right-5 -bottom-5 w-28 h-28 rounded-full opacity-20"
          style={{
            border: '7px solid #8A5B36',
            filter: 'blur(0.6px)',
          }}
        />

        {/* Illustrated Sketchbook Mug SVG */}
        <div className="mx-auto mb-3 w-28 h-28">
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
            {/* Steam */}
            <path
              d="M44 30 Q39 20 46 11 M60 28 Q54 17 62 8 M76 31 Q71 21 78 13"
              fill="none"
              stroke="#6B4F41"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Saucer */}
            <ellipse cx="60" cy="95" rx="40" ry="10" fill="#E9D8BE" stroke="#3B2820" strokeWidth="2.6" />
            {/* Handle */}
            <path
              d="M88 52 Q105 52 105 66 Q105 80 86 78"
              fill="none"
              stroke="#3B2820"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M88 52 Q105 52 105 66 Q105 80 86 78"
              fill="none"
              stroke="#FFF8ED"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            {/* Cup Body */}
            <path
              d="M30 45 Q31 92 60 92 Q89 92 90 45 Z"
              fill="#FFF8ED"
              stroke="#3B2820"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Coffee Surface */}
            <ellipse cx="60" cy="45" rx="30" ry="11" fill="#C78246" stroke="#3B2820" strokeWidth="2.5" />
            {/* Latte Heart */}
            <path
              d="M60 49 C55 43 49 46 53 49 C56 51.5 60 53 60 53 C60 53 64 51.5 67 49 C71 46 65 43 60 49 Z"
              fill="#FFFBF2"
            />
            {/* Cute Blush Face on Mug */}
            <circle cx="49" cy="67" r="2.2" fill="#3B2820" />
            <circle cx="71" cy="67" r="2.2" fill="#3B2820" />
            <ellipse cx="44" cy="71" rx="4" ry="2.2" fill="#E8939B" opacity="0.65" />
            <ellipse cx="76" cy="71" rx="4" ry="2.2" fill="#E8939B" opacity="0.65" />
            <path d="M56 70 Q60 74 64 70" fill="none" stroke="#3B2820" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <p className="font-diary text-2xl text-[#8A5A44] -mb-1">Nana Maeve’s Sketchbook Café</p>
        <h1 className="font-sketch text-5xl sm:text-6xl tracking-wide text-[#3B2820] my-1">
          Paper &amp; Pour
        </h1>
        <p className="text-sm sm:text-base text-[#6B4F41] max-w-md mx-auto mt-2 leading-relaxed">
          Step into Clover’s cozy 2.5D corner café. Grind fresh beans, swirl silky fluid latte art,
          listen to gentle rainy-day café ASMR, and pour warm stories for every neighbor.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {hasProgress && (
            <button
              onClick={onContinue}
              className="sketch-btn sketch-btn-primary px-7 py-3 text-xl flex items-center justify-center gap-2"
            >
              <Coffee className="w-5 h-5" />
              {save.endlessMode
                ? `Open Café (Endless • $${save.money.toFixed(2)})`
                : `Continue Day ${save.day} ($${save.money.toFixed(2)})`}
            </button>
          )}
          <button
            onClick={onStartNew}
            className={`sketch-btn ${
              hasProgress ? '' : 'sketch-btn-primary'
            } px-7 py-3 text-xl flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-5 h-5" />
            {hasProgress ? 'Start Fresh Sketchbook' : 'Open the Café'}
          </button>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE2CB] border border-[#C6AF8B] text-xs text-[#6B4F41]">
          <Volume2 className="w-4 h-4 text-[#C96C50]" />
          <span>Calm procedural rain, coffee foley &amp; felt-piano ASMR starts when you open the café</span>
        </div>
      </div>
    </div>
  );
};
