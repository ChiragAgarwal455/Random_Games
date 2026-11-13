import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Coffee,
  Droplets,
  HelpCircle,
  NotebookPen,
  PenTool,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  computeHitZones,
  CUP_CENTER,
  HitZone,
  renderCafeScene,
  SceneRenderState,
  TipCoinVisual,
} from './art/cafeSceneRenderer';
import { getCupGeometry } from './art/cupRenderer';
import { hexToRgb } from './art/sketchUtils';
import { asmrEngine } from './audio/asmrEngine';
import { AudioMixerPopover } from './components/AudioMixerPopover';
import { BaristaTipCard } from './components/BaristaTipCard';
import { ReceiptToast } from './components/ReceiptToast';
import { RecipeBookModal } from './components/RecipeBookModal';
import { ShopModal } from './components/ShopModal';
import { StoryDiaryModal } from './components/StoryDiaryModal';
import { TitleScreen } from './components/TitleScreen';
import { BARISTA_TIPS } from './data/baristaTips';
import { CUSTOMERS, generateOrderForDay } from './data/customers';
import { evaluateDrink, MILK_META, SYRUP_META } from './data/recipes';
import { getShopBonuses } from './data/shop';
import { CUSTOMERS_PER_DAY, DAY_WEATHER, STORY_BEATS } from './data/story';
import {
  FluidParticle,
  IceCubeSim,
  LatteSurfaceSim,
  LiquidWaveSim,
  SurfaceRipple,
} from './fluid/fluidSim';
import {
  ActiveDrinkContents,
  ActiveOrder,
  AudioMixSettings,
  BaristaTip,
  CafeCat,
  CupStyle,
  CustomerMood,
  GameProgressSave,
  LatteStencil,
  MilkType,
  ServeEvaluation,
  StoryBeat,
  SyrupType,
  ToppingType,
  UpgradeTrackId,
  WaitingGuest,
  WeatherMood,
} from './types/game';

const SAVE_KEY = 'paper_and_pour_save_v2';

function createInitialSave(): GameProgressSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('paper_and_pour_save_v1');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameProgressSave> & { unlockedDecor?: string[] };
      const upgradeLevels: Partial<Record<UpgradeTrackId, number>> = {
        ...(parsed.upgradeLevels ?? {}),
      };
      const unlockedCups: string[] = [...(parsed.unlockedCups ?? [])];
      // Migrate v1 unlockedDecor if upgrading from v1 save
      if (Array.isArray(parsed.unlockedDecor)) {
        if (parsed.unlockedDecor.includes('pothos_plant')) upgradeLevels.greenery = Math.max(upgradeLevels.greenery ?? 0, 2);
        if (parsed.unlockedDecor.includes('fairy_lights')) upgradeLevels.lighting = Math.max(upgradeLevels.lighting ?? 0, 2);
        if (parsed.unlockedDecor.includes('flower_vase')) upgradeLevels.counter_charm = Math.max(upgradeLevels.counter_charm ?? 0, 1);
        if (parsed.unlockedDecor.includes('vinyl_player')) upgradeLevels.music_corner = Math.max(upgradeLevels.music_corner ?? 0, 2);
        if (parsed.unlockedDecor.includes('window_kitty')) upgradeLevels.cat_lounge = Math.max(upgradeLevels.cat_lounge ?? 0, 1);
        if (parsed.unlockedDecor.includes('cat_mug') && !unlockedCups.includes('cat_mug')) unlockedCups.push('cat_mug');
        if (parsed.unlockedDecor.includes('frog_mug') && !unlockedCups.includes('frog_mug')) unlockedCups.push('frog_mug');
      }
      return {
        day: parsed.day ?? 1,
        endlessMode: parsed.endlessMode ?? false,
        money: parsed.money ?? 14.0,
        totalTips: parsed.totalTips ?? 0,
        cupsServed: parsed.cupsServed ?? 0,
        upgradeLevels,
        unlockedCups,
        seenTipIds: parsed.seenTipIds ?? [],
        customerVisits: parsed.customerVisits ?? {},
        seenPrologue: parsed.seenPrologue ?? false,
        weatherOverride: parsed.weatherOverride ?? 'auto',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    day: 1,
    endlessMode: false,
    money: 14.0,
    totalTips: 0,
    cupsServed: 0,
    upgradeLevels: {},
    unlockedCups: [],
    seenTipIds: [],
    customerVisits: {},
    seenPrologue: false,
    weatherOverride: 'auto',
  };
}

function createInitialCats(): (CafeCat & { stateTimer: number })[] {
  return [
    {
      id: 'miso',
      name: 'Miso',
      coat: 'calico',
      unlockTierRequired: 0,
      x: 112,
      y: 238,
      targetX: 165,
      facing: 1,
      state: 'walking',
      stateTimer: 3.5,
      happyTimer: 0,
      tailPhase: 0.4,
    },
    {
      id: 'biscuit',
      name: 'Biscuit',
      coat: 'ginger',
      unlockTierRequired: 1,
      x: 215,
      y: 244,
      targetX: 148,
      facing: -1,
      state: 'loaf',
      stateTimer: 4.5,
      happyTimer: 0,
      tailPhase: 2.1,
    },
    {
      id: 'sesame',
      name: 'Sesame',
      coat: 'tuxedo',
      unlockTierRequired: 3,
      x: 78,
      y: 224,
      targetX: 235,
      facing: 1,
      state: 'playing',
      stateTimer: 3.0,
      happyTimer: 0,
      tailPhase: 3.8,
    },
  ];
}

function emptyDrink(): ActiveDrinkContents {
  return {
    cupStyle: null,
    espressoShots: 0,
    water: 0,
    matchaAmount: 0,
    cocoaAmount: 0,
    milkType: 'none',
    milkAmount: 0,
    milkWasSteamed: false,
    milkTempC: 14,
    foamCoverage: 0,
    syrups: {},
    iceCount: 0,
    toppings: [],
    latteArtBrushStrokes: 0,
    latteArtQuality: 0,
  };
}

