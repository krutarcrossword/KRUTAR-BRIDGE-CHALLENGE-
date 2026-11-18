# KRUTAR BRIDGE CHALLENGE v0.1

A static, mobile-friendly introductory Contract Bridge game for GitHub Pages.

## Mission 01
- South (human declarer) and North (dummy) vs East/West AI defenders
- Contract: **2♠**, target **8 of 13 tricks**
- Fixed validated 52-card deal, reproducible on restart
- Follow-suit and trump rules, 13-trick gameplay, hints, results
- Thai-first interface, landscape layout, touch-friendly controls

## Deploy to GitHub Pages
1. Create a new repository named `krutar-bridge-challenge`.
2. Upload `index.html`, `style.css`, and `game.js` to the repository root.
3. In **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. Open the URL shown in GitHub Pages after deployment.

No build process or server is required.

## Notes
- v0.1 is a guided training game; bidding, duplicate bridge scoring, and multiplayer are not yet implemented.
- East/West use a deterministic heuristic AI; this is a learning prototype, not a competitive bridge engine.
- North is displayed as dummy after the opening lead; South controls both declarer and dummy cards.
- This build uses a fixed deal; it does not guarantee success for every line of play.
- Hint suggestions are informational, not guaranteed optimal moves.
