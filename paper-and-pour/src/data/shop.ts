import { CollectibleCupItem, UpgradeTrack } from '../types/game';

export const UPGRADE_TRACKS: UpgradeTrack[] = [
  {
    id: 'lighting',
    categoryName: 'Window & Café Lighting',
    iconTag: 'lamp',
    tiers: [
      {
        tier: 1,
        name: 'Warm Paper Lanterns',
        description: 'Soft cream paper globes casting gentle golden glow above the counter.',
        price: 8,
      },
      {
        tier: 2,
        name: 'Amber String Fairy Lights',
        description: 'Twinkling warm bulbs draped across the arched window mullion.',
        price: 16,
      },
      {
        tier: 3,
        name: 'Stained-Glass Sun Catcher',
        description: 'Hand-leaded amber & sage glass arch glowing warmly through any weather!',
        price: 28,
      },
    ],
  },
  {
    id: 'greenery',
    categoryName: 'Botanical Corner',
    iconTag: 'plant',
    tiers: [
      {
        tier: 1,
        name: 'Windowsill Succulents',
        description: 'Three plump terracotta pots soaking up light on the window ledge.',
        price: 8,
      },
      {
        tier: 2,
        name: 'Trailing Pothos Shelf',
        description: 'Lush painted pothos vines cascading gently down the brick wall.',
        price: 16,
      },
      {
        tier: 3,
        name: 'Hanging Botanical Jungle',
        description: 'Hanging woven fern baskets & blooming jasmine brightening the whole café!',
        price: 28,
      },
    ],
  },
  {
    id: 'cat_lounge',
    categoryName: 'Cat Waiting Lounge',
    iconTag: 'cat',
    tiers: [
      {
        tier: 1,
        name: 'Braided Rug & Biscuit Kitty',
        description: 'Adds a cozy patchwork rug and welcomes Biscuit the ginger tabby to the lounge!',
        price: 10,
        perkLabel: '+1 Playful Cat (Biscuit)',
      },
      {
        tier: 2,
        name: 'Two-Story Wooden Cat Tree',
        description: 'A sisal-wrapped cat perch with dangling feather toy beside the waiting bench.',
        price: 20,
        perkLabel: '+Cat Tree Perch',
      },
      {
        tier: 3,
        name: 'Velvet Cat Lounge & Sesame',
        description: 'Deluxe cushioned cat sofa welcoming Sesame the tuxedo kitten!',
        price: 34,
        perkLabel: '+1 Kitten (Sesame) • +15% Calmer Guests',
      },
    ],
  },
  {
    id: 'wall_art',
    categoryName: 'Wall Art & Gallery',
    iconTag: 'art',
    tiers: [
      {
        tier: 1,
        name: 'Hand-Lettered Specials Chalkboard',
        description: 'Ornate wood-framed chalkboard decorated with pastel coffee doodles.',
        price: 9,
      },
      {
        tier: 2,
        name: 'Gouache Café Postcard Gallery',
        description: 'Framed hand-painted botanical & pastry studies hung warmly on the wall.',
        price: 18,
      },
      {
        tier: 3,
        name: 'Nana Maeve’s Brass Heirloom Wall',
        description: 'Vintage brass clock, framed Nana portrait & ribbon award beside the shelves.',
        price: 30,
      },
    ],
  },
  {
    id: 'music_corner',
    categoryName: 'Acoustic & Vinyl Corner',
    iconTag: 'music',
    tiers: [
      {
        tier: 1,
        name: 'Retro Cream Table Radio',
        description: 'A rounded mid-century radio humming softly on the upper shelf.',
        price: 12,
      },
      {
        tier: 2,
        name: 'Walnut Vinyl Turntable',
        description: 'Spinning wax records sending cozy musical notes drifting across the café.',
        price: 22,
      },
      {
        tier: 3,
        name: 'Acoustic Guitar & Record Crate',
        description: 'A honey-spruce acoustic guitar resting beside vintage LPs in the corner.',
        price: 36,
      },
    ],
  },
  {
    id: 'counter_charm',
    categoryName: 'Countertop & Pastry Display',
    iconTag: 'vase',
    tiers: [
      {
        tier: 1,
        name: 'Nana’s Pressed Daisy Vase',
        description: 'Fresh sunlit wildflowers tucked beside the tip jar.',
        price: 9,
      },
      {
        tier: 2,
        name: 'Glass Croissant Cloche',
        description: 'A domed crystal tray cradling flaky butter croissants & scones.',
        price: 17,
      },
      {
        tier: 3,
        name: 'Hammered Copper Tea Service',
        description: 'Polished heirloom copper kettle & floral macarons warming the counter.',
        price: 29,
      },
    ],
  },
  {
    id: 'equipment',
    categoryName: 'Barista Gear Upgrades',
    iconTag: 'gear',
    tiers: [
      {
        tier: 1,
        name: 'Titanium Conical Burrs',
        description: 'Precision machined burrs grind fresh coffee beans 45% faster!',
        price: 14,
        perkLabel: '+45% Faster Grinding',
      },
      {
        tier: 2,
        name: 'Twin-Boiler Brass Steamer',
        description: 'Upgraded steam pressure heats & textures silky microfoam 40% faster!',
        price: 24,
        perkLabel: '+40% Faster Milk Steaming',
      },
      {
        tier: 3,
        name: 'Artisan Bottomless Portafilter',
        description: 'Produces ultra-rich tiger-striped crema for automatic bonus tips!',
        price: 36,
        perkLabel: '+$0.60 Crema Tip Bonus',
      },
    ],
  },
  {
    id: 'patience_cushions',
    categoryName: 'Guest Hospitality & Seating',
    iconTag: 'cushion',
    tiers: [
      {
        tier: 1,
        name: 'Warm Linen Counter Cushions',
        description: 'Soft quilted seat cushions help counter guests relax 18% longer.',
        price: 12,
        perkLabel: '+18% Longer Guest Patience',
      },
      {
        tier: 2,
        name: 'Complimentary Shortbread Dish',
        description: 'Tiny butter cookies near the waiting area boost patience by 35%!',
        price: 22,
        perkLabel: '+35% Longer Guest Patience',
      },
      {
        tier: 3,
        name: 'Signature Sketchbook Napkins',
        description: 'Every guest receives keepsake watercolor napkins—+50% calmer patience & +$0.50 hospitality tip!',
        price: 35,
        perkLabel: '+50% Patience & +$0.50 Tip',
      },
    ],
  },
];

