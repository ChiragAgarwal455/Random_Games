import React, { useState } from 'react';
import { Check, CloudRain, Coffee, Sparkles, Star, Sun, Sunset, X } from 'lucide-react';
import { COLLECTIBLE_CUPS, UPGRADE_TRACKS } from '../data/shop';
import { UpgradeTrackId, WeatherMood } from '../types/game';

interface ShopModalProps {
  money: number;
  upgradeLevels: Partial<Record<UpgradeTrackId, number>>;
  unlockedCups: string[];
  endlessMode: boolean;
  weatherOverride: WeatherMood | 'auto';
  onBuyUpgrade: (trackId: UpgradeTrackId, nextTier: number, price: number) => void;
  onBuyCup: (cupId: string, price: number) => void;
  onSetWeather: (w: WeatherMood | 'auto') => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  money,
  upgradeLevels,
  unlockedCups,
  endlessMode,
  weatherOverride,
  onBuyUpgrade,
  onBuyCup,
  onSetWeather,
  onClose,
}) => {
  const [tab, setTab] = useState<'upgrades' | 'mugs'>('upgrades');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#2C1E17]/55 backdrop-blur-[2px]">
      <div className="sketch-card max-w-3xl w-full max-h-[88vh] flex flex-col p-5 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#CBB494]">
          <div>
            <h2 className="font-sketch text-3xl text-[#3B2318]">Café Upgrade &amp; Décor Catalogue</h2>
            <p className="text-xs sm:text-sm text-[#6B4F41]">
              Grow your cozy coffeehouse from Tier 1 to Tier 3! Balance:{' '}
              <strong className="text-[#B85438]">${money.toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={onClose} className="sketch-btn p-2" aria-label="Close catalogue">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shop Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('upgrades')}
            className={`sketch-btn px-3.5 py-1.5 text-sm flex items-center gap-1.5 ${
              tab === 'upgrades' ? 'bg-[#F5D693] text-[#3B2318]' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#B85438]" />
            Décor &amp; Equipment Tiers (8 Tracks)
          </button>
          <button
            onClick={() => setTab('mugs')}
            className={`sketch-btn px-3.5 py-1.5 text-sm flex items-center gap-1.5 ${
              tab === 'mugs' ? 'bg-[#F5D693] text-[#3B2318]' : ''
            }`}
          >
            <Coffee className="w-4 h-4 text-[#6B4F41]" />
            Collectible Mugs &amp; Weather
          </button>
        </div>

        <div className="mt-4 overflow-y-auto sketch-scroll pr-1 space-y-3">
          {tab === 'upgrades' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {UPGRADE_TRACKS.map((track) => {
                const currentTier = upgradeLevels[track.id] ?? 0;
                const nextTierInfo = track.tiers.find((t) => t.tier === currentTier + 1);
                const maxed = !nextTierInfo;
                const canAfford = nextTierInfo ? money >= nextTierInfo.price : false;

                return (
                  <div
                    key={track.id}
                    className={`p-3.5 rounded-xl border-2 flex flex-col justify-between ${
                      maxed
                        ? 'bg-[#E6EEDB] border-[#6F8D65]'
                        : currentTier > 0
                        ? 'bg-[#FFF9ED] border-[#9B6E47]'
                        : 'bg-[#FFFDF7] border-[#3B2318]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sketch text-xl text-[#3B2318]">{track.categoryName}</h3>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((tNum) => (
                            <span
                              key={tNum}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                tNum <= currentTier
                                  ? 'bg-[#7A9C6A] text-white border-[#3B2318]'
                                  : 'bg-[#EFE2CB] text-[#7A5E4E] border-[#C6AF8B]'
                              }`}
                            >
                              T{tNum}
                            </span>
                          ))}
                        </div>
                      </div>

                      {nextTierInfo ? (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#FAF1DF] border border-[#DFC9A4]">
                          <div className="flex items-center justify-between text-xs font-bold text-[#3B2318]">
                            <span>Next: Tier {nextTierInfo.tier} — {nextTierInfo.name}</span>
                          </div>
                          <p className="text-xs text-[#5B4033] mt-0.5 leading-snug">{nextTierInfo.description}</p>
                          {nextTierInfo.perkLabel && (
                            <span className="inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded bg-[#E7F0DD] text-[#3F5C35]">
                              ✨ {nextTierInfo.perkLabel}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#DCE8CF] border border-[#75926B] text-xs text-[#37522F]">
                          <strong>Tier 3 Complete!</strong> {track.tiers[2].name}
                          {track.tiers[2].perkLabel ? ` — ${track.tiers[2].perkLabel}` : ''}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      {currentTier > 0 && !maxed ? (
                        <span className="text-[11px] font-semibold text-[#5E7C52]">
                          Active: {track.tiers[currentTier - 1].name}
                        </span>
                      ) : (
                        <span />
                      )}

                      {maxed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#44623B]">
                          <Star className="w-4 h-4 fill-[#E8AE42] text-[#3B2318]" /> Max Tier
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => onBuyUpgrade(track.id, nextTierInfo.tier, nextTierInfo.price)}
                          className="sketch-btn sketch-btn-primary px-3.5 py-1.5 text-sm flex items-center gap-1.5"
                        >
                          Upgrade T{nextTierInfo.tier} (${nextTierInfo.price.toFixed(2)})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COLLECTIBLE_CUPS.map((cup) => {
                  const owned = unlockedCups.includes(cup.id);
                  const canAfford = money >= cup.price;
                  return (
                    <div
                      key={cup.id}
                      className={`p-3.5 rounded-xl border-2 flex flex-col justify-between ${
                        owned ? 'bg-[#E6EEDB] border-[#6F8D65]' : 'bg-[#FFFDF7] border-[#3B2318]'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFE1CA] text-[#5C4133] font-bold">
                          Collectible Mug
                        </span>
                        <h3 className="font-sketch text-xl text-[#3B2318] mt-1.5">{cup.name}</h3>
                        <p className="text-xs text-[#6B4F41] mt-1 leading-relaxed">{cup.description}</p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {owned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#44623B]">
                            <Check className="w-4 h-4" /> On Cup Rack
                          </span>
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => onBuyCup(cup.id, cup.price)}
                            className="sketch-btn sketch-btn-primary px-3.5 py-1.5 text-sm"
                          >
                            Buy ${cup.price.toFixed(2)}
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
                    <h4 className="font-sketch text-lg text-[#3B2318]">Window Weather Mood</h4>
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
                    ).map((opt) => {
                      const active = weatherOverride === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onSetWeather(opt.id)}
                          className={`sketch-btn px-2.5 py-1 text-xs flex items-center gap-1 ${
                            active ? 'bg-[#F3D79B]' : ''
                          }`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
