import { ActiveOrder, CustomerProfile, MilkType, SyrupType, ToppingType } from '../types/game';
import { MILK_META, RECIPES, SYRUP_META, TOPPING_META } from './recipes';

export const CUSTOMERS: CustomerProfile[] = [
  {
    id: 'barnaby',
    name: 'Barnaby Bear',
    title: 'Next-Door Bookshop Keeper',
    species: 'bear',
    accentColor: '#A97C56',
    scarfOrOutfitColor: '#6D8566',
    introLines: [
      'Good morning, Clover... the smell of roasted beans woke up the whole street.',
      'I brought a pocket notebook today—your Nana used to save me the corner stool.',
    ],
    visitLines: {
      1: 'Nana Maeve always said coffee should never be rushed. May I try one of your warm brews?',
      2: 'The rain taps nicely against my bookshop window too. Ready for another cozy cup?',
      3: 'You know, your pours are starting to look just like Nana’s old recipe doodles.',
    },
    happyLines: [
      'Mmm... warm right down to my paws. Nana would be so proud of you, Clover.',
      'Velvety and comforting! Just like turning the first page of a favorite novel.',
      'Oh, that aroma! Take a little extra for the tip jar—you earned it.',
    ],
    creativeLines: [
      'Ooh, an unexpected twist! Honestly, it’s still delightfully cozy on a morning like this.',
      'A bit different than I pictured, yet somehow still comforting. Thank you, Clover!',
    ],
    impatientLines: [
      'Phew, I almost had to dash back to unlock the bookshop! Still tastes nice though.',
      'My paws were tapping a little there—glad I waited for a warm sip.',
    ],
    favoriteDrinkIds: ['hazelnut_latte', 'cafe_latte', 'hot_cocoa', 'americano'],
  },
  {
    id: 'mochi',
    name: 'Mochi Bunny',
    title: 'Storybook Illustrator',
    species: 'bunny',
    accentColor: '#F3DFD3',
    scarfOrOutfitColor: '#DF8B94',
    introLines: [
      'Eek! Your watercolor signboard outside is SO cute, Clover!',
      'Wait—are you using Nana Maeve’s stained sketchbook for orders? That’s magical!',
    ],
    visitLines: {
      1: 'I’m sketching pastel bunnies today, so I need something super comforting to sip!',
      2: 'I saved a blank margin in my pad just to draw your prettiest cup today!',
      3: 'Look! I painted your café awning in my storybook! Now, what’s brewing today?',
    },
    happyLines: [
      'Gasp!! Look at that gorgeous swirl! I’m sketching this cup right now!',
      'So sweet and dreamy! My paintbrush feels twice as fast already!',
      'Ten out of ten cozy sparkles! Dropping extra coins in your jar!',
    ],
    creativeLines: [
      'Haha, a surprise flavor palette! Like accidentally mixing strawberry paint—cute!',
      'Not quite what I expected, but it’s adorable and warm! Thanks, Clover!',
    ],
    impatientLines: [
      'Whew—I drew three extra doodles while waiting! Good thing the kitties kept me busy.',
      'Mmm, finally! My ink was drying up while I waited, haha.',
    ],
    favoriteDrinkIds: ['cafe_latte', 'strawberry_matcha', 'iced_vanilla_latte', 'hot_cocoa'],
  },
  {
    id: 'oliver',
    name: 'Captain Oliver',
    title: 'Retired Harbor Cat',
    species: 'cat',
    accentColor: '#56504D',
    scarfOrOutfitColor: '#E3B34C',
    introLines: [
      'Ahoy, young Clover! Fine harbor mist blowing down Elm Lane this morning.',
      'Heard the espresso boiler humming again—music to an old sailor’s ears!',
    ],
    visitLines: {
      1: 'Keep the bells gentle and the brew strong, matey. What’ve you got for an old cat?',
      2: 'When the wind kicks up, nothing steadies the whiskers like your steady pour.',
      3: 'You’ve got true steady paws at that espresso machine, Clover. Respect!',
    },
    happyLines: [
      'By my whiskers, that’s rich as dark harbor tide! Bravo, barista!',
      'Smooth sailing in a cup! Here’s a shiny coin for the glass jar.',
      'Magnificent crema! Even the gulls outside look jealous.',
    ],
    creativeLines: [
      'A little rogue current in the blend, eh? Still warms an old cat’s bones!',
      'Well now, uncharted flavor waters! Not bad at all, Clover.',
    ],
    impatientLines: [
      'Harumph! Nearly missed high tide waiting at the rail—still a decent brew, though.',
      'Took a spell to dock that cup, matey! Next time a touch brisker, eh?',
    ],
    favoriteDrinkIds: ['classic_espresso', 'americano', 'iced_caramel_brew', 'cappuccino'],
  },
  {
    id: 'luna',
    name: 'Luna Fox',
    title: 'Corner Street Violinist',
    species: 'fox',
    accentColor: '#D57849',
    scarfOrOutfitColor: '#9C5C6E',
    introLines: [
      'Hello there! My fingers are a bit chilly from tuning my violin under the awning.',
      'I always loved humming along to the kettle here with your Nana.',
    ],
    visitLines: {
      1: 'Could you make me something sweet and silky while I rosin my bow?',
      2: 'Whenever I play by the fountain, folks ask where that cozy coffee scent comes from!',
      3: 'This corner feels whole again with you behind the counter, Clover.',
    },
    happyLines: [
      'Oh, pure harmony in a cup! Listen—I’ll play a gentle waltz outside for you.',
      'So balanced and fragrant! Thank you for putting such care into every drop.',
      'Warmed my fingertips right back up. Here’s a melody’s worth of tips!',
    ],
    creativeLines: [
      'A playful improvisation! Jazz in coffee form—I dig it.',
      'A surprise note in the chord, yet still lovely and warm!',
    ],
    impatientLines: [
      'Oh goodness, I almost started rehearsal without my warm-up sip!',
      'That was quite a dramatic rest before the final note, haha. Still tasty!',
    ],
    favoriteDrinkIds: ['caramel_latte', 'iced_vanilla_latte', 'iced_caramel_brew', 'lavender_oat_latte'],
  },
  {
    id: 'pippa',
    name: 'Pippa Duckling',
    title: 'Sketching Student',
    species: 'duck',
    accentColor: '#F2CC68',
    scarfOrOutfitColor: '#76A0B8',
    introLines: [
      'Hi Clover!! I just sprinted down from art class—is the café open?!',
      'Whoa, it smells like toasted sugar and rain in here. Instant mood boost!',
    ],
    visitLines: {
      1: 'I’ve got five charcoal drawings due, so here’s my coffee wish!',
      2: 'Do you mind if I doodle by the window? Your tip jar is already looking shiny!',
      3: 'Everyone at studio is talking about Paper & Pour now!',
    },
    happyLines: [
      'OMG this is literally heavenly!! Can I give you six stars?!',
      'SO good!! That swirl makes me way too happy to sip!',
      'Best fuel on the block! Put all my spare pocket change in the jar!',
    ],
    creativeLines: [
      'Ooh wild remix flavor!! Honestly kinda slaps though, thank you!!',
      'Haha a mystery potion! Still super cozy, thanks Clover!',
    ],
    impatientLines: [
      'Whew!! Class starts in three minutes—gotta gulp and run! Still yummy!',
      'Wait was kinda longgg, good thing your kitties are super adorable!',
    ],
    favoriteDrinkIds: ['iced_caramel_brew', 'hot_cocoa', 'strawberry_matcha', 'cappuccino'],
  },
  {
    id: 'moss',
    name: 'Grandpa Moss',
    title: 'Botanical Greenhouse Tender',
    species: 'tortoise',
    accentColor: '#7B946D',
    scarfOrOutfitColor: '#9C7B58',
    introLines: [
      'Take your sweet time, little clover-leaf. Plants and good coffee both hate hurrying.',
      'I brought a cutting from Nana’s favorite fern—looks happy on your windowsill already.',
    ],
    visitLines: {
      1: 'There is an art to slow pouring. Whisk or steep with patience, my dear.',
      2: 'Notice how the steam curls just like morning mist over moss?',
      3: 'Paper & Pour feels peaceful as an old greenhouse with you tending it.',
    },
    happyLines: [
      'Ah... earthy, calm, and unhurried. Just how a drink ought to be.',
      'Nana Maeve always knew patience tasted sweetest. Lovely craft, Clover.',
      'Pure serenity in porcelain. Please accept this token of gratitude.',
    ],
    creativeLines: [
      'Nature surprises us sometimes—an unconventional sprout, yet pleasant!',
      'Gentle and soothing all the same. Thank you kindly, dear.',
    ],
    impatientLines: [
      'Even an old tortoise began wondering where the kettle went, haha. Thank you, dear.',
      'Quite a slow bloom today, though still soothing!',
    ],
    favoriteDrinkIds: ['matcha_latte', 'cafe_latte', 'americano', 'lavender_oat_latte'],
  },
  {
    id: 'cleo',
    name: 'Cleo Owl',
    title: 'Hilltop Observatory Astronomer',
    species: 'owl',
    accentColor: '#9D8CA8',
    scarfOrOutfitColor: '#5B678E',
    introLines: [
      '*Hoo~* Dusk settles so gently on this cozy street.',
      'I’m heading up to polish the telescope lenses soon—something soothing first?',
    ],
    visitLines: {
      1: 'Before the stars peek out, a quiet floral cup helps me focus through the night.',
      2: 'The warm glow from your café window looks like a tiny lantern from the hill.',
      3: 'You’ve turned Nana’s little shop into a bright constellation on Elm Lane.',
    },
    happyLines: [
      'Starlight in a mug... that floral aroma is truly celestial.',
      'Oh, how soothing! My night watch will feel effortless now.',
      'Thank you, Clover—leaving a pocketful of moon-silver tips for you.',
    ],
    creativeLines: [
      'A curious nebula of flavors—quite intriguing under twilight!',
      'Unexpected, yet comforting beneath the evening clouds.',
    ],
    impatientLines: [
      'Hoo~ the constellations nearly shifted while I waited! Still warm enough for the climb.',
      'A lengthy orbit for one cup, though I appreciate the effort.',
    ],
    favoriteDrinkIds: ['lavender_oat_latte', 'matcha_latte', 'cappuccino', 'iced_vanilla_latte'],
  },
];

