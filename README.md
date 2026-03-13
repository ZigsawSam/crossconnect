# CrossConnect 🇮🇳

> Cross-regional question game connecting players from different Indian states via P2P WebRTC.

**100% free. No server. No login. No cost.**

## How to Play

1. Open the game and enter your name, state, and city
2. **Player 1** clicks "Create Room" → shares the 6-letter code
3. **Player 2** clicks "Join Room" → enters the code
4. Player 1 clicks "Start Game" once connected
5. Answer all 10 questions as fast as possible
6. Fastest player wins the 🗝️ and unlocks the chat

## Tech Stack

- **Frontend**: Vanilla HTML + CSS + JS (no framework, no build step)
- **P2P**: [PeerJS](https://peerjs.com/) (WebRTC) — no backend needed
- **Hosting**: Works on any static host (GitHub Pages, Vercel, Netlify)

## Running Locally

Just open `index.html` in a browser — no install needed.

```bash
# Or serve with any static server
npx serve .
# Then open http://localhost:3000
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crossconnect.git
git push -u origin main
```

Then in GitHub → Settings → Pages → Source: `main` branch → `/` (root).

Your game will be live at `https://YOUR_USERNAME.github.io/crossconnect`

## Deploy to Vercel (free)

```bash
npx vercel
```

## Features

- 🗺️ All 30 Indian states
- ❓ 10 region-themed questions
- ⚡ Speed race mechanic with live progress bars
- 🗝️ Winner unlocks the chat
- 💬 Real-time P2P chat (no server)
- 🚫 Client-side vulgarity filter
- 📱 Mobile-first PWA (installable)

## Cost

**₹0 forever.** PeerJS uses free public STUN/TURN servers.
For production scale (1000+ users), self-host PeerJS server on Render free tier.

## Project Structure

```
crossconnect/
├── index.html      # All screens and styles
├── game.js         # Game logic, P2P, chat
├── manifest.json   # PWA manifest
├── sw.js           # Service worker (offline support)
└── README.md
```
