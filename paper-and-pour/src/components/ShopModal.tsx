import React from 'react';
import { Check, CloudRain, Sparkles, Sun, Sunset, X } from 'lucide-react';
import { DECOR_CATALOG } from '../data/story';
import { WeatherMood } from '../types/game';

interface ShopModalProps {
  money: number;
  unlockedDecor: string[];
  endlessMode: boolean;
  weatherOverride: WeatherMood | 'auto';
  onBuy: (itemId: string, price: number) => void;
  onSetWeather: (w: WeatherMood | 'auto') => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  money,
  unlockedDecor,
  endlessMode,
  weatherOverride,
  onBuy,
  onSetWeather,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#2C1E17]/55 backdrop-blur-[2px]">
      <div className="sketch-card max-w-2xl w-full max-h-[86vh] flex flex-col p-5 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#CBB494]">
          <div>
            <h2 className="font-sketch text-3xl text-[#3B2820]">Nana’s Cozy Café Catalogue</h2>
            <p className="text-xs sm:text-sm text-[#6B4F41]">
              Spend earned tips on charming décor &amp; collectible mugs! Balance:{' '}
              <strong className="text-[#B85438]">${money.toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={onClose} className="sketch-btn p-2" aria-label="Close catalogue">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto sketch-scroll pr-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DECOR_CATALOG.map((item) => {
              const owned = unlockedDecor.includes(item.id);
              const canAfford = money >= item.price;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border-2 flex flex-col justify-between ${
                    owned ? 'bg-[#E6EEDB] border-[#6F8D65]' : 'bg-[#FFFDF7] border-[#3B2820]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-sketch text-xl text-[#3B2820]">{item.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFE1CA] text-[#5C4133] font-semibold">
                        {item.category === 'cup' ? 'Collectible Mug' : 'Café Décor'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B4F41] mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    {owned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#44623B]">
                        <Check className="w-4 h-4" /> Displayed in Café
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onBuy(item.id, item.price)}
                        className="sketch-btn sketch-btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Buy ${item.price.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4E7D0] border-2 border-[#C6AF8B]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-sketch text-lg text-[#3B2820]">Window Weather Mood</h4>
                <p className="text-xs text-[#6B4F41]">
                  {endlessMode
                    ? 'Switch the street atmosphere outside your arched café window anytime.'
                    : 'Follows Clover’s story days, or pick your favorite calming mood!'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'auto', label: 'Story', icon: null },
                    { id: 'rain', label: 'Rain', icon: CloudRain },
                    { id: 'mist', label: 'Mist', icon: CloudRain },
                    { id: 'sun', label: 'Sunny', icon: Sun },
                    { id: 'dusk', label: 'Dusk', icon: Sunset },
                  ] as const
                ).map((w) => {
                  const Icon = w.icon;
                  const active = weatherOverride === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => onSetWeather(w.id)}
                      className={`sketch-btn px-2.5 py-1 text-xs flex items-center gap-1 ${
                        active ? 'sketch-btn-sage' : ''
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
