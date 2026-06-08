# Seeker UI Refresh — Plan & Resume Doc

Date started: 2026-06-08
Status: **Implementation complete (steps 1–8), typecheck passing.** Only remaining: on-device
verify (step 9) — run `npx expo run:android` on the connected Seeker to confirm fonts/shadows render.
See "DONE so far" for the full list of applied changes.

## Goal

Update the full UI of the **live Seeker app** so it matches the **new FundWise web UI** (the
"Playground" paper-and-ink design system). This is a visual-language port, not a recolor — the two
apps already share the same palette.

## Decisions (locked with the user 2026-06-08)

1. **Fonts:** Bundle the *real* FundWise brand faces (Tanker + General Sans + JetBrains Mono) via
   `expo-font`. Not the Google-font fallbacks. (Files already downloaded — see below.)
2. **Scope:** Only the live screen `src/screens/FundWiseSeekerAppScreen.tsx` + new `src/theme/*`
   + `App.tsx` font loader. Do **not** touch the unused alternates `SeekerOnboardingV2Screen.tsx`,
   `SeekerOnboardingScreen.tsx`, `SeekerHomeScreen.tsx`.
3. **Architecture:** Tokens + shared style helpers (extend `src/theme/`). Route existing inline
   styles through them. **No** full `src/ui/` component-library rewrite.

## Key facts discovered (so we don't re-investigate)

- **The palettes already match ~95%.** `src/theme/colors.ts` already equals FundWise brand tokens
  (cream `#F2ECDD`, lime `#C6F24A`, green `#2DB870`, blue `#4671D8`, ink `#16170F`, gold `#E8983B`,
  red `#E0594F`). This is NOT a recolor job.
- **Live screen** = `FundWiseSeekerAppScreen` (rendered by `App.tsx`). 6,163 lines.
- **All styles live in ONE `StyleSheet.create`** at line **3595 → ~6163**. Single deterministic
  surface to migrate.
- **`serif`/`mono` are single constants** — `FundWiseSeekerAppScreen.tsx:3578-3579`:
  `const serif = "serif"` / `const mono = "monospace"`. Swapping these two lines re-faces all 57
  `fontFamily: serif|mono` usages at once.
- **Hard-shadow primitives already exist** — `hardShadow` / `hardShadowSmall`,
  `FundWiseSeekerAppScreen.tsx:3580-3593` (offset 4/4 and 3/3, opacity 1, radius 0, ink color).
  They just need retuning to FundWise's 3/5/8px and broader application.
- **`fontWeight` distribution** in the StyleSheet: 300×3, 500×1, 600×11, 700×46, 800×15, 900×61
  (~137). These are the General-Sans body styles needing a per-weight family.
- **Android target:** Seeker is an Android phone. `fontWeight`-based weight selection on a single
  custom family is unreliable on Android RN — MUST register a separate family name per weight.
- The `verify:fundwise-sync` script is about **data/API contracts** (Telegram, settlements,
  assetlinks), NOT visuals — irrelevant to this work.
- FundWise loads Tanker/General Sans from the Fontshare CDN; its declared fallbacks are
  DM Serif Display / Plus Jakarta Sans / JetBrains Mono.

## Gap analysis (Seeker today → FundWise target)

| Dimension | Seeker today | FundWise target | Work |
|---|---|---|---|
| Typography | generic `serif`/`monospace`/system, no fonts bundled | Tanker display + General Sans + JetBrains Mono | **Biggest** — bundle + load + map weights |
| Hard shadows | partial `hardShadow*` consts, few applications | `3/5/8px 0 #16170F` offset shadow on every card/button | Retune + apply broadly |
| Press feedback | basic opacity | button-lift (press → translate +1,+1 + smaller shadow) | Add to AppButton/Pressables |
| Cards / badges | ad-hoc | `.fw-card` (border-2 + surface + hard-shadow-sm); mode badges green-pale/blue-pale pills | Presets + apply |
| Color tokens | ~95% match | + green-pale `#E9F6EE`, green-deep/forest, exact blue-pale `#E9EFFD`, purple, chart | Add missing tokens |

## DONE so far

