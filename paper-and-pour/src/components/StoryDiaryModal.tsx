import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { StoryBeat } from '../types/game';

interface StoryDiaryModalProps {
  beat: StoryBeat;
  onContinue: () => void;
}

const DiaryVignette: React.FC<{ tag: StoryBeat['sketchTag'] }> = ({ tag }) => {
  return (
    <div className="mx-auto w-36 h-28 flex items-center justify-center rounded-xl bg-[#F4E7D0] border-2 border-dashed border-[#8E6F57] p-2">
      <svg viewBox="0 0 120 90" className="w-full h-full">
        {tag === 'apron' && (
          <>
            <path d="M40 16 L80 16 L86 76 L34 76 Z" fill="#C97358" stroke="#3B2820" strokeWidth="2.5" />
            <path d="M44 16 Q60 3 76 16" fill="none" stroke="#3B2820" strokeWidth="2.5" />
            <rect x="46" y="42" width="28" height="22" rx="4" fill="#FAF3E3" stroke="#3B2820" strokeWidth="2" />
            <path d="M55 50 Q60 56 65 50" fill="none" stroke="#3B2820" strokeWidth="2" />
          </>
        )}
        {tag === 'rain_window' && (
          <>
            <path d="M28 76 L28 32 Q60 6 92 32 L92 76 Z" fill="#B5CDD8" stroke="#3B2820" strokeWidth="2.5" />
            <line x1="60" y1="18" x2="60" y2="76" stroke="#3B2820" strokeWidth="2" />
            <line x1="28" y1="48" x2="92" y2="48" stroke="#3B2820" strokeWidth="2" />
            <line x1="42" y1="28" x2="38" y2="40" stroke="#FFFDF7" strokeWidth="2" strokeLinecap="round" />
            <line x1="74" y1="34" x2="70" y2="45" stroke="#FFFDF7" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="56" x2="46" y2="68" stroke="#FFFDF7" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {tag === 'ice_glass' && (
          <>
            <path d="M42 18 L46 76 L74 76 L78 18 Z" fill="#DCF0F4" stroke="#3B2820" strokeWidth="2.5" />
            <rect x="47" y="42" width="26" height="32" fill="#C99259" opacity="0.7" />
            <rect x="49" y="29" width="12" height="12" rx="2" fill="#FFFDF7" stroke="#3B2820" strokeWidth="1.5" />
            <rect x="61" y="34" width="11" height="11" rx="2" fill="#FFFDF7" stroke="#3B2820" strokeWidth="1.5" />
          </>
        )}
        {tag === 'matcha_whisk' && (
          <>
            <ellipse cx="52" cy="60" rx="28" ry="15" fill="#EFE4D3" stroke="#3B2820" strokeWidth="2.5" />
            <ellipse cx="52" cy="57" rx="22" ry="9" fill="#89B16C" />
            <rect x="74" y="18" width="11" height="26" rx="3" fill="#DFBE86" stroke="#3B2820" strokeWidth="2" />
            <path d="M74 44 L71 58 M79 44 L79 59 M85 44 L88 58" stroke="#3B2820" strokeWidth="1.8" />
          </>
        )}
        {tag === 'fairy_lights' && (
          <>
            <path d="M12 24 Q60 54 108 24" fill="none" stroke="#3B2820" strokeWidth="2" />
            {[26, 48, 72, 94].map((cx, i) => (
              <circle key={i} cx={cx} cy={32 + (i === 1 || i === 2 ? 7 : 0)} r="7" fill="#FFE07D" stroke="#3B2820" strokeWidth="1.8" />
            ))}
            <ellipse cx="60" cy="66" rx="18" ry="12" fill="#C5AEDD" stroke="#3B2820" strokeWidth="2" />
          </>
        )}
        {tag === 'portrait' && (
          <>
            <rect x="26" y="14" width="68" height="62" rx="6" fill="#FFFDF7" stroke="#3B2820" strokeWidth="2.5" />
            <circle cx="48" cy="40" r="11" fill="#A97C56" stroke="#3B2820" strokeWidth="2" />
            <circle cx="72" cy="42" r="10" fill="#F3DFD3" stroke="#3B2820" strokeWidth="2" />
            <path d="M55 62 C52 57 47 59 50 62 C53 64 55 66 55 66 C55 66 57 64 60 62 C63 59 58 57 55 62 Z" fill="#DE7A84" />
          </>
        )}
      </svg>
    </div>
  );
};

export const StoryDiaryModal: React.FC<StoryDiaryModalProps> = ({ beat, onContinue }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#2C1E17]/60 backdrop-blur-[2px]">
      <div className="sketch-card washi-tape max-w-lg w-full p-6 sm:p-8 relative">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8C6E59] mb-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <BookOpen className="w-4 h-4" />
            Clover’s Sketchbook
          </span>
          <span>{beat.dateLabel}</span>
        </div>

        <h2 className="font-sketch text-3xl text-[#3B2820] text-center mb-3">{beat.title}</h2>

        <DiaryVignette tag={beat.sketchTag} />

        <div className="mt-4 space-y-2.5 text-sm sm:text-base leading-relaxed text-[#4E372D]">
          {beat.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {beat.nanaQuote && (
          <blockquote className="mt-4 p-3.5 rounded-xl bg-[#EFE1CA] border-l-4 border-[#C96C50] font-diary text-xl text-[#4B3226]">
            {beat.nanaQuote}
          </blockquote>
        )}

        {beat.unlockedItemsText && (
          <div className="mt-4 p-3 rounded-xl bg-[#E3ECD8] border border-[#7F9A78] text-xs sm:text-sm text-[#394D34] flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-[#5B7C52]" />
            <span>{beat.unlockedItemsText}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={onContinue}
            className="sketch-btn sketch-btn-primary px-8 py-2.5 text-xl"
          >
            {beat.phase === 'prologue'
              ? 'Tie Apron & Open Day 1'
              : beat.phase === 'evening'
              ? beat.day >= 5
                ? 'Enter Cozy Endless Mode ♥'
                : `Begin Day ${beat.day + 1}`
              : 'Welcome First Guest ☕'}
          </button>
        </div>
      </div>
    </div>
  );
};
