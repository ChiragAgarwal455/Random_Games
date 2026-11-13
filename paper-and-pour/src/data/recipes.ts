import {
  ActiveDrinkContents,
  ActiveOrder,
  CupStyle,
  DrinkRecipe,
  MilkType,
  ServeEvaluation,
  SyrupType,
  TipBreakdownLine,
  ToppingType,
} from '../types/game';

export const CUP_META: Record<
  CupStyle,
  { label: string; isGlass: boolean; tall: boolean; wide: boolean; baseColor: string }
> = {
  ceramic_mug: {
    label: 'Warm Ceramic Mug',
    isGlass: false,
    tall: false,
    wide: false,
    baseColor: '#FBF5E8',
  },
  iced_glass: {
    label: 'Tall Iced Glass',
    isGlass: true,
    tall: true,
    wide: false,
    baseColor: '#E5F2F4',
  },
  latte_bowl: {
    label: 'Wide Latte Bowl',
    isGlass: false,
    tall: false,
    wide: true,
    baseColor: '#F6E7D6',
  },
  kraft_cup: {
    label: 'Sketch Kraft Cup',
    isGlass: false,
    tall: true,
    wide: false,
    baseColor: '#DFC39D',
  },
  cat_mug: {
    label: 'Calico Cat Mug',
    isGlass: false,
    tall: false,
    wide: false,
    baseColor: '#FFF7EC',
  },
  frog_mug: {
    label: 'Mossy Froggy Mug',
    isGlass: false,
    tall: false,
    wide: false,
    baseColor: '#DCE8CE',
  },
  owl_mug: {
    label: 'Starry Owl Mug',
    isGlass: false,
    tall: false,
    wide: false,
    baseColor: '#DDD2E8',
  },
};

export const MILK_META: Record<MilkType, { label: string; color: string; foamColor: string; cartonColor: string }> = {
  none: { label: 'No Milk', color: 'transparent', foamColor: 'transparent', cartonColor: '#DDD' },
  whole: { label: 'Whole Milk', color: '#FBF4E6', foamColor: '#FFFDF8', cartonColor: '#9AC0D1' },
  oat: { label: 'Oat Milk', color: '#F0E1C6', foamColor: '#FAF1DF', cartonColor: '#E2BD82' },
  almond: { label: 'Almond Milk', color: '#EFE4D0', foamColor: '#F8F0E3', cartonColor: '#D4AF9B' },
};

export const SYRUP_META: Record<SyrupType, { label: string; short: string; color: string; bottleColor: string; unlockDay: number }> = {
  vanilla: { label: 'Madagascar Vanilla', short: 'Vanilla', color: '#EED38E', bottleColor: '#F5E4B2', unlockDay: 1 },
  caramel: { label: 'Salted Caramel', short: 'Caramel', color: '#C97B2B', bottleColor: '#D99345', unlockDay: 2 },
  hazelnut: { label: 'Toasted Hazelnut', short: 'Hazelnut', color: '#A56C3E', bottleColor: '#BA8558', unlockDay: 1 },
  strawberry: { label: 'Strawberry Rose', short: 'Strawberry', color: '#E68393', bottleColor: '#F2A3B0', unlockDay: 3 },
  lavender: { label: 'Lavender Honey', short: 'Lavender', color: '#A98CC7', bottleColor: '#C5AEDD', unlockDay: 4 },
};

export const TOPPING_META: Record<ToppingType, { label: string; short: string; color: string; unlockDay: number }> = {
  cinnamon: { label: 'Cinnamon Dust', short: 'Cinnamon', color: '#A45A32', unlockDay: 1 },
  cocoa_dust: { label: 'Cocoa Powder', short: 'Cocoa Dust', color: '#5D3624', unlockDay: 1 },
  matcha_dust: { label: 'Matcha Dust', short: 'Matcha Dust', color: '#78A35F', unlockDay: 3 },
  whipped_cream: { label: 'Whipped Cream', short: 'Whip Cream', color: '#FFFDF7', unlockDay: 2 },
  caramel_drizzle: { label: 'Caramel Drizzle', short: 'Caramel Drizzle', color: '#C87628', unlockDay: 2 },
  cookie: { label: 'Butter Cookie', short: 'Cookie', color: '#D7A468', unlockDay: 1 },
};