Implemented 2026-06-08 (steps 1–8 below all complete; verified by `npm run typecheck`):
- ✅ `expo-font@~55.0.8` installed (config plugin auto-added to app.json by `expo install`).
- ✅ `src/theme/fonts.ts` created — `fonts` (per-weight family names), `fontAssets` (require map),
  `sansForWeight(w)`.
- ✅ `App.tsx` — `useFonts(fontAssets)`, render gated on `fontsLoaded` (renders `null` inside the
  cream SafeAreaView until ready); error-screen title re-faced to `fonts.display`.
- ✅ `src/theme/colors.ts` — added greenPale/greenDeep/greenForest/greenLight/greenMint,
  blueDeep/bluePale, purple/purplePale, redPale, amberPale (additive; existing keys untouched).
- ✅ `serif`/`mono` consts swapped to `fonts.display` / `fonts.mono` (re-faces all 57 usages).
- ✅ General Sans body codemod injected `fontFamily` into **84** StyleSheet entries
  (`/tmp/codemod-fonts.mjs`; per-weight via `sansForWeight`, size-only → `fonts.sans`; guarded against
  dup keys; verified 0 entries with 2+ fontFamily). Backup: `/tmp/FundWiseSeekerAppScreen.before.tsx`.
- ✅ Hard shadows: `hardShadow` retuned to 5/5; added `hardShadowLarge` (8/8) applied to the FAB
  (highest elevation). `hardShadowSmall` (3/3) unchanged.
- ✅ Press-lift: shared `pressed` style retuned to translate +2/+2 + shadow→1/1 (replaces old
  scale/opacity) — applies to AppButton + quickAction/groupCard/sheetAction/modeOption.
- ✅ Mode badges: `modeSplit` → greenPale bg / greenForest text; `modeFund` → exact `bluePale` token.

### Fonts — original download notes
- ✅ Downloaded the real TTFs into `FundWiseSeeker/assets/fonts/` (verified valid TrueType):
  - `Tanker-Regular.ttf`
  - `GeneralSans-Regular.ttf`, `GeneralSans-Medium.ttf`, `GeneralSans-Semibold.ttf`, `GeneralSans-Bold.ttf`
  - `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Medium.ttf`, `JetBrainsMono-SemiBold.ttf`
  - (Tanker + General Sans pulled from Fontshare CDN `.ttf` URLs; JetBrains Mono from the
    JetBrains/JetBrainsMono GitHub repo. Refetch script: `/tmp/fetch-fonts.mjs` — logic also noted below.)

## Implementation steps (resume here)

### 1. Add `expo-font`
- `package.json`: add `expo-font` (`~55.x` to match the Expo 55 SDK). Run install.

### 2. New `src/theme/fonts.ts`
Register one family name per weight (Android requirement). Export:
```ts
export const fonts = {
  display: "Tanker-Regular",
  sans: "GeneralSans-Regular",
  sansMedium: "GeneralSans-Medium",
  sansSemibold: "GeneralSans-Semibold",
  sansBold: "GeneralSans-Bold",
  mono: "JetBrainsMono-Regular",
  monoMedium: "JetBrainsMono-Medium",
  monoSemibold: "JetBrainsMono-SemiBold",
} as const;

export const fontAssets = {
  "Tanker-Regular": require("../../assets/fonts/Tanker-Regular.ttf"),
  "GeneralSans-Regular": require("../../assets/fonts/GeneralSans-Regular.ttf"),
  "GeneralSans-Medium": require("../../assets/fonts/GeneralSans-Medium.ttf"),
  "GeneralSans-Semibold": require("../../assets/fonts/GeneralSans-Semibold.ttf"),
  "GeneralSans-Bold": require("../../assets/fonts/GeneralSans-Bold.ttf"),
  "JetBrainsMono-Regular": require("../../assets/fonts/JetBrainsMono-Regular.ttf"),
  "JetBrainsMono-Medium": require("../../assets/fonts/JetBrainsMono-Medium.ttf"),
  "JetBrainsMono-SemiBold": require("../../assets/fonts/JetBrainsMono-SemiBold.ttf"),
};

// weight string -> General Sans family
export function sansForWeight(w?: string) {
  switch (w) {
    case "500": return fonts.sansMedium;
    case "600": return fonts.sansSemibold;
    case "700": case "800": case "900": return fonts.sansBold;
    default: return fonts.sans; // 300/400
  }
}
```

