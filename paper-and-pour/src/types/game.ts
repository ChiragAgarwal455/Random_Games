export type CupStyle =
  | 'ceramic_mug'
  | 'iced_glass'
  | 'latte_bowl'
  | 'kraft_cup'
  | 'cat_mug'
  | 'frog_mug'
  | 'owl_mug';

export type MilkType = 'none' | 'whole' | 'oat' | 'almond';

export type SyrupType =
  | 'vanilla'
  | 'caramel'
  | 'hazelnut'
  | 'strawberry'
  | 'lavender';

export type ToppingType =
  | 'cinnamon'
  | 'cocoa_dust'
  | 'matcha_dust'
  | 'whipped_cream'
  | 'caramel_drizzle'
  | 'cookie';

export type BasePowderType = 'none' | 'matcha' | 'cocoa';

export type LatteStencil = 'free' | 'heart' | 'tulip' | 'bear' | 'swirl';

export type WeatherMood = 'rain' | 'mist' | 'sun' | 'dusk';

export type CustomerMood =
  | 'entering'
  | 'ordering'
  | 'waiting'
  | 'impatient'
  | 'frustrated'
  | 'tasting'
  | 'delighted'
  | 'warm_smile'
  | 'leaving';

export type CustomerSpecies =
  | 'bear'
  | 'bunny'
  | 'cat'
  | 'fox'
  | 'duck'
  | 'tortoise'
  | 'owl';

export interface DrinkRecipe {
  id: string;
  name: string;
  subtitle: string;
  unlockDay: number;
  basePrice: number;
  preferredCup: CupStyle[];
  isIced: boolean;
  espressoShots: number;
  waterAmount: number;
  powder: BasePowderType;
  powderWhisked: boolean;
  milkAmount: number;
  milkSteamed: boolean;
  milkType?: MilkType;
  syrups: Partial<Record<SyrupType, number>>;
  iceCount: number;
  toppings: ToppingType[];
  prefersLatteArt: boolean;
  sketchHint: string;
  colorSwatch: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  title: string;
  species: CustomerSpecies;
  accentColor: string;
  scarfOrOutfitColor: string;
  introLines: string[];
  visitLines: Record<number, string>;
  happyLines: string[];
  creativeLines: string[];
  impatientLines: string[];
  favoriteDrinkIds: string[];
}

export interface ActiveOrder {
  id: string;
  customer: CustomerProfile;
  recipe: DrinkRecipe;
  requestedMilk: MilkType;
  requestedSyrup?: SyrupType;
  requestedTopping?: ToppingType;
  dialogue: string;
  plainOrderSummary: string;
  visitNumber: number;
}

export interface WaitingGuest {
  id: string;
  customer: CustomerProfile;
  pettingCooldown: number;
  isPetting: boolean;
  petHeartTimer: number;
  seatIndex: number; // 0 or 1 in waiting lounge
}

export interface CafeCat {
  id: string;
  name: string;
  coat: 'calico' | 'ginger' | 'tuxedo';
  x: number;
  y: number;
  targetX: number;
  facing: 1 | -1;
  state: 'loaf' | 'walking' | 'playing' | 'being_petted';
  happyTimer: number;
  tailPhase: number;
  unlockTierRequired: number; // 0 = always present, 1 = cat lounge T1, 3 = cat lounge T3
}

export interface TipBreakdownLine {
  label: string;
  amount: number;
  positive: boolean;
}

export interface ServeEvaluation {
  basePay: number;
  tipAmount: number;
  totalEarned: number;
  stars: number;
  headline: string;
  customerReply: string;
  lines: TipBreakdownLine[];
  latteArtScore: number;
  patienceLeft: number; // 0..1
}

export interface PitcherState {
  milkType: MilkType;
  fill: number;
  tempC: number;
  foamRatio: number;
  isSteaming: boolean;
  tiltAngle: number;
}

export interface GrinderState {
  groundProgress: number;
  tamped: boolean;
  lockedInMachine: boolean;
  pullingShot: boolean;
  shotProgress: number;
}

export interface WhiskBowlState {
  powder: BasePowderType;
  waterAdded: boolean;
  whiskProgress: number;
  readyToPour: boolean;
}

export interface ActiveDrinkContents {
  cupStyle: CupStyle | null;
  espressoShots: number;
  water: number;
  matchaAmount: number;
  cocoaAmount: number;
  milkType: MilkType;
  milkAmount: number;
  milkWasSteamed: boolean;
  milkTempC: number;
  foamCoverage: number;
  syrups: Partial<Record<SyrupType, number>>;
  iceCount: number;
  toppings: ToppingType[];
  latteArtBrushStrokes: number;
  latteArtQuality: number;
}

export type UpgradeTrackId =
  | 'lighting'
  | 'greenery'
  | 'cat_lounge'
  | 'wall_art'
  | 'music_corner'
  | 'counter_charm'
  | 'equipment'
  | 'patience_cushions';

export interface ShopTierInfo {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  price: number;
  perkLabel?: string;
}

export interface UpgradeTrack {
  id: UpgradeTrackId;
  categoryName: string;
  iconTag: string;
  tiers: [ShopTierInfo, ShopTierInfo, ShopTierInfo];
}

export interface CollectibleCupItem {
  id: string;
  cupStyle: CupStyle;
  name: string;
  description: string;
  price: number;
}

export interface BaristaTip {
  id: string;
  category: 'Espresso' | 'Milk & Foam' | 'Latte Art' | 'Matcha & Tea' | 'Café Craft';
  title: string;
  fact: string;
  proTrick: string;
}

export interface StoryBeat {
  id: string;
  day: number;
  phase: 'prologue' | 'morning' | 'evening';
  title: string;
  dateLabel: string;
  paragraphs: string[];
  nanaQuote?: string;
  unlockedItemsText?: string;
  sketchTag: 'apron' | 'rain_window' | 'ice_glass' | 'matcha_whisk' | 'fairy_lights' | 'portrait';
}

export interface AudioMixSettings {
  masterMuted: boolean;
  rain: number;
  ambience: number;
  music: number;
  foley: number;
}

export interface GameProgressSave {
  day: number;
  endlessMode: boolean;
  money: number;
  totalTips: number;
  cupsServed: number;
  upgradeLevels: Partial<Record<UpgradeTrackId, number>>; // 0..3
  unlockedCups: string[]; // cup ids e.g. 'cat_mug', 'frog_mug', 'owl_mug'
  seenTipIds?: string[];
  customerVisits: Record<string, number>;
  seenPrologue: boolean;
  weatherOverride: WeatherMood | 'auto';
}
