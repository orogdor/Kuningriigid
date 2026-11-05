# V306 reference UI artwork

The user's selected reference is `02-6777.png` (1672 × 941), supplied 5 November 2026. Its broad gold/navy header, discovery medallion, curved side frames and six tall command cards are the visual contract.

Ten individual raster assets were generated with the built-in image generator for this UI:

- `card_cities.webp`, `card_build.webp`, `card_armies.webp`, `card_trade.webp`, `card_diplomacy.webp`, `card_journal.webp`: 448 px wide portrait cards, each a separate generation with the corresponding exact Estonian caption from the reference. Transparent outer corners, antique gold frames, parchment and historical oil-paint illustrations.
- `kingdom_portrait.webp`: 512 × 512 northern stone castle, used only for the empty-selection kingdom overview. Selected units retain their actual portraits.
- `settings.webp`, `pause.webp`, `play.webp`: 160 × 160 navy/gold circular controls. Pause and resume have distinct, accurate symbols.

The adjacent `*-prompt.txt` files record the individual prompts. Six card images together are about 821 KB. The consuming component clips only the transparent outer perimeter to exclude stray generator edge pixels.

Existing generated V302 blank frames, V303 painted round actions, V263 painted resource/action icons, the original reference brand and footer assets are reused. All values, selection names, research art and progress, queue entries and commands remain live. Painted card captions are Estonian, matching the selected reference; accessible names follow the game language.

The 140 V304 research paintings are preserved and still mapped by technology ID.