export const COLLECTIBLE_CUPS: CollectibleCupItem[] = [
  {
    id: 'cat_mug',
    cupStyle: 'cat_mug',
    name: 'Calico Whisker Mug',
    description: 'Hand-glazed cream ceramic mug with tiny pointed cat ears & rosy cheeks.',
    price: 10,
  },
  {
    id: 'frog_mug',
    cupStyle: 'frog_mug',
    name: 'Mossy Froggy Mug',
    description: 'Cheerful sage-green froggy cup with big cozy eyes—ideal for matcha!',
    price: 10,
  },
  {
    id: 'owl_mug',
    cupStyle: 'owl_mug',
    name: 'Starry Owl Mug',
    description: 'Pastel-plum speckled stoneware mug with golden crescent moon glaze.',
    price: 14,
  },
];

export interface ShopComputedBonuses {
  patienceMultiplier: number;
  grindSpeedBonus: number;
  steamSpeedBonus: number;
  cremaBonus: number;
  hospitalityBonus: number;
}

export function getShopBonuses(
  levels: Partial<Record<UpgradeTrack['id'], number>>
): ShopComputedBonuses {
  const eq = levels.equipment ?? 0;
  const cush = levels.patience_cushions ?? 0;
  const cat = levels.cat_lounge ?? 0;

  let patienceMultiplier = 1.0;
  if (cush === 1) patienceMultiplier += 0.18;
  else if (cush === 2) patienceMultiplier += 0.35;
  else if (cush >= 3) patienceMultiplier += 0.5;
  if (cat >= 3) patienceMultiplier += 0.15;

  return {
    patienceMultiplier,
    grindSpeedBonus: eq >= 1 ? 1.45 : 1.0,
    steamSpeedBonus: eq >= 2 ? 1.4 : 1.0,
    cremaBonus: eq >= 3 ? 0.6 : 0,
    hospitalityBonus: cush >= 3 ? 0.5 : 0,
  };
}