### 3. `App.tsx` — load fonts before render
- `import { useFonts } from "expo-font"` + `import { fontAssets } from "./src/theme/fonts"`.
- `const [fontsLoaded] = useFonts(fontAssets);`
- Gate: while `!fontsLoaded`, render the existing cream `SafeAreaView` (or null) so there is no
  flash of system font. (Optionally fold into the existing 2500ms BootScreen.)
- Note: `useFonts` + `require()` lets Metro bundle the TTFs automatically; no app.json change
  strictly required. If we later prefer build-time embedding, add the `expo-font` config plugin
  with a `fonts: [...]` array in `app.json`.

### 4. `src/theme/colors.ts` — add missing FundWise tokens (additive, keep existing keys)
```
greenPale: "#E9F6EE", greenDeep: "#0F5C40", greenForest: "#178654",
greenLight: "#A8EBC8", greenMint: "#78DCA9",
blueDeep: "#243B88", bluePale: "#E9EFFD",      // note: existing fundBluePale is #E8EDFF
purple: "#A05AE0", purplePale: "#F1E8FB",
redPale: "#FBE4DE", amberPale: "#FCEFDD",
```

### 5. Re-face serif/mono (the 2-line swap)
- `FundWiseSeekerAppScreen.tsx:3578` → `const serif = fonts.display;`
- `FundWiseSeekerAppScreen.tsx:3579` → `const mono = fonts.mono;`
- Add `import { fonts, sansForWeight } from "../theme/fonts";`

### 6. General Sans body migration (codemod over the single StyleSheet, lines 3595→end)
For each top-level style entry in `StyleSheet.create({...})`:
- Already has `fontFamily: serif` → leave (now Tanker).
- Already has `fontFamily: mono` → optionally upgrade to `fonts.monoSemibold`/`monoMedium` when the
  entry's `fontWeight` is ≥600/500; else leave.
- Has `fontWeight: "N"` and **no** `fontFamily` → inject `fontFamily: sansForWeight("N")`.
- Has `fontSize` but neither `fontFamily` nor `fontWeight` (implicit 400 text) → inject
  `fontFamily: fonts.sans`.
- Otherwise (View styles) → leave.
**Guard:** never inject a second `fontFamily` into an entry that already has one (would duplicate
the key). Operate per top-level entry; a simple brace-depth walk handles the one nested
`shadowOffset: { height, width }` case.

Implement as an ad-hoc Node codemod (parse the `styles` object by brace depth, transform entries,
write back), then eyeball the diff. Do NOT regex blindly across the whole file.

### 7. Hard shadows + press-lift
- Retune consts at `:3580-3593` to FundWise: `hardShadow` offset 5/5 (elevation 5),
  `hardShadowSmall` 3/3 (elevation 3); add `hardShadowLarge` 8/8 (elevation 8).
- Apply `hardShadowSmall` to card-style entries and `hardShadow` to elevated/primary buttons across
  the StyleSheet (cards currently lack consistent shadow).
- `AppButton` (`:580-612`): on `pressed`, translate `{ x: +1, y: +1 }` and drop to
  `hardShadowSmall` (FundWise's active "press-down"; the hover-lift has no touch equivalent).

### 8. Mode badges + final color alignment
- Check `ModeChip` styling. Split badge: bg `colors.greenPale` + text `colors.greenForest`.
  Fund badge: bg `colors.bluePale` + text `colors.fundBlue`. Pill, uppercase, mono.

### 9. Verify
- `npm run typecheck` (must pass).
- `npx expo run:android --port 8082` on the connected Seeker; confirm Tanker headings, General Sans
  body, JetBrains mono labels render, and hard shadows/press-lift look right.
- Capture screenshots via `bash scripts/seeker-device-qa.sh` (or the qa-evidence flow) for before/after.

## Risks / gotchas
- Android needs per-weight families (handled by `fontAssets` + `sansForWeight`).
- The codemod must not create duplicate `fontFamily` keys — guard per entry.
- General Sans tops out at 700; 800/900 map down to Bold (acceptable, matches FundWise which only
  loads General Sans 400–700).
- `mono` weighted labels: the single `mono` const covers most; weighted mono is an optional polish.
- Keep the diff inside the three files + `src/theme/*`; do not refactor unrelated code.
