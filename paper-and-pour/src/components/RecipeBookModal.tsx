import React, { useState } from 'react';
import { Coffee, Lightbulb, Lock, X } from 'lucide-react';
import { BARISTA_TIPS } from '../data/baristaTips';
import { CUP_META, RECIPES, SYRUP_META, TOPPING_META } from '../data/recipes';
import { BaristaTip } from '../types/game';

interface RecipeBookModalProps {
  currentDay: number;
  endlessMode: boolean;
  onClose: () => void;
}

const TIP_CATS: Array<'All' | BaristaTip['category']> = [
  'All',
  'Espresso',
  'Milk & Foam',
  'Latte Art',
  'Matcha & Tea',
  'Café Craft',
];

export const RecipeBookModal: React.FC<RecipeBookModalProps> = ({
  currentDay,
  endlessMode,
  onClose,
}) => {
  const [tab, setTab] = useState<'recipes' | 'tips'>('recipes');
  const [tipCat, setTipCat] = useState<'All' | BaristaTip['category']>('All');
  const effectiveDay = endlessMode ? 99 : currentDay;

  const visibleTips =
    tipCat === 'All' ? BARISTA_TIPS : BARISTA_TIPS.filter((t) => t.category === tipCat);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#2C1E17]/55 backdrop-blur-[2px]">
      <div className="sketch-card max-w-3xl w-full max-h-[88vh] flex flex-col p-5 sm:p-7 relative">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#CBB494]">
          <div>
            <h2 className="font-sketch text-3xl text-[#3B2318]">Nana Maeve’s Coffee Notebook</h2>
            <p className="text-xs sm:text-sm text-[#6B4F41]">
              Recipes &amp; real-life coffee craft wisdom collected over decades behind the bar.
            </p>
          </div>
          <button onClick={onClose} className="sketch-btn p-2" aria-label="Close recipe book">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('recipes')}
            className={`sketch-btn px-3.5 py-1.5 text-sm flex items-center gap-1.5 ${
              tab === 'recipes' ? 'bg-[#F5D693]' : ''
            }`}
          >
            <Coffee className="w-4 h-4 text-[#6B4F41]" />
            Drink Recipes ({RECIPES.length})
          </button>
          <button
            onClick={() => setTab('tips')}
            className={`sketch-btn px-3.5 py-1.5 text-sm flex items-center gap-1.5 ${
              tab === 'tips' ? 'bg-[#F5D693]' : ''
            }`}
          >
            <Lightbulb className="w-4 h-4 text-[#B85438]" />
            Real Barista Field Guide ({BARISTA_TIPS.length})
          </button>
        </div>

        {tab === 'recipes' ? (
          <div className="mt-4 overflow-y-auto sketch-scroll pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {RECIPES.map((r) => {
              const locked = r.unlockDay > effectiveDay;
              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border-2 ${
                    locked
                      ? 'bg-[#EAE0CE]/65 border-dashed border-[#B29B7D] opacity-70'
                      : 'bg-[#FFFDF7] border-[#3B2318]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-[#3B2318] shrink-0"
                        style={{ backgroundColor: locked ? '#C7BA9E' : r.colorSwatch }}
                      />
                      <h3 className="font-sketch text-xl text-[#3B2318]">{r.name}</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EFE1CA] text-[#6B4F41]">
                      {locked ? (
                        <span className="inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Day {r.unlockDay}
                        </span>
                      ) : (
                        `$${r.basePrice.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B4F41] mt-1">{r.subtitle}</p>

                  {!locked && (
                    <>
                      <div className="mt-2.5 p-2 rounded-lg bg-[#FAF2E1] text-xs font-medium text-[#4B3429]">
                        {r.sketchHint}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#EEDFC6] text-[#4E372D]">
                          {CUP_META[r.preferredCup[0]].label}
                        </span>
                        {r.isIced && (
                          <span className="px-2 py-0.5 rounded bg-[#D7EEF2] text-[#2D505C]">Iced</span>
                        )}
                        {r.milkSteamed && (
                          <span className="px-2 py-0.5 rounded bg-[#FCE5C8] text-[#734A22]">
                            Steamed Milk (~62°C)
                          </span>
                        )}
                        {Object.keys(r.syrups).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-[#F6DDE0] text-[#6D323A]"
                          >
                            {SYRUP_META[s as keyof typeof SYRUP_META].short}
                          </span>
                        ))}
                        {r.toppings.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[#E4EED8] text-[#3A5233]"
                          >
                            {TOPPING_META[t].short}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 flex flex-col min-h-0 flex-1">
            <div className="flex flex-wrap gap-1.5 pb-2.5">
              {TIP_CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTipCat(c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                    tipCat === c
                      ? 'bg-[#3B2318] text-[#FAF3E3] border-[#3B2318]'
                      : 'bg-[#F5E9D3] text-[#5B4033] border-[#CBB494] hover:bg-[#EFE0C3]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto sketch-scroll pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleTips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#3B2318] flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFE1CA] text-[#8A4E33]">
                      {tip.category}
                    </span>
                    <h4 className="font-sketch text-lg text-[#3B2318] mt-1">{tip.title}</h4>
                    <p className="text-xs text-[#4B3429] mt-1 leading-relaxed">{tip.fact}</p>
                  </div>
                  <div className="mt-2.5 p-2 rounded-lg bg-[#E9F1DF] text-[11px] font-medium text-[#37522F]">
                    <strong>Pro Trick:</strong> {tip.proTrick}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
