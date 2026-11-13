import React from 'react';
import { CloudRain, Coffee, Music, Volume2, VolumeX } from 'lucide-react';
import { AudioMixSettings } from '../types/game';

interface AudioMixerPopoverProps {
  mix: AudioMixSettings;
  onChange: (next: Partial<AudioMixSettings>) => void;
  onClose: () => void;
}

export const AudioMixerPopover: React.FC<AudioMixerPopoverProps> = ({
  mix,
  onChange,
  onClose,
}) => {
  return (
    <div className="fixed top-16 right-4 z-40 sketch-card w-72 p-4">
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-dashed border-[#CBB494]">
        <h3 className="font-sketch text-xl text-[#3B2820]">Calm Café ASMR</h3>
        <button
          onClick={() => onChange({ masterMuted: !mix.masterMuted })}
          className="sketch-btn px-2.5 py-1 text-xs flex items-center gap-1"
        >
          {mix.masterMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {mix.masterMuted ? 'Muted' : 'On'}
        </button>
      </div>

      <div className="space-y-3 text-xs text-[#4E372D]">
        <label className="block">
          <div className="flex items-center justify-between mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-[#5D8799]" /> Rain on Window
            </span>
            <span>{Math.round(mix.rain * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={mix.rain}
            onChange={(e) => onChange({ rain: parseFloat(e.target.value) })}
            className="w-full sketch-slider"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[#8A5A3B]" /> Café Room &amp; Vinyl Dust
            </span>
            <span>{Math.round(mix.ambience * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={mix.ambience}
            onChange={(e) => onChange({ ambience: parseFloat(e.target.value) })}
            className="w-full sketch-slider"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#7F9A78]" /> Soft Felt Piano
            </span>
            <span>{Math.round(mix.music * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={mix.music}
            onChange={(e) => onChange({ music: parseFloat(e.target.value) })}
            className="w-full sketch-slider"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#C96C50]" /> Brewing ASMR Foley
            </span>
            <span>{Math.round(mix.foley * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={mix.foley}
            onChange={(e) => onChange({ foley: parseFloat(e.target.value) })}
            className="w-full sketch-slider"
          />
        </label>
      </div>

      <button onClick={onClose} className="sketch-btn w-full mt-3.5 py-1.5 text-sm">
        Done
      </button>
    </div>
  );
};