export default function App() {
  const [save, setSave] = useState<GameProgressSave>(createInitialSave);
  const [showTitle, setShowTitle] = useState(true);
  const [activeBeat, setActiveBeat] = useState<StoryBeat | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showStepHint, setShowStepHint] = useState(false);
  const [audioMix, setAudioMix] = useState<AudioMixSettings>(() => asmrEngine.getMix());

  const [currentOrder, setCurrentOrder] = useState<ActiveOrder | null>(null);
  const [servedInDay, setServedInDay] = useState(0);
  const [evaluation, setEvaluation] = useState<ServeEvaluation | null>(null);
  const [hoverTip, setHoverTip] = useState<{ label: string; sub?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTip, setActiveTip] = useState<BaristaTip | null>(null);

  const [uiStatus, setUiStatus] = useState({
    hasCup: false,
    canServe: false,
    canZoomLatte: false,
    inLatteZoom: false,
    pouringMode: 'none' as 'none' | 'pitcher' | 'etch',
    stencil: 'heart' as LatteStencil,
    showGuide: true,
    pitcherFill: 0,
    pitcherTemp: 12,
    isSteaming: false,
    shotReady: false,
    whiskReady: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerDownRef = useRef(false);
  const holdingGrinderRef = useRef(false);
  const lastPointerRef = useRef({ x: 640, y: 360 });
  const dayQueueRef = useRef<number[]>([]);

  const shopBonuses = useMemo(() => getShopBonuses(save.upgradeLevels), [save.upgradeLevels]);

  const simRef = useRef<{
    waveSim: LiquidWaveSim;
    pitcherWave: LiquidWaveSim;
    latteSim: LatteSurfaceSim;
    ripples: SurfaceRipple[];
    iceCubes: IceCubeSim[];
    particles: FluidParticle[];
    drink: ActiveDrinkContents;
    grinder: {
      groundProgress: number;
      tamped: boolean;
      lockedInMachine: boolean;
      pullingShot: boolean;
      shotProgress: number;
    };
    shotCupFill: number;
    whiskBowl: {
      powder: 'none' | 'matcha' | 'cocoa';
      waterAdded: boolean;
      whiskProgress: number;
      readyToPour: boolean;
    };
    pitcher: {
      milkType: MilkType;
      fill: number;
      tempC: number;
      foamRatio: number;
      isSteaming: boolean;
      tiltAngle: number;
    };
    pouringMode: 'none' | 'pitcher' | 'etch';
    isActivelyPouring: boolean;
    pourTargetNormX: number;
    pourTargetNormY: number;
    pouringStream: null | { fromX: number; fromY: number; color: string; width: number; timer: number };
    latteZoomTarget: number;
    latteZoom: number;
    stencil: LatteStencil;
    showStencilGuide: boolean;
    kettleTilting: number;
    customerMood: CustomerMood;
    customerEnter: number;
    patience: number;
    waitingGuests: WaitingGuest[];
    cats: (CafeCat & { stateTimer: number })[];
    servingCupAnim: number;
    servingAnimating: boolean;
    tipCoins: TipCoinVisual[];
    hoveredId: string | null;
  }>({
    waveSim: new LiquidWaveSim(),
    pitcherWave: new LiquidWaveSim(),
    latteSim: new LatteSurfaceSim(),
    ripples: [],
    iceCubes: [],
    particles: [],
    drink: emptyDrink(),
    grinder: {
      groundProgress: 0,
      tamped: false,
      lockedInMachine: false,
      pullingShot: false,
      shotProgress: 0,
    },
    shotCupFill: 0,
    whiskBowl: {
      powder: 'none',
      waterAdded: false,
      whiskProgress: 0,
      readyToPour: false,
    },
    pitcher: {
      milkType: 'whole',
      fill: 0,
      tempC: 12,
      foamRatio: 0,
      isSteaming: false,
      tiltAngle: 0,
    },
    pouringMode: 'none',
    isActivelyPouring: false,
    pourTargetNormX: 0,
    pourTargetNormY: 0,
    pouringStream: null,
    latteZoomTarget: 0,
    latteZoom: 0,
    stencil: 'heart',
    showStencilGuide: true,
    kettleTilting: 0,
    customerMood: 'ordering',
    customerEnter: 0,
    patience: 1,
    waitingGuests: [],
    cats: createInitialCats(),
    servingCupAnim: 0,
    servingAnimating: false,
    tipCoins: [
      { x: -10, y: 18, r: 7, color: '#E8B348', rot: 0.1 },
      { x: 6, y: 19, r: 7, color: '#D4924A', rot: -0.2 },
      { x: -2, y: 12, r: 7, color: '#E8B348', rot: 0.05 },
    ],
    hoveredId: null,
  });

  // Persist save cleanly
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // ignore
    }
  }, [save]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // Auto-fade educational barista tips after 12s
  useEffect(() => {
    if (!activeTip) return;
    const id = window.setTimeout(() => setActiveTip(null), 12000);
    return () => clearTimeout(id);
  }, [activeTip]);

  const surfaceBaristaTip = useCallback(
    (categoryHint?: BaristaTip['category']) => {
      const seen = save.seenTipIds ?? [];
      const pool = categoryHint
        ? BARISTA_TIPS.filter((t) => t.category === categoryHint)
        : BARISTA_TIPS;
      const unseen = pool.filter((t) => !seen.includes(t.id));
      const pickPool = unseen.length > 0 ? unseen : pool;
      const chosen = pickPool[Math.floor(Math.random() * pickPool.length)];
      if (!chosen) return;
      setActiveTip(chosen);
      if (!seen.includes(chosen.id)) {
        setSave((prev) => ({
          ...prev,
          seenTipIds: [...(prev.seenTipIds ?? []), chosen.id],
        }));
      }
    },
    [save.seenTipIds]
  );

  const effectiveWeather: WeatherMood = useMemo(() => {
    if (save.weatherOverride !== 'auto') return save.weatherOverride;
    return DAY_WEATHER[Math.min(5, save.day)] ?? 'sun';
  }, [save.day, save.weatherOverride]);

  const syncUiFlags = useCallback(() => {
    const s = simRef.current;
    const d = s.drink;
    const fill =
      d.espressoShots * 0.17 +
      d.water * 0.65 +
      d.matchaAmount * 0.38 +
      d.cocoaAmount * 0.38 +
      d.milkAmount * 0.82;
    setUiStatus({
      hasCup: Boolean(d.cupStyle),
      canServe: Boolean(d.cupStyle && fill > 0.08 && currentOrder && !evaluation),
      canZoomLatte: Boolean(d.cupStyle && s.pitcher.fill > 0.08),
      inLatteZoom: s.latteZoomTarget > 0.5,
      pouringMode: s.pouringMode,
      stencil: s.stencil,
      showGuide: s.showStencilGuide,
      pitcherFill: s.pitcher.fill,
      pitcherTemp: s.pitcher.tempC,
      isSteaming: s.pitcher.isSteaming,
      shotReady: s.shotCupFill > 0.15,
      whiskReady: s.whiskBowl.readyToPour,
    });
  }, [currentOrder, evaluation]);

  const ensureDayQueue = useCallback(() => {
    if (dayQueueRef.current.length < 3) {
      const indices = CUSTOMERS.map((_, idx) => idx);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      dayQueueRef.current.push(...indices);
    }
  }, []);

  const spawnCustomer = useCallback(
    (dayNum: number, endless: boolean, visitsMap: Record<string, number>) => {
      ensureDayQueue();
      const nextIdx = dayQueueRef.current.shift()!;
      const cust = CUSTOMERS[nextIdx];
      const visitNum = (visitsMap[cust.id] ?? 0) + 1;
      const effectiveDay = endless ? 5 : dayNum;
      const order = generateOrderForDay(effectiveDay, cust, visitNum);

      // Populate up to 2 upcoming guests lounging with the café cats!
      const upcomingIndices = dayQueueRef.current.slice(0, 2);
      const waitingGuests: WaitingGuest[] = upcomingIndices.map((idx, slot) => ({
        id: `${CUSTOMERS[idx].id}_wait_${slot}`,
        customer: CUSTOMERS[idx],
        pettingCooldown: 2 + slot * 2,
        isPetting: slot === 0,
        petHeartTimer: slot === 0 ? 1.0 : 0,
        seatIndex: slot,
      }));

      const s = simRef.current;
      s.customerMood = 'ordering';
      s.customerEnter = 0;
      s.patience = 1.0;
      s.waitingGuests = waitingGuests;
      s.servingCupAnim = 0;
      s.servingAnimating = false;
      setCurrentOrder(order);
      setShowStepHint(false);
      asmrEngine.playOrderBell();
    },
    [ensureDayQueue]
  );

  const resetCupStation = useCallback(() => {
    const s = simRef.current;
    s.drink = emptyDrink();
    s.waveSim.reset();
    s.latteSim.reset();
    s.ripples = [];
    s.iceCubes = [];
    s.latteZoomTarget = 0;
    s.pouringMode = 'none';
    s.isActivelyPouring = false;
    s.servingCupAnim = 0;
    s.servingAnimating = false;
    syncUiFlags();
  }, [syncUiFlags]);

  const handleStartNew = () => {
    asmrEngine.initAndResume();
    asmrEngine.playPageFlip();
    const fresh: GameProgressSave = {
      day: 1,
      endlessMode: false,
      money: 14.0,
      totalTips: 0,
      cupsServed: 0,
      upgradeLevels: {},
      unlockedCups: [],
      seenTipIds: [],
      customerVisits: {},
      seenPrologue: false,
      weatherOverride: 'auto',
    };
    setSave(fresh);
    setServedInDay(0);
    setCurrentOrder(null);
    setEvaluation(null);
    setActiveTip(null);
    resetCupStation();
    setShowTitle(false);
    const prologue = STORY_BEATS.find((b) => b.id === 'prologue') ?? null;
    setActiveBeat(prologue);
  };

  const handleContinue = () => {
    asmrEngine.initAndResume();
    asmrEngine.playPageFlip();
    setShowTitle(false);
    if (!save.seenPrologue) {
      setActiveBeat(STORY_BEATS.find((b) => b.id === 'prologue') ?? null);
    } else if (!currentOrder) {
      spawnCustomer(save.day, save.endlessMode, save.customerVisits);
    }
  };

  const handleDiaryContinue = () => {
    asmrEngine.playPageFlip();
    if (!activeBeat) return;

    if (activeBeat.phase === 'prologue') {
      setSave((prev) => ({ ...prev, seenPrologue: true }));
      const day1Morning = STORY_BEATS.find((b) => b.day === 1 && b.phase === 'morning') ?? null;
      setActiveBeat(day1Morning);
      return;
    }

    if (activeBeat.phase === 'morning') {
      setActiveBeat(null);
      spawnCustomer(save.day, save.endlessMode, save.customerVisits);
      return;
    }

    if (activeBeat.phase === 'evening') {
      if (activeBeat.day >= 5) {
        setSave((prev) => ({ ...prev, day: 6, endlessMode: true }));
        setServedInDay(0);
        setActiveBeat(null);
        spawnCustomer(6, true, save.customerVisits);
      } else {
        const nextDay = activeBeat.day + 1;
        setSave((prev) => ({ ...prev, day: nextDay }));
        setServedInDay(0);
        const nextMorning =
          STORY_BEATS.find((b) => b.day === nextDay && b.phase === 'morning') ?? null;
        setActiveBeat(nextMorning);
      }
    }
  };

  const handleServeDrink = useCallback(() => {
    const s = simRef.current;
    if (!currentOrder || !s.drink.cupStyle || s.servingAnimating) return;

    s.latteZoomTarget = 0;
    s.pouringMode = 'none';
    s.isActivelyPouring = false;
    if (s.pitcher.isSteaming) {
      s.pitcher.isSteaming = false;
      asmrEngine.stopSteam();
    }

    s.drink.latteArtQuality = s.latteSim.computeArtScore();
    s.servingAnimating = true;
    s.customerMood = 'tasting';
    asmrEngine.playCeramicPlace();

    const visitCount = (save.customerVisits[currentOrder.customer.id] ?? 0) + 1;
    const result = evaluateDrink(currentOrder, s.drink, visitCount, s.patience, {
      cremaBonus: shopBonuses.cremaBonus,
      hospitalityBonus: shopBonuses.hospitalityBonus,
    });

    window.setTimeout(() => {
      s.customerMood = result.patienceLeft > 0.3 ? 'delighted' : 'warm_smile';
      asmrEngine.playTipClink(result.stars >= 4 ? 4 : 2);
      const coinCount = Math.min(4, Math.max(1, Math.round(result.tipAmount)));
      for (let c = 0; c < coinCount; c++) {
        if (s.tipCoins.length > 22) s.tipCoins.shift();
        s.tipCoins.push({
          x: (Math.random() - 0.5) * 32,
          y: 22 - Math.min(24, s.tipCoins.length * 1.3),
          r: 6.5,
          color: c % 2 === 0 ? '#E8B348' : '#D9964E',
          rot: (Math.random() - 0.5) * 0.4,
        });
      }

      setSave((prev) => ({
        ...prev,
        money: Math.round((prev.money + result.totalEarned) * 100) / 100,
        totalTips: Math.round((prev.totalTips + result.tipAmount) * 100) / 100,
        cupsServed: prev.cupsServed + 1,
        customerVisits: {
          ...prev.customerVisits,
          [currentOrder.customer.id]: visitCount,
        },
      }));
      setEvaluation(result);
      syncUiFlags();
    }, 650);
  }, [currentOrder, save.customerVisits, shopBonuses.cremaBonus, shopBonuses.hospitalityBonus, syncUiFlags]);

  const handleNextCustomer = () => {
    asmrEngine.playPageFlip();
    setEvaluation(null);
    resetCupStation();
    const nextCount = servedInDay + 1;
    setServedInDay(nextCount);

    // Surface an occasional real-life barista tip every ~2 cups served!
    if ((save.cupsServed % 2 === 1 || Math.random() < 0.4) && !activeTip) {
      surfaceBaristaTip();
    }

    if (!save.endlessMode) {
      const targetForDay = CUSTOMERS_PER_DAY[save.day] ?? 4;
      if (nextCount >= targetForDay) {
        setCurrentOrder(null);
        const eveningBeat =
          STORY_BEATS.find((b) => b.day === save.day && b.phase === 'evening') ?? null;
        if (eveningBeat) {
          setActiveBeat(eveningBeat);
          return;
        }
      }
    }
    spawnCustomer(save.day, save.endlessMode, save.customerVisits);
  };

  // ==================== INTERACTIVE STATION ACTIONS ====================
  const triggerZoneAction = useCallback(
    (zoneId: string) => {
      asmrEngine.initAndResume();
      const s = simRef.current;

      // Interactive Café Cats in the Waiting Lounge!
      if (zoneId.startsWith('cat:')) {
        const catId = zoneId.split(':')[1];
        const cat = s.cats.find((c) => c.id === catId);
        if (cat) {
          cat.state = 'being_petted';
          cat.stateTimer = 2.6;
          cat.happyTimer = 2.6;
          asmrEngine.playCatPurr();
          if (Math.random() < 0.65) {
            asmrEngine.playCatMeow(cat.id === 'sesame' ? 1.24 : cat.id === 'biscuit' ? 0.94 : 1.05);
          }
          for (let i = 0; i < 4; i++) {
            s.particles.push({
              x: cat.x + (Math.random() - 0.5) * 26,
              y: cat.y - 18,
              vx: (Math.random() - 0.5) * 16,
              vy: -24 - Math.random() * 14,
              life: 1.0,
              maxLife: 1.0,
              size: 7.5,
              color: '#E57A86',
              kind: 'heart',
            });
          }
          showToast(`${cat.name} purrs softly in the lounge! 🐾`);
        }
        return;
      }

      if (zoneId.startsWith('cup:')) {
        const cup = zoneId.split(':')[1] as CupStyle;
        if (cup === 'iced_glass' && save.day < 2 && !save.endlessMode) {
          showToast('Tall Iced Glasses unlock on Day 2!');
          return;
        }
        s.drink.cupStyle = cup;
        s.waveSim.splash(0.5, 1.5);
        asmrEngine.playCeramicPlace();
        syncUiFlags();
        return;
      }

      if (zoneId === 'grinder') {
        if (s.grinder.groundProgress < 1) {
          s.grinder.groundProgress = Math.min(1, s.grinder.groundProgress + 0.44 * shopBonuses.grindSpeedBonus);
          asmrEngine.startGrind();
          window.setTimeout(() => {
            if (!holdingGrinderRef.current) asmrEngine.stopGrind();
          }, 260);
        } else {
          showToast('Beans freshly ground! Now press Tamper.');
        }
        return;
      }

      if (zoneId === 'tamper') {
        if (s.grinder.groundProgress < 0.85) {
          showToast('Grind coffee beans first!');
          return;
        }
        s.grinder.tamped = true;
        asmrEngine.playTamp();
        if ((save.seenTipIds ?? []).length === 0) {
          surfaceBaristaTip('Espresso');
        }
        return;
      }

      if (zoneId === 'espresso_pull') {
        if (!s.grinder.tamped) {
          showToast('Grind & tamp espresso grounds first!');
          return;
        }
        if (s.grinder.pullingShot) return;
        s.grinder.pullingShot = true;
        s.grinder.shotProgress = 0;
        asmrEngine.startEspressoPull();
        return;
      }

      if (zoneId === 'pour_espresso_shot') {
        if (!s.drink.cupStyle) {
          showToast('Pick a cup on the rack first!');
          return;
        }
        if (s.shotCupFill < 0.15) return;
        s.shotCupFill = 0;
        s.grinder.groundProgress = 0;
        s.grinder.tamped = false;
        s.drink.espressoShots += 1;

        s.latteSim.setPalette([62, 32, 19], [199, 130, 70], [253, 247, 236]);
        s.latteSim.seedCrema(0.88);
        s.waveSim.splash(0.45, 5.2);
        s.ripples.push({ nx: 0, ny: 0, radius: 0.08, maxRadius: 0.92, alpha: 0.85 });
        s.pouringStream = {
          fromX: 258,
          fromY: 495,
          color: '#733D22',
          width: 6.5,
          timer: 0.65,
        };
        asmrEngine.startPour();
        window.setTimeout(() => asmrEngine.stopPour(), 520);
        syncUiFlags();
        return;
      }

      if (zoneId === 'kettle') {
        if (!s.drink.cupStyle) {
          showToast('Select a cup first!');
          return;
        }
        s.drink.water = Math.min(1, s.drink.water + 0.45);
        s.kettleTilting = 1;
        s.waveSim.splash(0.35, 5.0);
        s.ripples.push({ nx: -0.15, ny: 0, radius: 0.1, maxRadius: 0.9, alpha: 0.8 });
        s.pouringStream = {
          fromX: 432,
          fromY: 505,
          color: '#E6F2F4',
          width: 5.5,
          timer: 0.65,
        };
        asmrEngine.startPour();
        window.setTimeout(() => asmrEngine.stopPour(), 520);
        syncUiFlags();
        return;
      }

      if (zoneId === 'trash_cup') {
        if (!s.drink.cupStyle) return;
        resetCupStation();
        asmrEngine.playCeramicPlace();
        showToast('Cup rinsed clean — ready for a fresh brew!');
        return;
      }

      if (zoneId === 'scoop_matcha' || zoneId === 'scoop_cocoa') {
        if (save.day < 3 && !save.endlessMode) {
          showToast('Matcha & Cocoa Whisk Station unlocks on Day 3!');
          return;
        }
        const kind = zoneId === 'scoop_matcha' ? 'matcha' : 'cocoa';
        s.whiskBowl = {
          powder: kind,
          waterAdded: true,
          whiskProgress: 0.1,
          readyToPour: false,
        };
        asmrEngine.playWhiskSwish(1);
        showToast(`Scooped ${kind}! Click or swirl over the bamboo bowl to whisk.`);
        syncUiFlags();
        return;
      }

      if (zoneId === 'whisk_bowl') {
        if (save.day < 3 && !save.endlessMode) return;
        if (s.whiskBowl.powder === 'none') {
          showToast('Scoop Matcha or Cocoa powder into the bowl first!');
          return;
        }
        if (!s.whiskBowl.readyToPour) {
          s.whiskBowl.whiskProgress = Math.min(1, s.whiskBowl.whiskProgress + 0.34);
          asmrEngine.playWhiskSwish(1.4);
          if (s.whiskBowl.whiskProgress >= 0.98) {
            s.whiskBowl.readyToPour = true;
            showToast('Silky foam ready! Click bowl again to pour into your cup.');
          }
          syncUiFlags();
          return;
        }
        if (!s.drink.cupStyle) {
          showToast('Pick a cup on the rack first!');
          return;
        }
        if (s.whiskBowl.powder === 'matcha') {
          s.drink.matchaAmount += 0.55;
          s.latteSim.setPalette([108, 148, 86], [156, 196, 130], [253, 247, 236]);
          s.latteSim.seedCrema(0.85);
          s.pouringStream = { fromX: 395, fromY: 425, color: '#83AE67', width: 7, timer: 0.65 };
        } else {
          s.drink.cocoaAmount += 0.55;
          s.latteSim.setPalette([86, 48, 32], [134, 82, 56], [253, 247, 236]);
          s.latteSim.seedCrema(0.85);
          s.pouringStream = { fromX: 395, fromY: 425, color: '#6E3F2A', width: 7, timer: 0.65 };
        }
        s.waveSim.splash(0.35, 5.4);
        s.ripples.push({ nx: -0.1, ny: 0, radius: 0.08, maxRadius: 0.95, alpha: 0.85 });
        s.whiskBowl = { powder: 'none', waterAdded: false, whiskProgress: 0, readyToPour: false };
        asmrEngine.startPour();
        window.setTimeout(() => asmrEngine.stopPour(), 500);
        syncUiFlags();
        return;
      }

      if (zoneId.startsWith('milk:')) {
        const m = zoneId.split(':')[1] as MilkType;
        s.pitcher.milkType = m;
        s.pitcher.fill = 1.0;
        s.pitcher.tempC = 12;
        s.pitcher.foamRatio = 0.25;
        s.pitcher.isSteaming = false;
        asmrEngine.stopSteam();
        s.pitcherWave.splash(0.5, 4.5);
        asmrEngine.startPour();
        window.setTimeout(() => asmrEngine.stopPour(), 350);
        showToast(`Poured cold ${MILK_META[m].label} into pitcher!`);
        syncUiFlags();
        return;
      }

      if (zoneId === 'steam_milk') {
        if (s.pitcher.fill < 0.1) {
          showToast('Pour milk from a carton into the pitcher first!');
          return;
        }
        s.pitcher.isSteaming = !s.pitcher.isSteaming;
        if (s.pitcher.isSteaming) {
          asmrEngine.startSteam();
        } else {
          asmrEngine.stopSteam();
          if (s.pitcher.tempC >= 56 && s.pitcher.tempC <= 69) {
            showToast(`Silky ${Math.round(s.pitcher.tempC)}°C microfoam! Click Pitcher to pour!`);
          }
        }
        syncUiFlags();
        return;
      }

      if (zoneId === 'pitcher_pour') {
        if (!s.drink.cupStyle) {
          showToast('Select a cup first!');
          return;
        }
        if (s.pitcher.fill < 0.08) {
          showToast('Fill the milk pitcher first!');
          return;
        }
        if (s.pitcher.isSteaming) {
          s.pitcher.isSteaming = false;
          asmrEngine.stopSteam();
        }
        s.pouringMode = 'pitcher';
        s.latteZoomTarget = 1;
        syncUiFlags();
        return;
      }

      if (zoneId === 'active_cup') {
        if (s.pitcher.fill > 0.08) {
          if (s.pitcher.isSteaming) {
            s.pitcher.isSteaming = false;
            asmrEngine.stopSteam();
          }
          s.pouringMode = 'pitcher';
          s.latteZoomTarget = 1;
          syncUiFlags();
        } else {
          s.waveSim.splash(0.5, 3.6);
          s.ripples.push({ nx: 0, ny: 0, radius: 0.05, maxRadius: 0.85, alpha: 0.7 });
        }
        return;
      }

      if (zoneId === 'exit_latte_zoom') {
        s.latteZoomTarget = 0;
        s.pouringMode = 'none';
        s.isActivelyPouring = false;
        asmrEngine.stopPour();
        syncUiFlags();
        return;
      }

      if (zoneId === 'ice_bucket') {
        if (save.day < 2 && !save.endlessMode) {
          showToast('Ice Bucket unlocks on Day 2!');
          return;
        }
        if (!s.drink.cupStyle) {
          showToast('Pick a Tall Iced Glass first!');
          return;
        }
        if (s.drink.iceCount >= 6) return;
        s.drink.iceCount += 1;
        s.iceCubes.push({
          nx: (Math.random() - 0.5) * 0.75,
          ny: (Math.random() - 0.5) * 0.55,
          depthOffset: Math.random() * 0.6,
          bobPhase: Math.random() * Math.PI * 2,
          angle: (Math.random() - 0.5) * 0.6,
          angVel: 0,
          size: 19 + Math.random() * 4,
          dropAnim: 1,
        });
        s.waveSim.splash(0.5 + (Math.random() - 0.5) * 0.4, 6.4);
        s.ripples.push({ nx: 0, ny: 0, radius: 0.08, maxRadius: 0.9, alpha: 0.9 });
        asmrEngine.playIceDrop();
        syncUiFlags();
        return;
      }

      if (zoneId.startsWith('syrup:')) {
        const syr = zoneId.split(':')[1] as SyrupType;
        const meta = SYRUP_META[syr];
        if (save.day < meta.unlockDay && !save.endlessMode) {
          showToast(`${meta.label} unlocks on Day ${meta.unlockDay}!`);
          return;
        }
        if (!s.drink.cupStyle) {
          showToast('Pick a cup first!');
          return;
        }
        s.drink.syrups[syr] = (s.drink.syrups[syr] ?? 0) + 1;
        s.latteSim.seedSyrupSwirl(hexToRgb(meta.color), 0.45);
        s.waveSim.splash(0.65, 3.8);
        s.ripples.push({ nx: 0.15, ny: 0, radius: 0.05, maxRadius: 0.7, alpha: 0.75 });
        const syrOrder: SyrupType[] = ['vanilla', 'caramel', 'hazelnut', 'strawberry', 'lavender'];
        const syrIdx = Math.max(0, syrOrder.indexOf(syr));
        s.pouringStream = {
          fromX: 981 + syrIdx * 58,
          fromY: 322,
          color: meta.color,
          width: 4.5,
          timer: 0.42,
        };
        asmrEngine.playSyrupPump();
        syncUiFlags();
        return;
      }

      if (zoneId.startsWith('topping:')) {
        const top = zoneId.split(':')[1] as ToppingType;
        if (!s.drink.cupStyle) {
          showToast('Pick a cup first!');
          return;
        }
        if (!s.drink.toppings.includes(top)) {
          s.drink.toppings.push(top);
        }
        asmrEngine.playSprinkle();
        for (let i = 0; i < 12; i++) {
          s.particles.push({
            x: CUP_CENTER.x + (Math.random() - 0.5) * 58,
            y: CUP_CENTER.y - 105 + (Math.random() - 0.5) * 18,
            vx: (Math.random() - 0.5) * 14,
            vy: 35 + Math.random() * 28,
            life: 0.75,
            maxLife: 0.75,
            size: top === 'whipped_cream' ? 4 : 2.2,
            color:
              top === 'matcha_dust'
                ? '#78A35F'
                : top === 'cinnamon'
                ? '#A45A32'
                : top === 'whipped_cream'
                ? '#FFFDF7'
                : '#643825',
            kind: 'dust',
          });
        }
        syncUiFlags();
        return;
      }

      if (zoneId === 'serve_coaster') {
        handleServeDrink();
      }
    },
    [
      handleServeDrink,
      resetCupStation,
      save.day,
      save.endlessMode,
      save.seenTipIds,
      shopBonuses.grindSpeedBonus,
      showToast,
      surfaceBaristaTip,
      syncUiFlags,
    ]
  );

  const handleQuickAutoPourMilk = () => {
    const s = simRef.current;
    if (!s.drink.cupStyle || s.pitcher.fill < 0.05) return;
    asmrEngine.initAndResume();
    asmrEngine.startPour();
    s.drink.milkType = s.pitcher.milkType;
    s.drink.milkAmount = Math.min(0.75, s.drink.milkAmount + s.pitcher.fill * 0.65);
    s.drink.milkTempC = s.pitcher.tempC;
    if (s.pitcher.tempC > 40) s.drink.milkWasSteamed = true;

    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 1.6;
      const nx = Math.cos(a) * 0.28 * (1 - i / steps);
      const ny = Math.sin(a) * 0.25;
      s.latteSim.injectMilkPour(nx, ny, Math.cos(a + 1) * 0.8, Math.sin(a + 1) * 0.8, s.pitcher.foamRatio, 0.14);
    }
    s.waveSim.splash(0.5, 4.8);
    s.ripples.push({ nx: 0, ny: 0, radius: 0.1, maxRadius: 0.95, alpha: 0.85 });
    s.pitcher.fill = 0;
    window.setTimeout(() => asmrEngine.stopPour(), 420);
    syncUiFlags();
  };

  // ==================== 60FPS ANIMATION LOOP ====================
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const timeSec = now / 1000;

      const s = simRef.current;

      // 1. Camera zoom, customer entrance & serving animation
      s.latteZoom += (s.latteZoomTarget - s.latteZoom) * Math.min(1, dt * 8);
      s.customerEnter = Math.min(1, s.customerEnter + dt * 2.2);
      s.kettleTilting = Math.max(0, s.kettleTilting - dt * 1.8);
      if (s.servingAnimating) {
        s.servingCupAnim = Math.min(1, s.servingCupAnim + dt * 2.1);
      }

      // 2. Time-based Customer Patience Drain (pauses kindly when browsing modals!)
      const isPausedForModal = Boolean(showTitle || activeBeat || showRecipes || showShop || evaluation);
      if (currentOrder && !isPausedForModal && !s.servingAnimating) {
        const totalPatienceSec = 72 * shopBonuses.patienceMultiplier;
        s.patience = Math.max(0, s.patience - dt / totalPatienceSec);
        if (s.patience <= 0.2) {
          s.customerMood = 'frustrated';
        } else if (s.patience <= 0.48) {
          s.customerMood = 'impatient';
        } else {
          s.customerMood = 'ordering';
        }
      }

      // 3. Autonomous Café Cats & Waiting Lounge Customers!
      const catTier = save.upgradeLevels.cat_lounge ?? 0;
      s.cats.forEach((cat) => {
        if (cat.unlockTierRequired > catTier) return;
        cat.happyTimer = Math.max(0, cat.happyTimer - dt);
        cat.stateTimer -= dt;
        if (cat.state === 'walking') {
          const dx = cat.targetX - cat.x;
          if (Math.abs(dx) < 3) {
            cat.state = 'loaf';
            cat.stateTimer = 2.5 + Math.random() * 4;
          } else {
            cat.facing = dx > 0 ? 1 : -1;
            cat.x += Math.sign(dx) * dt * 22;
          }
        } else if (cat.stateTimer <= 0) {
          cat.state = 'walking';
          cat.targetX = 56 + Math.random() * 212;
          cat.stateTimer = 4 + Math.random() * 3;
        }
      });

      s.waitingGuests.forEach((wg, idx) => {
        const seatX = 92 + wg.seatIndex * 108;
        wg.petHeartTimer = Math.max(0, wg.petHeartTimer - dt);
        if (wg.petHeartTimer <= 0 && Math.random() < 0.008) {
          wg.isPetting = true;
          wg.petHeartTimer = 1.4;
          const loungeCat = s.cats.find((c) => c.unlockTierRequired <= catTier && Math.abs(c.x - seatX) < 95);
          if (loungeCat) {
            loungeCat.happyTimer = 1.8;
            if (idx === 0 && Math.random() < 0.35 && !showTitle) {
              asmrEngine.playCatPurr();
            }
          }
        } else if (wg.petHeartTimer <= 0.1) {
          wg.isPetting = Math.random() < 0.35 ? wg.isPetting : false;
        }
      });

      // 4. Active hold grinding
      if (holdingGrinderRef.current && s.grinder.groundProgress < 1) {
        s.grinder.groundProgress = Math.min(1, s.grinder.groundProgress + dt * 0.58 * shopBonuses.grindSpeedBonus);
      }

      // 5. Espresso Extraction simulation
      if (s.grinder.pullingShot) {
        s.grinder.shotProgress = Math.min(1, s.grinder.shotProgress + dt * 0.56 * shopBonuses.grindSpeedBonus);
        s.shotCupFill = s.grinder.shotProgress;
        if (s.grinder.shotProgress >= 1) {
          s.grinder.pullingShot = false;
          asmrEngine.stopEspressoPull();
          syncUiFlags();
        }
      }

      // 6. Milk Steaming vortex & temperature sweep
      if (s.pitcher.isSteaming && s.pitcher.fill > 0.05) {
        s.pitcher.tempC = Math.min(76, s.pitcher.tempC + dt * 11.5 * shopBonuses.steamSpeedBonus);
        s.pitcher.foamRatio = Math.min(1, s.pitcher.foamRatio + dt * 0.22 * shopBonuses.steamSpeedBonus);
        s.pitcherWave.splash(0.5 + Math.sin(timeSec * 14) * 0.25, 1.4);
        asmrEngine.updateSteamTemp(s.pitcher.tempC);
        if (s.pitcher.tempC >= 74) {
          s.pitcher.isSteaming = false;
          asmrEngine.stopSteam();
          syncUiFlags();
        }
      }

      // 7. Interactive Latte Art Milk Pouring!
      if (s.latteZoom > 0.5 && s.isActivelyPouring && s.pouringMode === 'pitcher' && s.pitcher.fill > 0.005) {
        const rate = dt * 0.28;
        const used = Math.min(s.pitcher.fill, rate);
        s.pitcher.fill -= used;
        s.drink.milkType = s.pitcher.milkType;
        s.drink.milkAmount = Math.min(0.85, s.drink.milkAmount + used * 0.72);
        s.drink.milkTempC = s.pitcher.tempC;
        if (s.pitcher.tempC > 40) s.drink.milkWasSteamed = true;

        s.latteSim.injectMilkPour(
          s.pourTargetNormX,
          s.pourTargetNormY,
          0,
          0,
          s.pitcher.tempC > 40 ? Math.max(0.45, s.pitcher.foamRatio) : 0.18,
          dt * 2.8
        );
        s.waveSim.splash(s.pourTargetNormX * 0.5 + 0.5, 1.8 * dt * 20);
        if (Math.random() < 0.22) {
          s.ripples.push({
            nx: s.pourTargetNormX,
            ny: s.pourTargetNormY,
            radius: 0.04,
            maxRadius: 0.55,
            alpha: 0.65,
          });
        }
        asmrEngine.updatePourLevel(s.drink.milkAmount);
        setUiStatus((prev) =>
          Math.abs(prev.pitcherFill - s.pitcher.fill) > 0.03
            ? { ...prev, pitcherFill: s.pitcher.fill }
            : prev
        );
        if (s.pitcher.fill <= 0.005) {
          s.isActivelyPouring = false;
          asmrEngine.stopPour();
          syncUiFlags();
        }
      }

      // 8. Pour Stream timer & Fluid Physics step
      if (s.pouringStream) {
        s.pouringStream.timer -= dt;
        if (s.pouringStream.timer <= 0) s.pouringStream = null;
      }

      s.waveSim.step(dt);
      s.pitcherWave.step(dt);
      s.latteSim.step(dt);

      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const r = s.ripples[i];
        r.radius += dt * 0.75;
        r.alpha -= dt * 0.9;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) s.ripples.splice(i, 1);
      }

      for (const ice of s.iceCubes) {
        ice.angle += Math.sin(timeSec * 1.8 + ice.bobPhase) * 0.15 * dt;
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // 9. Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const targetW = Math.round(1280 * dpr);
          const targetH = Math.round(720 * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          ctx.save();
          ctx.scale(dpr, dpr);
          const sceneState: SceneRenderState = {
            width: 1280,
            height: 720,
            time: timeSec,
            day: save.day,
            weather: effectiveWeather,
            upgradeLevels: save.upgradeLevels,
            unlockedCups: save.unlockedCups,
            pointerX: lastPointerRef.current.x,
            pointerY: lastPointerRef.current.y,
            hoveredId: s.hoveredId,
            order: currentOrder,
            customerMood: s.customerMood,
            customerEnter: s.customerEnter,
            patience: s.patience,
            waitingGuests: s.waitingGuests,
            cats: s.cats,
            drink: s.drink,
            waveSim: s.waveSim,
            latteSim: s.latteSim,
            pitcherWave: s.pitcherWave,
            ripples: s.ripples,
            iceCubes: s.iceCubes,
            particles: s.particles,
            grinder: s.grinder,
            shotCupFill: s.shotCupFill,
            whiskBowl: s.whiskBowl,
            pitcher: s.pitcher,
            pouringMode: s.pouringMode,
            isActivelyPouring: s.isActivelyPouring,
            pourTargetNormX: s.pourTargetNormX,
            pourTargetNormY: s.pourTargetNormY,
            pouringStream: s.pouringStream,
            latteZoom: s.latteZoom,
            stencil: s.stencil,
            showStencilGuide: s.showStencilGuide,
            kettleTilting: s.kettleTilting,
            tipCoins: s.tipCoins,
            servingCupAnim: s.servingCupAnim,
          };
          renderCafeScene(ctx, sceneState);
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeBeat,
    currentOrder,
    effectiveWeather,
    evaluation,
    save.day,
    save.unlockedCups,
    save.upgradeLevels,
    shopBonuses.patienceMultiplier,
    shopBonuses.grindSpeedBonus,
    shopBonuses.steamSpeedBonus,
    showRecipes,
    showShop,
    showTitle,
    syncUiFlags,
  ]);

  // ==================== POINTER MAPPING ON 2.5D CANVAS ====================
  const toLogical = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 640, y: 360 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 1280,
      y: ((clientY - rect.top) / rect.height) * 720,
    };
  };

  const findZoneAt = (lx: number, ly: number): HitZone | null => {
    const s = simRef.current;
    const zones = computeHitZones({
      width: 1280,
      height: 720,
      time: 0,
      day: save.day,
      weather: effectiveWeather,
      upgradeLevels: save.upgradeLevels,
      unlockedCups: save.unlockedCups,
      pointerX: lx,
      pointerY: ly,
      hoveredId: null,
      order: currentOrder,
      customerMood: s.customerMood,
      customerEnter: 1,
      patience: s.patience,
      waitingGuests: s.waitingGuests,
      cats: s.cats,
      drink: s.drink,
      waveSim: s.waveSim,
      latteSim: s.latteSim,
      pitcherWave: s.pitcherWave,
      ripples: s.ripples,
      iceCubes: s.iceCubes,
      particles: s.particles,
      grinder: s.grinder,
      shotCupFill: s.shotCupFill,
      whiskBowl: s.whiskBowl,
      pitcher: s.pitcher,
      pouringMode: s.pouringMode,
      isActivelyPouring: s.isActivelyPouring,
      pourTargetNormX: 0,
      pourTargetNormY: 0,
      pouringStream: null,
      latteZoom: s.latteZoom,
      stencil: s.stencil,
      showStencilGuide: s.showStencilGuide,
      kettleTilting: 0,
      tipCoins: s.tipCoins,
      servingCupAnim: 0,
    });
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i];
      if (lx >= z.x && lx <= z.x + z.w && ly >= z.y && ly <= z.y + z.h) {
        return z;
      }
    }
    return null;
  };

  const updateLattePointerNorm = (lx: number, ly: number) => {
    const s = simRef.current;
    if (!s.drink.cupStyle) return { nx: 0, ny: 0 };
    const cupX = 595;
    const cupY = 505;
    const cupScale = 1.68;
    const tiltPitch = 0.74;
    const g = getCupGeometry(s.drink.cupStyle, cupX, cupY, cupScale, tiltPitch);
    const fill =
      s.drink.espressoShots * 0.17 +
      s.drink.water * 0.65 +
      s.drink.matchaAmount * 0.38 +
      s.drink.cocoaAmount * 0.38 +
      s.drink.milkAmount * 0.82;
    const surfY = g.meta.isGlass
      ? g.baseY - 8 * cupScale - fill * (g.height - 16 * cupScale)
      : g.topY + (1 - Math.min(1, Math.max(0.15, fill) / 0.85)) * (g.height * 0.42);
    const nx = Math.max(-0.85, Math.min(0.85, (lx - g.cx) / g.topRx));
    const ny = Math.max(-0.85, Math.min(0.85, (ly - surfY) / g.topRy));
    return { nx, ny };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toLogical(e.clientX, e.clientY);
    const prev = lastPointerRef.current;
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    lastPointerRef.current = pt;

    const s = simRef.current;
    const zone = findZoneAt(pt.x, pt.y);
    s.hoveredId = zone?.id ?? null;
    if (zone) {
      setHoverTip({ label: zone.label, sub: zone.sublabel });
    } else {
      setHoverTip(null);
    }

    if (
      pointerDownRef.current &&
      zone?.id === 'whisk_bowl' &&
      s.whiskBowl.powder !== 'none' &&
      !s.whiskBowl.readyToPour
    ) {
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        s.whiskBowl.whiskProgress = Math.min(1, s.whiskBowl.whiskProgress + dist * 0.0045);
        asmrEngine.playWhiskSwish(dist * 0.08);
        if (s.whiskBowl.whiskProgress >= 0.98) {
          s.whiskBowl.readyToPour = true;
          syncUiFlags();
        }
      }
    }

    if (s.latteZoom > 0.5 && s.drink.cupStyle) {
      const { nx, ny } = updateLattePointerNorm(pt.x, pt.y);
      const prevNx = s.pourTargetNormX;
      const prevNy = s.pourTargetNormY;
      s.pourTargetNormX = nx;
      s.pourTargetNormY = ny;

      if (pointerDownRef.current && s.pouringMode === 'etch') {
        s.latteSim.etchDrag(nx, ny, (nx - prevNx) * 1.4, (ny - prevNy) * 1.4);
        s.drink.latteArtBrushStrokes += 1;
      } else if (pointerDownRef.current && s.pouringMode === 'pitcher' && s.isActivelyPouring) {
        s.latteSim.injectMilkPour(nx, ny, (nx - prevNx) * 1.5, (ny - prevNy) * 1.5, s.pitcher.foamRatio, 0.03);
        s.drink.latteArtBrushStrokes += 1;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    asmrEngine.initAndResume();
    pointerDownRef.current = true;
    const pt = toLogical(e.clientX, e.clientY);
    lastPointerRef.current = pt;

    const s = simRef.current;
    const zone = findZoneAt(pt.x, pt.y);
    if (!zone) return;

    if (s.latteZoom > 0.5 && zone.id === 'latte_surface') {
      const { nx, ny } = updateLattePointerNorm(pt.x, pt.y);
      s.pourTargetNormX = nx;
      s.pourTargetNormY = ny;
      if (s.pouringMode === 'pitcher' && s.pitcher.fill > 0.005) {
        s.isActivelyPouring = true;
        asmrEngine.startPour();
      }
      return;
    }

    if (zone.id === 'grinder') {
      holdingGrinderRef.current = true;
      asmrEngine.startGrind();
    }
    triggerZoneAction(zone.id);
  };

  const handlePointerUp = () => {
    pointerDownRef.current = false;
    if (holdingGrinderRef.current) {
      holdingGrinderRef.current = false;
      asmrEngine.stopGrind();
    }
    const s = simRef.current;
    if (s.isActivelyPouring) {
      s.isActivelyPouring = false;
      asmrEngine.stopPour();
    }
  };

  const handleBuyUpgrade = (trackId: UpgradeTrackId, nextTier: number, price: number) => {
    if (save.money < price) return;
    asmrEngine.playTipClink(4);
    setSave((prev) => ({
      ...prev,
      money: Math.round((prev.money - price) * 100) / 100,
      upgradeLevels: {
        ...prev.upgradeLevels,
        [trackId]: nextTier,
      },
    }));
  };

  const handleBuyCup = (cupId: string, price: number) => {
    if (save.money < price || save.unlockedCups.includes(cupId)) return;
    asmrEngine.playTipClink(3);
    setSave((prev) => ({
      ...prev,
      money: Math.round((prev.money - price) * 100) / 100,
      unlockedCups: [...prev.unlockedCups, cupId],
    }));
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#2E211A] overflow-hidden">
      {/* Main Responsive 16:9 2.5D Pictorial Stage */}
      <div className="relative w-full h-full max-w-[1440px] max-h-[810px] aspect-video flex items-center justify-center shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full object-contain rounded-lg cursor-pointer touch-none"
        />

        {/* ==================== TOP HUD BAR ==================== */}
        {!showTitle && (
          <div className="pointer-events-none absolute top-2.5 left-3 right-3 flex items-start justify-between gap-2 z-20">
            <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
              <div className="sketch-card px-3.5 py-1.5 flex items-center gap-2.5 text-sm">
                <Coffee className="w-4 h-4 text-[#C96C50]" />
                <span className="font-sketch text-lg text-[#3B2318]">
                  {save.endlessMode ? 'Cozy Endless Café' : `Day ${save.day} of 5`}
                </span>
                {!save.endlessMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFE1CA] text-[#6B4F41] font-semibold">
                    Guest {Math.min(servedInDay + 1, CUSTOMERS_PER_DAY[save.day] ?? 4)}/
                    {CUSTOMERS_PER_DAY[save.day] ?? 4}
                  </span>
                )}
              </div>

              <div className="sketch-card px-3 py-1.5 flex items-center gap-2 text-sm">
                <span className="font-sketch text-lg text-[#486B3E]">${save.money.toFixed(2)}</span>
                <span className="text-[11px] text-[#7A5E4B]">
                  (Tips: ${save.totalTips.toFixed(2)})
                </span>
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => {
                  asmrEngine.playPageFlip();
                  setShowRecipes(true);
                }}
                className="sketch-btn px-3 py-1.5 text-sm flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-[#C96C50]" />
                <span className="hidden sm:inline">Recipes &amp; Guide</span>
              </button>

              <button
                onClick={() => {
                  asmrEngine.playPageFlip();
                  setShowShop(true);
                }}
                className="sketch-btn px-3 py-1.5 text-sm flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4 text-[#7F9A78]" />
                <span className="hidden sm:inline">Upgrades</span>
              </button>

              <button
                onClick={() => {
                  asmrEngine.initAndResume();
                  setShowMixer((v) => !v);
                }}
                className="sketch-btn px-3 py-1.5 text-sm flex items-center gap-1.5"
                title="Calm Café ASMR Mixer"
              >
                {audioMix.masterMuted ? (
                  <VolumeX className="w-4 h-4 text-[#9A5E4C]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#5D8799]" />
                )}
                <span className="hidden sm:inline">ASMR</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== CUSTOMER SPEECH & ORDER STICKY NOTE ==================== */}
        {!showTitle && !activeBeat && currentOrder && !uiStatus.inLatteZoom && (
          <div className="pointer-events-auto absolute top-14 right-3 sm:right-5 w-[270px] sm:w-[320px] z-20">
            <div className="sketch-card washi-tape p-3 sm:p-3.5 text-xs sm:text-sm bg-[#FFFDF6]/95">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-sketch text-lg text-[#3B2318] leading-none">
                    {currentOrder.customer.name}
                  </span>
                  <span className="block text-[11px] text-[#8C6D58]">
                    {currentOrder.customer.title}
                  </span>
                </div>
                <button
                  onClick={() => setShowStepHint((v) => !v)}
                  className="sketch-btn px-2 py-0.5 text-[11px] flex items-center gap-1"
                  title="Show Nana's step-by-step hint"
                >
                  <HelpCircle className="w-3 h-3" /> Steps
                </button>
              </div>

              <p className="mt-1.5 text-[#4E372D] leading-snug italic">
                “{currentOrder.dialogue}”
              </p>

              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#EFE1CA] border border-[#C6AF8B] font-bold text-[#3B2318] text-[11px] sm:text-xs flex items-center gap-1.5">
                <NotebookPen className="w-3.5 h-3.5 text-[#C96C50] shrink-0" />
                <span>{currentOrder.plainOrderSummary}</span>
              </div>

              {showStepHint && (
                <div className="mt-1.5 p-2 rounded-lg bg-[#E4EED8] border border-[#7F9A78] text-[11px] text-[#354B2F]">
                  <strong>Nana’s Note:</strong> {currentOrder.recipe.sketchHint}
                </div>
              )}

              {uiStatus.canServe && (
                <button
                  onClick={handleServeDrink}
                  className="sketch-btn sketch-btn-sage w-full mt-2 py-1.5 text-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Serve Drink to{' '}
                  {currentOrder.customer.name.startsWith('Captain') ||
                  currentOrder.customer.name.startsWith('Grandpa')
                    ? currentOrder.customer.name
                    : currentOrder.customer.name.split(' ')[0]}
                  !
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================== OCCASIONAL REAL BARISTA TIP CARD ==================== */}
        {!showTitle && !activeBeat && !showRecipes && !showShop && activeTip && !uiStatus.inLatteZoom && (
          <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[430px] max-w-[92vw]">
            <BaristaTipCard tip={activeTip} onDismiss={() => setActiveTip(null)} />
          </div>
        )}

        {/* ==================== LATTE ART ZOOM MODE FLOATING TOOLBAR ==================== */}
        {uiStatus.inLatteZoom && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 max-w-2xl px-3">
            <div className="sketch-card px-3 py-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                onClick={() => {
                  simRef.current.pouringMode = 'pitcher';
                  syncUiFlags();
                }}
                className={`sketch-btn px-3 py-1 flex items-center gap-1 ${
                  uiStatus.pouringMode === 'pitcher' ? 'sketch-btn-primary' : ''
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                Pour Milk ({Math.round(uiStatus.pitcherFill * 100)}%)
              </button>

              <button
                onClick={() => {
                  simRef.current.pouringMode = 'etch';
                  syncUiFlags();
                }}
                className={`sketch-btn px-3 py-1 flex items-center gap-1 ${
                  uiStatus.pouringMode === 'etch' ? 'sketch-btn-primary' : ''
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Etch Skewer
              </button>

              <button
                onClick={handleQuickAutoPourMilk}
                disabled={uiStatus.pitcherFill < 0.05}
                className="sketch-btn sketch-btn-sage px-3 py-1"
                title="Quickly swirl the rest of the pitcher into the cup"
              >
                Quick Swirl
              </button>

              <div className="flex items-center gap-1 pl-1 border-l border-[#CBB494]">
                <span className="text-[11px] font-semibold text-[#6B4F41]">Guide:</span>
                {(['heart', 'tulip', 'bear', 'swirl', 'free'] as LatteStencil[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      simRef.current.stencil = st;
                      simRef.current.showStencilGuide = st !== 'free';
                      syncUiFlags();
                    }}
                    className={`sketch-btn px-2 py-0.5 text-[11px] capitalize ${
                      uiStatus.stencil === st ? 'bg-[#F5D697]' : ''
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => triggerZoneAction('exit_latte_zoom')}
                className="sketch-btn px-3 py-1 font-bold"
              >
                Done ✓
              </button>
            </div>
          </div>
        )}

        {/* ==================== STATION HOVER TOOLTIP & STATUS TOAST ==================== */}
        {!uiStatus.inLatteZoom && hoverTip && !showTitle && !showRecipes && !showShop && !activeBeat && !evaluation && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="sketch-card px-4 py-1 text-center text-xs sm:text-sm bg-[#FFFDF7]/95">
              <strong className="font-sketch text-base text-[#3B2318]">{hoverTip.label}</strong>
              {hoverTip.sub && <span className="ml-2 text-[#7A5D4B]">• {hoverTip.sub}</span>}
            </div>
          </div>
        )}

        {toastMsg && (
          <div
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 ${
              activeTip ? 'bottom-14' : 'top-16'
            }`}
          >
            <div className="sketch-card px-4 py-1.5 text-sm font-sketch text-[#3B2318] bg-[#FFF8E8]">
              {toastMsg}
            </div>
          </div>
        )}

        {!showTitle && !uiStatus.inLatteZoom && uiStatus.canZoomLatte && (
          <button
            onClick={() => triggerZoneAction('pitcher_pour')}
            className="pointer-events-auto absolute bottom-3 right-4 z-20 sketch-btn sketch-btn-primary px-3.5 py-1.5 text-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Pour Milk &amp; Latte Art
          </button>
        )}

        {!showTitle && !uiStatus.inLatteZoom && uiStatus.hasCup && (
          <button
            onClick={() => triggerZoneAction('trash_cup')}
            className="pointer-events-auto absolute bottom-3 left-4 z-20 sketch-btn px-2.5 py-1 text-xs flex items-center gap-1 opacity-85 hover:opacity-100"
            title="Rinse cup and start over"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Rinse Cup
          </button>
        )}
      </div>

      {/* ==================== MODALS & OVERLAYS ==================== */}
      {showTitle && (
        <TitleScreen save={save} onStartNew={handleStartNew} onContinue={handleContinue} />
      )}

      {!showTitle && activeBeat && (
        <StoryDiaryModal beat={activeBeat} onContinue={handleDiaryContinue} />
      )}

      {showRecipes && (
        <RecipeBookModal
          currentDay={save.day}
          endlessMode={save.endlessMode}
          onClose={() => {
            asmrEngine.playPageFlip();
            setShowRecipes(false);
          }}
        />
      )}

      {showShop && (
        <ShopModal
          money={save.money}
          upgradeLevels={save.upgradeLevels}
          unlockedCups={save.unlockedCups}
          endlessMode={save.endlessMode}
          weatherOverride={save.weatherOverride}
          onBuyUpgrade={handleBuyUpgrade}
          onBuyCup={handleBuyCup}
          onSetWeather={(w) => setSave((prev) => ({ ...prev, weatherOverride: w }))}
          onClose={() => {
            asmrEngine.playPageFlip();
            setShowShop(false);
          }}
        />
      )}

      {showMixer && (
        <AudioMixerPopover
          mix={audioMix}
          onChange={(next) => setAudioMix(asmrEngine.setMix(next))}
          onClose={() => setShowMixer(false)}
        />
      )}

      {evaluation && currentOrder && (
        <ReceiptToast
          customer={currentOrder.customer}
          evaluation={evaluation}
          onNext={handleNextCustomer}
        />
      )}
    </div>
  );
}
