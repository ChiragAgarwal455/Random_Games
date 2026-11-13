# ☕ Paper & Pour — A Cozy 2.5D Sketchbook Barista Story

A hand-painted gouache barista game inspired by *Good Pizza, Great Pizza* / *Good Coffee, Great Coffee*, featuring real-time shallow-water fluid physics, 2D semi-Lagrangian latte art pouring, procedural Web Audio café ASMR (including purring & meowing café cats!), real-life barista education, and an expandable multi-tier neighborhood coffeehouse.

---

## ✨ Key Features

- **Warm Hand-Painted Gouache Aesthetic**: Rich terracotta plaster, wooden counter bevels, awning trim, textured ink outlines, and cold-press watercolor paper grain.
- **2.5D Tactile Barista Workflow**:
  - Pick ceramic mugs, tall iced glasses, wide latte bowls, or unlockable **Calico Whisker**, **Mossy Froggy**, and **Starry Owl** mugs.
  - Grind fresh beans, tamp grounds level, pull double/single crema espresso shots, steam milk toward the **60–65 °C sweetness sweet spot**, whisk ceremonial matcha & dark cocoa, drop bobbing ice cubes, pump flavored syrups, and sprinkle toppings.
- **Fluid Simulation & Freehand Latte Art**:
  - 28-node shallow-water slosh waves + 84×84 velocity-advected surface foam allowing free-pour hearts, tulips, bears, swirls, and wooden-skewer etching.
- **Cozy Cat Waiting Lounge**:
  - Upcoming guests sit and pet friendly café cats (**Miso**, **Biscuit**, and **Sesame**), or you can click any kitty yourself to hear procedural Web Audio purrs and meows!
- **Time-Based Patience & Expressive Characters**:
  - Watch customers shift subtly from warm smiles to impatient eyelid-taps and comic frustration puffs as their patience meter ticks down—with tips scaling naturally with promptness.
- **Real-Life Barista Tips & Field Guide**:
  - Occasional field notes pop up softly during service (why 60–65 °C milk tastes sweetest, 1:2 espresso brew ratios, W-motion matcha whisking, channeling, and more), with all **18 educational tips** browsable anytime in **Recipes & Guide**.
- **8-Track Multi-Tier Café Upgrades Shop**:
  - Invest earnings across **8 upgrade tracks × 3 tiers (24 upgrades)**—lighting, greenery, cat lounge, wall gallery, music corner, pastry counter charm, grinder/steamer barista gear, and hospitality seating—plus collectible mugs & window weather moods.
- **100% Zero-Asset Procedural Web Audio ASMR**:
  - Gentle rain, café murmur, acoustic guitar lo-fi chimes, coffee grinding, steam wand hiss, espresso trickle, ice clinks, and cat purr/meow synthesis—zero external MP3/CDN files required.

---

## 🚀 Quick Deploy to GitHub Pages

This repository is pre-configured for **automated GitHub Pages deployment** via GitHub Actions (`.github/workflows/deploy.yml`) and uses relative bundle paths (`base: './'`) so it runs seamlessly at `https://<your-username>.github.io/<your-repo>/`.

1. **Create a new GitHub repository** (for example, `paper-and-pour`).
2. **Push this project to `main`**:
   ```bash
   git add .
   git commit -m "Initial Paper & Pour cozy barista game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Open your repository on GitHub → **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **GitHub Actions**.
   - GitHub automatically builds and publishes your live playable game within ~60 seconds!

---

## 🛠️ Local Development

```bash
npm install
npm run dev        # Start local Vite dev server
npm run typecheck  # Run strict TypeScript check (tsc --noEmit)
npm run build      # Output static production bundle to ./dist
npm run preview    # Preview built ./dist bundle locally
```

---

## 📁 Project Structure

```text
paper-and-pour/
├── .github/workflows/deploy.yml   # Automated GitHub Pages CI/CD pipeline
├── public/
│   ├── .nojekyll                  # Bypass Jekyll processing on GitHub Pages
│   └── favicon.svg                # Steaming sketchbook mug favicon
├── src/
│   ├── art/                       # 2.5D gouache renderers (scene, cups, characters, cat lounge)
│   ├── audio/                     # Procedural Web Audio ASMR & cat purr/meow synthesizer
│   ├── components/                # React HUD, Sketchbook Diary, Recipes & Guide, Tiered Shop
│   ├── data/                      # Recipes, 18 real barista tips, 8x3 shop tracks, story & guests
│   ├── fluid/                     # Shallow-water wave slosh & 2D latte art fluid advection sims
│   ├── types/                     # Strict TypeScript definitions
│   ├── App.tsx                    # Main 60fps simulation loop & game state
│   └── main.tsx                   # React root mount
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📄 License

[MIT](./LICENSE)
