# NEON RACER 🏎️

A high-energy 3D multiplayer racing game built with React, Three.js, and Socket.io.

## Features

- **Real-time multiplayer** — up to 6 players per race via unique 6-character room codes
- **3D track** — circular neon-lit circuit built with Three.js / React Three Fiber
- **Smooth physics** — acceleration, braking, drift, track boundary constraints
- **Cyberpunk UI** — Tailwind CSS with neon glow effects, glassmorphism cards, animated grid
- **Live HUD** — speed gauge, lap counter, position tracker, minimap, live standings
- **Race lifecycle** — lobby → countdown → race → results → restart

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend 3D | React Three Fiber + Three.js |
| Frontend UI | React + Tailwind CSS |
| Realtime | Socket.io |
| Backend | Node.js + Express + Socket.io |
| Build | Vite |

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Run both server and client in dev mode
npm run dev
```

- **Game client**: http://localhost:5173
- **API server**: http://localhost:3001

## Controls

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Brake / Reverse |
| A / ← | Steer left |
| D / → | Steer right |

## How to Play

1. Open the game at `localhost:5173`
2. Enter your driver name and click **CREATE RACE** or **JOIN RACE**
3. Share the 6-character room code with friends
4. The host clicks **START RACE** to begin
5. Complete **3 laps** to win — the race ends when all players finish

## Architecture

```
/
├── server/          # Express + Socket.io backend
│   └── index.js     # Room management, game state, real-time sync
└── client/          # React frontend
    └── src/
        ├── App.jsx                  # Root state + socket lifecycle
        ├── screens/
        │   ├── HomeScreen.jsx       # Create/join UI
        │   └── LobbyScreen.jsx      # Pre-race lobby
        └── game/
            ├── GameScreen.jsx       # Game container + results
            ├── GameCanvas.jsx       # R3F canvas, physics loop, camera
            ├── Track.jsx            # 3D circular track geometry
            ├── Car.jsx              # Car model (unused, logic in Canvas)
            ├── HUD.jsx              # Speed, laps, minimap overlay
            └── physics.js           # Car physics + lap detection
```