export const RECIPES: DrinkRecipe[] = [
  {
    id: 'classic_espresso',
    name: 'Classic Espresso',
    subtitle: 'Rich single or double pull with golden crema',
    unlockDay: 1,
    basePrice: 4.0,
    preferredCup: ['ceramic_mug', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0,
    milkSteamed: false,
    syrups: {},
    iceCount: 0,
    toppings: [],
    prefersLatteArt: false,
    sketchHint: 'Ceramic Mug → Grind, Tamp & Pull 1 Espresso Shot → Pour & Serve warm!',
    colorSwatch: '#4C2819',
  },
  {
    id: 'americano',
    name: 'Morning Americano',
    subtitle: 'Double espresso softened with steaming water',
    unlockDay: 1,
    basePrice: 4.5,
    preferredCup: ['ceramic_mug', 'kraft_cup', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 2,
    waterAmount: 0.45,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0,
    milkSteamed: false,
    syrups: {},
    iceCount: 0,
    toppings: [],
    prefersLatteArt: false,
    sketchHint: 'Mug → Pull 2 Espresso Shots → Add Hot Water.',
    colorSwatch: '#5E3422',
  },
  {
    id: 'cafe_latte',
    name: 'Cozy Café Latte',
    subtitle: 'Espresso bathed in velvety microfoam',
    unlockDay: 1,
    basePrice: 5.5,
    preferredCup: ['latte_bowl', 'ceramic_mug', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.55,
    milkSteamed: true,
    syrups: {},
    iceCount: 0,
    toppings: [],
    prefersLatteArt: true,
    sketchHint: 'Bowl/Mug → 1 Espresso Shot → Steam Milk to ~62°C → Pour Latte Art!',
    colorSwatch: '#D4AC82',
  },
  {
    id: 'hazelnut_latte',
    name: 'Toasted Hazelnut Latte',
    subtitle: 'Nana’s signature nutty winter warmer',
    unlockDay: 1,
    basePrice: 6.0,
    preferredCup: ['ceramic_mug', 'latte_bowl', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.5,
    milkSteamed: true,
    syrups: { hazelnut: 2 },
    iceCount: 0,
    toppings: ['cinnamon'],
    prefersLatteArt: true,
    sketchHint: 'Mug → 2 pumps Hazelnut → 1 Espresso → Steamed Milk → Cinnamon Dust!',
    colorSwatch: '#C79667',
  },
  {
    id: 'cappuccino',
    name: 'Cloud Cappuccino',
    subtitle: 'Bold espresso, thick airy foam & cocoa dusting',
    unlockDay: 1,
    basePrice: 5.5,
    preferredCup: ['ceramic_mug', 'latte_bowl', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.45,
    milkSteamed: true,
    syrups: {},
    iceCount: 0,
    toppings: ['cocoa_dust'],
    prefersLatteArt: true,
    sketchHint: 'Mug → 1 Espresso → Steamed Milk (~62°C) → Dust with Cocoa Powder!',
    colorSwatch: '#CFA67C',
  },
  {
    id: 'iced_vanilla_latte',
    name: 'Iced Vanilla Latte',
    subtitle: 'Chilled glass swirled with sweet Madagascar vanilla',
    unlockDay: 2,
    basePrice: 6.25,
    preferredCup: ['iced_glass'],
    isIced: true,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.5,
    milkSteamed: false,
    syrups: { vanilla: 2 },
    iceCount: 3,
    toppings: [],
    prefersLatteArt: false,
    sketchHint: 'Tall Glass → 3+ Ice Cubes → 2 Vanilla Pumps → Cold Milk → 1 Espresso!',
    colorSwatch: '#DFBE93',
  },
  {
    id: 'iced_caramel_brew',
    name: 'Iced Caramel Macchiato',
    subtitle: 'Layered vanilla milk, espresso & golden caramel drizzle',
    unlockDay: 2,
    basePrice: 6.75,
    preferredCup: ['iced_glass'],
    isIced: true,
    espressoShots: 2,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.45,
    milkSteamed: false,
    syrups: { vanilla: 1, caramel: 2 },
    iceCount: 3,
    toppings: ['caramel_drizzle'],
    prefersLatteArt: false,
    sketchHint: 'Tall Glass → Ice → Vanilla & Caramel Syrup → Cold Milk → 2 Espresso → Caramel Drizzle!',
    colorSwatch: '#CD8C4B',
  },
  {
    id: 'caramel_latte',
    name: 'Warm Caramel Latte',
    subtitle: 'Steamed milk kissed with salted caramel & golden drizzle',
    unlockDay: 2,
    basePrice: 6.5,
    preferredCup: ['ceramic_mug', 'latte_bowl', 'kraft_cup', 'cat_mug', 'frog_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 1,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.5,
    milkSteamed: true,
    syrups: { caramel: 2 },
    iceCount: 0,
    toppings: ['caramel_drizzle'],
    prefersLatteArt: true,
    sketchHint: 'Mug → 2 Caramel Pumps → 1 Espresso → Steamed Milk → Caramel Drizzle!',
    colorSwatch: '#CF985A',
  },
  {
    id: 'matcha_latte',
    name: 'Ceremonial Matcha Latte',
    subtitle: 'Stone-milled jade tea whisked into silky milk',
    unlockDay: 3,
    basePrice: 6.75,
    preferredCup: ['latte_bowl', 'ceramic_mug', 'frog_mug', 'cat_mug', 'owl_mug'],
    isIced: false,
    espressoShots: 0,
    waterAmount: 0,
    powder: 'matcha',
    powderWhisked: true,
    milkAmount: 0.55,
    milkSteamed: true,
    syrups: { vanilla: 1 },
    iceCount: 0,
    toppings: ['matcha_dust'],
    prefersLatteArt: true,
    sketchHint: 'Bowl/Mug → Whisk Matcha in Bamboo Bowl & Pour → 1 Vanilla → Steamed Milk → Matcha Dust!',
    colorSwatch: '#89AF6F',
  },
  {
    id: 'strawberry_matcha',
    name: 'Strawberry Rose Matcha',
    subtitle: 'Rosy berry cream layered under whisked iced matcha',
    unlockDay: 3,
    basePrice: 7.25,
    preferredCup: ['iced_glass'],
    isIced: true,
    espressoShots: 0,
    waterAmount: 0,
    powder: 'matcha',
    powderWhisked: true,
    milkAmount: 0.45,
    milkSteamed: false,
    syrups: { strawberry: 2 },
    iceCount: 3,
    toppings: ['matcha_dust'],
    prefersLatteArt: false,
    sketchHint: 'Tall Glass → Ice → 2 Strawberry Pumps → Cold Milk → Whisked Matcha!',
    colorSwatch: '#A7C389',
  },
  {
    id: 'hot_cocoa',
    name: 'Sketchbook Hot Cocoa',
    subtitle: 'Whisked dark cocoa with cloud whip & cocoa dust',
    unlockDay: 3,
    basePrice: 6.25,
    preferredCup: ['ceramic_mug', 'cat_mug', 'frog_mug', 'owl_mug', 'latte_bowl'],
    isIced: false,
    espressoShots: 0,
    waterAmount: 0,
    powder: 'cocoa',
    powderWhisked: true,
    milkAmount: 0.55,
    milkSteamed: true,
    syrups: {},
    iceCount: 0,
    toppings: ['whipped_cream', 'cocoa_dust'],
    prefersLatteArt: false,
    sketchHint: 'Mug → Whisk Cocoa & Pour → Steamed Milk → Whipped Cream + Cocoa Dust!',
    colorSwatch: '#6D3F2A',
  },
  {
    id: 'lavender_oat_latte',
    name: 'Lavender Moon Oat Latte',
    subtitle: 'Floral lavender honey & double espresso in silky oat milk',
    unlockDay: 4,
    basePrice: 7.5,
    preferredCup: ['latte_bowl', 'ceramic_mug', 'owl_mug', 'cat_mug', 'frog_mug'],
    isIced: false,
    espressoShots: 2,
    waterAmount: 0,
    powder: 'none',
    powderWhisked: false,
    milkAmount: 0.5,
    milkSteamed: true,
    milkType: 'oat',
    syrups: { lavender: 2 },
    iceCount: 0,
    toppings: [],
    prefersLatteArt: true,
    sketchHint: 'Bowl/Mug → 2 Lavender Pumps → 2 Espresso Shots → Steamed Oat Milk → Latte Art!',
    colorSwatch: '#C8B4D4',
  },
];

export interface TipUpgradeBonuses {
  cremaBonus: number;
  hospitalityBonus: number;
}

export function evaluateDrink(
  order: ActiveOrder,
  drink: ActiveDrinkContents,
  visitCount: number,
  patienceLeft: number, // 0..1
  bonuses: TipUpgradeBonuses = { cremaBonus: 0, hospitalityBonus: 0 }
): ServeEvaluation {
  const { recipe } = order;
  const lines: TipBreakdownLine[] = [];
  let craftTip = 0;

  const basePay = recipe.basePrice;

  // 1. Cup & Temperature Match
  const cupMatchesType =
    recipe.isIced === (drink.cupStyle === 'iced_glass') ||
    (!recipe.isIced && drink.cupStyle !== 'iced_glass' && drink.cupStyle !== null);
  const iceMatches = recipe.isIced ? drink.iceCount >= 2 : drink.iceCount === 0;

  if (cupMatchesType && iceMatches) {
    lines.push({ label: recipe.isIced ? 'Chilled & Iced Just Right' : 'Cozy Warm Vessel', amount: 0.75, positive: true });
    craftTip += 0.75;
  } else if (drink.cupStyle) {
    lines.push({ label: 'Playful Vessel Twist', amount: 0.25, positive: true });
    craftTip += 0.25;
  }

  // 2. Core Espresso / Powder Match
  let baseMatch = false;
  if (recipe.espressoShots > 0 && recipe.powder === 'none') {
    if (drink.espressoShots === recipe.espressoShots) {
      lines.push({ label: `Spot-on ${recipe.espressoShots === 2 ? 'Double' : 'Single'} Espresso`, amount: 1.25, positive: true });
      craftTip += 1.25;
      baseMatch = true;
    } else if (drink.espressoShots > 0) {
      lines.push({ label: 'Gentle Espresso Balance', amount: 0.6, positive: true });
      craftTip += 0.6;
      baseMatch = true;
    } else {
      lines.push({ label: 'Missing Espresso Kick', amount: 0, positive: false });
    }
    if (baseMatch && bonuses.cremaBonus > 0) {
      lines.push({ label: 'Heirloom Tiger Crema Bonus', amount: bonuses.cremaBonus, positive: true });
      craftTip += bonuses.cremaBonus;
    }
  } else if (recipe.powder === 'matcha') {
    if (drink.matchaAmount > 0.15) {
      lines.push({ label: 'Velvety Whisked Matcha', amount: 1.35, positive: true });
      craftTip += 1.35;
      baseMatch = true;
    } else {
      lines.push({ label: 'Light on the Matcha', amount: 0, positive: false });
    }
  } else if (recipe.powder === 'cocoa') {
    if (drink.cocoaAmount > 0.15) {
      lines.push({ label: 'Rich Whisked Cocoa', amount: 1.35, positive: true });
      craftTip += 1.35;
      baseMatch = true;
    } else {
      lines.push({ label: 'Needs More Cocoa', amount: 0, positive: false });
    }
  }

  // Water for Americano
  if (recipe.waterAmount > 0) {
    if (drink.water >= 0.2) {
      lines.push({ label: 'Balanced Hot Water', amount: 0.6, positive: true });
      craftTip += 0.6;
    } else {
      lines.push({ label: 'Forgot Hot Water', amount: 0, positive: false });
    }
  }

  // 3. Milk & Steaming Microfoam
  if (recipe.milkAmount > 0) {
    const hasMilk = drink.milkAmount >= 0.18;
    const milkTypeRequested = order.requestedMilk !== 'none' ? order.requestedMilk : recipe.milkType;
    const rightMilkType = !milkTypeRequested || drink.milkType === milkTypeRequested;

    if (hasMilk && rightMilkType) {
      const milkName = MILK_META[drink.milkType]?.label ?? 'Milk';
      lines.push({ label: `Perfect ${milkName}`, amount: 0.85, positive: true });
      craftTip += 0.85;
    } else if (hasMilk) {
      lines.push({ label: 'Creamy Milk Substitute', amount: 0.4, positive: true });
      craftTip += 0.4;
    } else {
      lines.push({ label: 'Needed Some Milk', amount: 0, positive: false });
    }

    if (recipe.milkSteamed && drink.milkWasSteamed) {
      if (drink.milkTempC >= 56 && drink.milkTempC <= 69) {
        lines.push({ label: 'Silky 62°C Microfoam!', amount: 1.0, positive: true });
        craftTip += 1.0;
      } else {
        lines.push({ label: 'Warm Steamed Milk', amount: 0.45, positive: true });
        craftTip += 0.45;
      }
    } else if (!recipe.milkSteamed && hasMilk && !drink.milkWasSteamed) {
      lines.push({ label: 'Crisp Cold Pour', amount: 0.6, positive: true });
      craftTip += 0.6;
    }
  }

  // 4. Syrups
  const reqSyrups = { ...recipe.syrups };
  if (order.requestedSyrup && !reqSyrups[order.requestedSyrup]) {
    reqSyrups[order.requestedSyrup] = 1;
  }
  const reqSyrupKeys = Object.keys(reqSyrups) as SyrupType[];
  if (reqSyrupKeys.length > 0) {
    const matchedSyrups = reqSyrupKeys.filter((s) => (drink.syrups[s] ?? 0) >= 1);
    if (matchedSyrups.length === reqSyrupKeys.length) {
      lines.push({ label: 'Sweet Flavor Notes', amount: 0.9, positive: true });
      craftTip += 0.9;
    } else if (matchedSyrups.length > 0) {
      lines.push({ label: 'Subtle Hint of Syrup', amount: 0.45, positive: true });
      craftTip += 0.45;
    } else {
      lines.push({ label: 'Missed the Syrup Swirl', amount: 0, positive: false });
    }
  }

  // 5. Toppings
  const reqToppings = new Set<ToppingType>(recipe.toppings);
  if (order.requestedTopping) reqToppings.add(order.requestedTopping);
  if (reqToppings.size > 0) {
    const matchedTops = [...reqToppings].filter((t) => drink.toppings.includes(t));
    if (matchedTops.length === reqToppings.size) {
      lines.push({ label: 'Charming Finishing Touch', amount: 0.75, positive: true });
      craftTip += 0.75;
    } else if (matchedTops.length > 0) {
      lines.push({ label: 'Nice Topping Sprinkle', amount: 0.35, positive: true });
      craftTip += 0.35;
    }
  } else if (drink.toppings.includes('cookie')) {
    lines.push({ label: 'Surprise Butter Cookie!', amount: 0.65, positive: true });
    craftTip += 0.65;
  }

  // 6. Latte Art Bonus
  if (recipe.prefersLatteArt && drink.latteArtQuality > 0.28) {
    const artBonus = drink.latteArtQuality > 0.62 ? 1.25 : 0.75;
    lines.push({
      label: drink.latteArtQuality > 0.62 ? 'Lovely Sketchbook Latte Art!' : 'Soft Milk Swirl',
      amount: artBonus,
      positive: true,
    });
    craftTip += artBonus;
  }

  // 7. Regular Friendship & Hospitality Bonuses
  if (visitCount >= 2) {
    const friendTip = Math.min(1.25, 0.25 * (visitCount - 1));
    lines.push({ label: `Neighborhood Regular (${visitCount}x)`, amount: friendTip, positive: true });
    craftTip += friendTip;
  }

  if (bonuses.hospitalityBonus > 0) {
    lines.push({ label: 'Sketchbook Napkin Hospitality', amount: bonuses.hospitalityBonus, positive: true });
    craftTip += bonuses.hospitalityBonus;
  }

  // 8. Time-Based Patience Tip Multiplier & Wait Adjustment!
  let patienceMult = 1.0;
  if (patienceLeft >= 0.7) {
    lines.push({ label: 'Prompt & Caring Service!', amount: 0.85, positive: true });
    craftTip += 0.85;
  } else if (patienceLeft >= 0.4) {
    patienceMult = 0.78;
    const lost = Math.round(craftTip * (1 - patienceMult) * 100) / 100;
    if (lost > 0) {
      lines.push({ label: 'Slightly Long Wait', amount: -lost, positive: false });
    }
  } else {
    patienceMult = 0.42;
    const lost = Math.round(craftTip * (1 - patienceMult) * 100) / 100;
    if (lost > 0) {
      lines.push({ label: 'Very Long Wait (Patience Low)', amount: -lost, positive: false });
    }
  }

  const finalTip = Math.max(0.25, Math.round(craftTip * patienceMult * 100) / 100);
  const totalEarned = Math.round((basePay + finalTip) * 100) / 100;

  let stars = 3;
  if (baseMatch && patienceLeft >= 0.6 && finalTip >= 3.5) stars = 5;
  else if (baseMatch && patienceLeft >= 0.35 && finalTip >= 2.2) stars = 4;
  else if (!baseMatch || patienceLeft < 0.2) stars = 2;

  const headline =
    stars === 5
      ? 'Heart-Warming Masterpiece!'
      : stars === 4
      ? 'Cozy & Delicious!'
      : stars === 3
      ? 'Warmly Received'
      : patienceLeft < 0.35
      ? 'Just in the Nick of Time!'
      : 'An Experimental Sip!';

  const customerReply =
    patienceLeft < 0.35
      ? order.customer.impatientLines[Math.floor(Math.random() * order.customer.impatientLines.length)]
      : stars >= 4
      ? order.customer.happyLines[Math.floor(Math.random() * order.customer.happyLines.length)]
      : order.customer.creativeLines[Math.floor(Math.random() * order.customer.creativeLines.length)];

  return {
    basePay,
    tipAmount: finalTip,
    totalEarned,
    stars,
    headline,
    customerReply,
    lines,
    latteArtScore: drink.latteArtQuality,
    patienceLeft,
  };
}