export function generateOrderForDay(
  day: number,
  customer: CustomerProfile,
  visitNumber: number
): ActiveOrder {
  const unlockedRecipes = RECIPES.filter((r) => r.unlockDay <= day);
  const favUnlocked = unlockedRecipes.filter((r) => customer.favoriteDrinkIds.includes(r.id));
  const pool = favUnlocked.length > 0 ? favUnlocked : unlockedRecipes;
  const recipe = pool[Math.floor(Math.random() * pool.length)];

  let requestedMilk: MilkType = 'none';
  if (recipe.milkAmount > 0) {
    if (recipe.milkType) {
      requestedMilk = recipe.milkType;
    } else if (day >= 2 && Math.random() < 0.45) {
      const milks: MilkType[] = ['whole', 'oat', 'almond'];
      requestedMilk = milks[Math.floor(Math.random() * milks.length)];
    } else {
      requestedMilk = 'whole';
    }
  }

  let requestedSyrup: SyrupType | undefined;
  let requestedTopping: ToppingType | undefined;
  if (day >= 2 && Object.keys(recipe.syrups).length === 0 && recipe.milkAmount > 0 && Math.random() < 0.3) {
    const availSyrups = (Object.keys(SYRUP_META) as SyrupType[]).filter(
      (s) => SYRUP_META[s].unlockDay <= day
    );
    if (availSyrups.length > 0) {
      requestedSyrup = availSyrups[Math.floor(Math.random() * availSyrups.length)];
    }
  }
  if (day >= 2 && recipe.toppings.length === 0 && !recipe.isIced && Math.random() < 0.28) {
    const availTops = (Object.keys(TOPPING_META) as ToppingType[]).filter(
      (t) => TOPPING_META[t].unlockDay <= day && t !== 'matcha_dust'
    );
    if (availTops.length > 0) {
      requestedTopping = availTops[Math.floor(Math.random() * availTops.length)];
    }
  }

  const milkPhrase =
    requestedMilk !== 'none'
      ? requestedMilk === 'oat'
        ? 'with creamy oat milk'
        : requestedMilk === 'almond'
        ? 'with silky almond milk'
        : 'with whole milk'
      : '';
  const syrupPhrase = requestedSyrup ? ` and a pump of ${SYRUP_META[requestedSyrup].short}` : '';
  const topPhrase = requestedTopping ? `, topped with ${TOPPING_META[requestedTopping].short}` : '';

  const introFlavor =
    visitNumber === 1
      ? customer.visitLines[1]
      : customer.visitLines[Math.min(3, visitNumber)] ?? '';

  const article = /^[aeiou]/i.test(recipe.name) ? 'an' : 'a';
  const dialogue = `${introFlavor} Could I please have ${article} ${recipe.name}${
    milkPhrase ? ' ' + milkPhrase : ''
  }${syrupPhrase}${topPhrase}?`;

  const parts: string[] = [recipe.name];
  if (requestedMilk !== 'none') parts.push(MILK_META[requestedMilk].label);
  if (requestedSyrup) parts.push(`+${SYRUP_META[requestedSyrup].short}`);
  if (requestedTopping) parts.push(`+${TOPPING_META[requestedTopping].short}`);

  return {
    id: `${customer.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    customer,
    recipe,
    requestedMilk,
    requestedSyrup,
    requestedTopping,
    dialogue,
    plainOrderSummary: parts.join(' • '),
    visitNumber,
  };
}
