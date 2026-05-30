const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new Map();

const PLAYER_COLORS = ['#ff3366', '#33ffcc', '#ffcc00', '#ff6600', '#cc33ff', '#33ccff'];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateCode() : code;
}

function getStartPositions() {
  return [
    { x: -6, y: 0.5, z: 22 },
    { x: -2, y: 0.5, z: 22 },
    { x: 2,  y: 0.5, z: 22 },
    { x: 6,  y: 0.5, z: 22 },
    { x: -4, y: 0.5, z: 18 },
    { x: 4,  y: 0.5, z: 18 },
  ];
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    host: room.host,
    status: room.status,
    startTime: room.startTime,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      position: p.position,
      rotation: p.rotation,
      speed: p.speed,
      lap: p.lap,
      finished: p.finished,
      finishTime: p.finishTime,
    })),
  };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', rooms: rooms.size }));

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  socket.on('create-room', ({ playerName }) => {
    const code = generateCode();
    const player = {
      id: socket.id,
      name: String(playerName).slice(0, 16),
      color: PLAYER_COLORS[0],
      position: { x: -6, y: 0.5, z: 22 },
      rotation: Math.PI / 2,
      speed: 0,
      lap: 1,
      checkpoint: false,
      finished: false,
      finishTime: null,
    };
    const room = { code, host: socket.id, players: [player], status: 'waiting', startTime: null };
    rooms.set(code, room);
    socket.join(code);
    socket.data.code = code;
    socket.data.name = playerName;
    socket.emit('room-created', { code, room: sanitizeRoom(room) });
    console.log(`[+] Room ${code} created by ${playerName}`);
  });

  socket.on('join-room', ({ code, playerName }) => {
    const roomCode = String(code).toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) { socket.emit('room-error', { message: 'Room not found. Check the code.' }); return; }
    if (room.status !== 'waiting') { socket.emit('room-error', { message: 'Race already in progress.' }); return; }
    if (room.players.length >= 6) { socket.emit('room-error', { message: 'Room is full (max 6 players).' }); return; }

    const positions = getStartPositions();
    const idx = room.players.length;
    const player = {
      id: socket.id,
      name: String(playerName).slice(0, 16),
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      position: positions[idx],
      rotation: Math.PI / 2,
      speed: 0,
      lap: 1,
      checkpoint: false,
      finished: false,
      finishTime: null,
    };
    room.players.push(player);
    socket.join(roomCode);
    socket.data.code = roomCode;
    socket.data.name = playerName;
    io.to(roomCode).emit('room-updated', sanitizeRoom(room));
    socket.emit('room-joined', { room: sanitizeRoom(room) });
    console.log(`[+] ${playerName} joined room ${roomCode} (${room.players.length} players)`);
  });

  socket.on('start-race', () => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room || room.host !== socket.id || room.status !== 'waiting') return;

    const positions = getStartPositions();
    room.players.forEach((p, i) => {
      p.position = positions[i] || positions[0];
      p.rotation = Math.PI / 2;
      p.speed = 0;
      p.lap = 1;
      p.checkpoint = false;
      p.finished = false;
      p.finishTime = null;
    });
    room.status = 'countdown';
    io.to(code).emit('race-countdown', { room: sanitizeRoom(room) });

    let count = 3;
    const tick = setInterval(() => {
      io.to(code).emit('countdown-tick', { count });
      count--;
      if (count < 0) {
        clearInterval(tick);
        room.status = 'racing';
        room.startTime = Date.now();
        io.to(code).emit('race-started', { startTime: room.startTime, room: sanitizeRoom(room) });
      }
    }, 1000);
  });

  socket.on('player-update', (data) => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room || room.status !== 'racing') return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.finished) return;
    player.position = data.position;
    player.rotation = data.rotation;
    player.speed = data.speed;
    player.lap = data.lap;
    player.checkpoint = data.checkpoint;
    socket.to(code).emit('player-state', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation,
      speed: data.speed,
      lap: data.lap,
    });
  });

  socket.on('player-finished', ({ time }) => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room || room.status !== 'racing') return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.finished) return;
    player.finished = true;
    player.finishTime = time;
    const place = room.players.filter((p) => p.finished).length;
    io.to(code).emit('player-finished-notice', { id: socket.id, name: player.name, place, time });
    if (place === room.players.length) {
      room.status = 'finished';
      const results = [...room.players]
        .sort((a, b) => (a.finishTime || 1e9) - (b.finishTime || 1e9))
        .map((p, i) => ({ ...p, place: i + 1 }));
      io.to(code).emit('race-complete', { results });
    }
  });

  socket.on('restart-race', () => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    room.status = 'waiting';
    room.startTime = null;
    room.players.forEach((p) => { p.finished = false; p.finishTime = null; p.lap = 1; p.checkpoint = false; });
    io.to(code).emit('race-reset', { room: sanitizeRoom(room) });
  });

  socket.on('disconnect', () => {
    const code = socket.data.code;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const name = socket.data.name || 'Player';
    room.players = room.players.filter((p) => p.id !== socket.id);
    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`[-] Room ${code} deleted`);
    } else {
      if (room.host === socket.id) room.host = room.players[0].id;
      io.to(code).emit('room-updated', sanitizeRoom(room));
      io.to(code).emit('player-left', { name });
    }
    console.log(`[-] ${name} left room ${code}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🏎  Neon Racer server on port ${PORT}`));
