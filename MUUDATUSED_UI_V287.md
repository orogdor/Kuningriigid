# V287 - maalitud maailmakaardi UI (valikuline)

V287 uses the V263 painterly WebP assets to give Kuningriigid an illustrated world-map interface inspired by the conversation mockup. This is real HTML/CSS with the original live game controls, not one large flat screenshot.

## Trial and rollback

- Try painted theme with ?ui=painted.
- Restore classic theme with ?ui=classic.
- The main menu also has an Interface: illustrated / classic toggle. Last selected theme is remembered locally.
- First-time visitors see the original game UI by default.
- Game logic and saved games remain V286 and are untouched.

## Implementation

- ui-painted-v287.css: illustrated resource bar, top title, dark blue and bronze image-backed plates, world-map minimap at bottom left, objectives top left, selected unit card bottom right, illustrated actions bottom center, compact mobile view.
- ui-painted-v287.js: toggles the visual class and adds a menu option, without replacing existing gameplay event handlers.
- Reuses ui-art-v263 assets. Numbers and active actions stay HTML and remain interactive.
- There is no artificial End Turn button: Kuningriigid is real-time (one minute equals one Civ-style turn).

## Validation

- All new artwork references exist in the current GitHub source tree.
- The new JavaScript is syntactically parseable.
- tests/ui-painted-v287.mjs checks asset files, URLs, links and original game control IDs.
- Fast GitHub CI was updated to include this test and node --check.
- Final desktop and Android UI visual testing remains necessary before the theme is made default.
