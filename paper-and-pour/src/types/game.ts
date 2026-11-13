export type CupStyle =
  | 'ceramic_mug'
  | 'iced_glass'
  | 'latte_bowl'
  | 'kraft_cup'
  | 'cat_mug'
  | 'frog_mug';

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
  espressoShots: number; // 0, 1, or 2
  waterAmount: number; // 0..1 (for Americano or matcha whisking)
  powder: BasePowderType;
  powderWhisked: boolean;
  milkAmount: number; // 0..1
  milkSteamed: boolean;
  milkType?: MilkType; // undefined means any milk works, specific means requested
  syrups: Partial<Record<SyrupType, number>>; // pumps
  iceCount: number; // 0 for hot, ~3-5 for iced
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
  visitLines: Record<number, string>; // day or visit count flavor line
  happyLines: string[];
  creativeLines: string[];
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

export interface TipBreakdownLine {
  label: string;
  amount: number;
  positive: boolean;
}

export interface ServeEvaluation {
  basePay: number;
  tipAmount: number;
  totalEarned: number;
  stars: number; // 1..5
  headline: string;
  customerReply: string;
  lines: TipBreakdownLine[];
  latteArtScore: number; // 0..1
}

export interface PitcherState {
  milkType: MilkType;
  fill: number; // 0..1
  tempC: number; // 12 (cold) .. 80 (scalded); sweet spot 58..67
  foamRatio: number; // 0..1
  isSteaming: boolean;
  tiltAngle: number;
}

export interface GrinderState {
  groundProgress: number; // 0..1 (beans in portafilter)
  tamped: boolean;
  lockedInMachine: boolean;
  pullingShot: boolean;
  shotProgress: number; // 0..1
}

export interface WhiskBowlState {
  powder: BasePowderType;
  waterAdded: boolean;
  whiskProgress: number; // 0..1
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
  latteArtQuality: number; // computed from 2D fluid surface contrast & pattern coverage
}

export interface DecorItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'decor' | 'cup';
  cupStyle?: CupStyle;
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
  rain: number; // 0..1
  ambience: number; // 0..1
  music: number; // 0..1
  foley: number; // 0..1
}

export interface GameProgressSave {
  day: number; // 1..5, then 6+ Endless Cozy Mode
  endlessMode: boolean;
  money: number;
  totalTips: number;
  cupsServed: number;
  unlockedDecor: string[];
  customerVisits: Record<string, number>;
  seenPrologue: boolean;
  weatherOverride: WeatherMood | 'auto';
}
