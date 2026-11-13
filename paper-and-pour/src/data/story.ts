import { StoryBeat, WeatherMood } from '../types/game';

export const DAY_WEATHER: Record<number, WeatherMood> = {
  1: 'rain',
  2: 'mist',
  3: 'sun',
  4: 'rain',
  5: 'dusk',
};

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'prologue',
    day: 1,
    phase: 'prologue',
    title: 'Nana Maeve’s Stained Sketchbook',
    dateLabel: 'Prologue — Elm Lane, 7:15 AM',
    paragraphs: [
      'The brass bell above the door gives a soft, dusty chime as you push open the shutters of Paper & Pour—your grandmother Nana Maeve’s tiny corner café, quiet since autumn.',
      'Wrapped neatly beside the brass espresso lever sits her linen apron and a thick watercolor sketchbook, its edges darkened by old coffee rings and dried lavender petals.',
      'You trace the pencil inscription inside the front cover, tie the apron strings around your waist, and flip the wooden chalkboard sign to OPEN.',
    ],
    nanaQuote:
      '“To my Clover — A good cup never hurries. Listen to the rain, pour with gentle hands, and let the neighborhood find its way back.”',
    sketchTag: 'apron',
  },
  {
    id: 'day1_morning',
    day: 1,
    phase: 'morning',
    title: 'Day 1: First Steam on Rainy Street',
    dateLabel: 'Monday — Soft Morning Drizzle',
    paragraphs: [
      'Soft raindrops tap against the arched pane. The vintage burr grinder hums back to life as golden crema fills the first ceramic cup.',
      'Three neighborhood regulars peek past the foggy glass—drawn by the scent of toasted hazelnuts and fresh espresso.',
    ],
    unlockedItemsText: 'Unlocked: Espresso Machine, Milk Steamer, Latte Art Pour, Hazelnut & Vanilla Syrups!',
    sketchTag: 'rain_window',
  },
  {
    id: 'day1_evening',
    day: 1,
    phase: 'evening',
    title: 'Evening Sketch — Page 1',
    dateLabel: 'Monday Night — Closing Ledger',
    paragraphs: [
      'You wipe down the maple counter while Barnaby waves from the bookshop next door. Mochi left a tiny pencil doodle of a smiling mug on her coaster.',
      'In Nana’s diary, you sketch the rain and tape your very first tipped coin rubbing beneath the margin.',
    ],
    sketchTag: 'rain_window',
  },
  {
    id: 'day2_morning',
    day: 2,
    phase: 'morning',
    title: 'Day 2: Ice, Syrups & Old Songs',
    dateLabel: 'Tuesday — Silver Mist Clearing',
    paragraphs: [
      'Sunbeams thread through the clearing mist. Behind the counter drawer, you discover Nana’s tall crystal glasses, salted caramel bottle, and silver ice tongs.',
      'A gentle violin tune drifts down the cobblestone alley as morning regulars wander in.',
    ],
    unlockedItemsText: 'Unlocked: Tall Iced Glasses, Ice Bucket, Salted Caramel Syrup, Whipped Cream & Caramel Drizzle!',
    sketchTag: 'ice_glass',
  },
  {
    id: 'day2_evening',
    day: 2,
    phase: 'evening',
    title: 'Evening Sketch — Page 2',
    dateLabel: 'Tuesday Night — Closing Ledger',
    paragraphs: [
      'Captain Oliver lingered an hour listening to the kettle sigh, telling stories about Nana sketching harbor boats on paper sleeves.',
      'Your hands feel steadier with the milk pitcher now—watching foam glide across crema feels almost like painting on canvas.',
    ],
    sketchTag: 'ice_glass',
  },
  {
    id: 'day3_morning',
    day: 3,
    phase: 'morning',
    title: 'Day 3: The Matcha Whisper',
    dateLabel: 'Wednesday — Golden Morning Sun',
    paragraphs: [
      'Grandpa Moss drops off a fresh fern cutting and points out a hidden cedar box beneath the shelves: Nana’s bamboo chasen whisk, jade matcha tin, dark cocoa, and strawberry-rose syrup!',
      'Time to swirl soothing greens and velvety cocoas between espresso pours.',
    ],
    unlockedItemsText: 'Unlocked: Bamboo Whisk Station, Ceremonial Matcha, Dark Cocoa, Strawberry Rose Syrup & Matcha Dust!',
    sketchTag: 'matcha_whisk',
  },
  {
    id: 'day3_evening',
    day: 3,
    phase: 'evening',
    title: 'Evening Sketch — Page 3',
    dateLabel: 'Wednesday Night — Closing Ledger',
    paragraphs: [
      'The café hummed with soft chatter and bamboo whisk swishes all afternoon. Pippa asked if she could tack her charcoal sketch of your counter onto the corkboard.',
      'You find a folded receipt in the back of the ledger—only one more special page of Nana’s recipes remains unopened.',
    ],
    sketchTag: 'matcha_whisk',
  },
  {
    id: 'day4_morning',
    day: 4,
    phase: 'morning',
    title: 'Day 4: Lantern Light & Lavender',
    dateLabel: 'Thursday — Cozy Dusk Storm',
    paragraphs: [
      'Low thunder rolls softly across the rooftops while golden café lanterns flicker on inside. Nestled in purple ribbon sits Nana’s treasured Lavender Honey syrup!',
      'Even night-shift neighbors like Cleo Owl are gliding down from the observatory hill for a warm moonlit cup.',
    ],
    unlockedItemsText: 'Unlocked: Lavender Honey Syrup & Lavender Moon Oat Latte!',
    sketchTag: 'fairy_lights',
  },
  {
    id: 'day4_evening',
    day: 4,
    phase: 'evening',
    title: 'Evening Sketch — Page 4',
    dateLabel: 'Thursday Night — Closing Ledger',
    paragraphs: [
      'Rain streaked the glass all evening while lavender steam warmed the tiny room. You finished sketching every customer’s favorite mug along the margin.',
      'Tomorrow, Nana’s favorite portrait page waits at the end of the sketchbook.',
    ],
    sketchTag: 'fairy_lights',
  },
  {
    id: 'day5_morning',
    day: 5,
    phase: 'morning',
    title: 'Day 5: The Neighborhood Sketchbook',
    dateLabel: 'Friday — Warm Golden Hour',
    paragraphs: [
      'A warm breeze carries jasmine and roasted espresso through the open casement window. Everyone on Elm Lane has heard Paper & Pour is blooming again!',
      'Serve your dear regulars today to complete the final page of Nana Maeve’s living sketchbook.',
    ],
    unlockedItemsText: 'All Recipes Unlocked! Complete today to enter Cozy Endless Café Mode!',
    sketchTag: 'portrait',
  },
  {
    id: 'day5_evening',
    day: 5,
    phase: 'evening',
    title: 'Our Forever Corner Café',
    dateLabel: 'Story Complete — Cozy Endless Mode Unlocked',
    paragraphs: [
      'On the last blank page, you paint a tiny watercolor of the sunlit counter—Barnaby’s book, Mochi’s paintbrush, Oliver’s beanie, Luna’s violin, Pippa’s doodles, Grandpa Moss’s fern, and Cleo’s starry scarf.',
      'Paper & Pour isn’t just Nana Maeve’s memory anymore—it’s yours and the neighborhood’s home. Open the shutters anytime for endless relaxing pours, ASMR rain, and cozy decorating!',
    ],
    nanaQuote: '“Well brewed, my Clover. Now pour whenever your heart needs quiet.”',
    sketchTag: 'portrait',
  },
];

export const CUSTOMERS_PER_DAY: Record<number, number> = {
  1: 3,
  2: 3,
  3: 4,
  4: 4,
  5: 5,
};
