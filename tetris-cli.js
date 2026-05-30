#!/usr/bin/env node
'use strict';

// Usage: node tetris-cli.js <json_state> <move>
// move: l=left, r=right, u=rotate, d=softdrop, s=harddrop, h=hold, new=newgame

const COLS = 10, ROWS = 20;

const PIECES = {
  I: [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
  O: [[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]]],
  T: [[[0,1,0],[1,1,1],[0,0,0]],[[0,1,0],[0,1,1],[0,1,0]],[[0,0,0],[1,1,1],[0,1,0]],[[0,1,0],[1,1,0],[0,1,0]]],
  S: [[[0,1,1],[1,1,0],[0,0,0]],[[0,1,0],[0,1,1],[0,0,1]],[[0,0,0],[0,1,1],[1,1,0]],[[1,0,0],[1,1,0],[0,1,0]]],
  Z: [[[1,1,0],[0,1,1],[0,0,0]],[[0,0,1],[0,1,1],[0,1,0]],[[0,0,0],[1,1,0],[0,1,1]],[[0,1,0],[1,1,0],[1,0,0]]],
  J: [[[1,0,0],[1,1,1],[0,0,0]],[[0,1,1],[0,1,0],[0,1,0]],[[0,0,0],[1,1,1],[0,0,1]],[[0,1,0],[0,1,0],[1,1,0]]],
  L: [[[0,0,1],[1,1,1],[0,0,0]],[[0,1,0],[0,1,0],[0,1,1]],[[0,0,0],[1,1,1],[1,0,0]],[[1,1,0],[0,1,0],[0,1,0]]],
};

const PIECE_NAMES = ['I','O','T','S','Z','J','L'];

// ANSI Colors
const C = {
  I: '\x1b[96m', O: '\x1b[93m', T: '\x1b[95m',
  S: '\x1b[92m', Z: '\x1b[91m', J: '\x1b[94m', L: '\x1b[33m',
  ghost: '\x1b[90m', empty: '\x1b[38;5;235m',
  border: '\x1b[36m', label: '\x1b[93m', score: '\x1b[97m',
  reset: '\x1b[0m', cyan: '\x1b[96m', pink: '\x1b[91m',
};

const BLOCK = '██';
const GHOST = '░░';
const EMPTY = '· ';

function randPiece(bag) {
  if (!bag || !bag.length) bag = [...PIECE_NAMES].sort(() => Math.random() - 0.5);
  const p = bag[bag.length - 1];
  return { piece: p, bag: bag.slice(0, -1) };
}

function getShape(name, rot) {
  return PIECES[name][rot % PIECES[name].length];
}

function collides(board, shape, x, y) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
  return false;
}

function ghostY(board, shape, x, y) {
  let gy = y;
  while (!collides(board, shape, x, gy + 1)) gy++;
  return gy;
}

function place(board, shape, x, y, name) {
  const nb = board.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && y + r >= 0)
        nb[y + r][x + c] = name;
  return nb;
}

function clearLines(board) {
  let cleared = 0;
  let nb = board.filter(row => !row.every(c => c !== 0));
  cleared = ROWS - nb.length;
  while (nb.length < ROWS) nb.unshift(new Array(COLS).fill(0));
  return { board: nb, cleared };
}

function newGame() {
  const b1 = randPiece([]);
  const b2 = randPiece(b1.bag);
  const b3 = randPiece(b2.bag);
  const x = Math.floor(COLS / 2) - 1;
  return {
    board: Array.from({ length: ROWS }, () => new Array(COLS).fill(0)),
    piece: b1.piece, rot: 0, x, y: -1,
    next: b2.piece, bag: b2.bag,
    hold: null, canHold: true,
    score: 0, lines: 0, level: 1,
    combo: 0, over: false,
  };
}

function spawnPiece(state) {
  const { piece: p, bag } = randPiece(state.bag);
  const x = Math.floor(COLS / 2) - 1;
  const y = -1;
  const shape = getShape(state.next, 0);
  if (collides(state.board, shape, x, y + 1)) {
    return { ...state, over: true };
  }
  return { ...state, piece: state.next, rot: 0, x, y, next: p, bag, canHold: true };
}

function applyMove(state, move) {
  if (state.over) return state;
  let { board, piece, rot, x, y, next, bag, hold, canHold, score, lines, level, combo } = state;
  const shape = getShape(piece, rot);

  if (move === 'l') {
    if (!collides(board, shape, x - 1, y)) x--;
  } else if (move === 'r') {
    if (!collides(board, shape, x + 1, y)) x++;
  } else if (move === 'u') {
    // Rotate with wall kick
    const newRot = (rot + 1) % PIECES[piece].length;
    const ns = getShape(piece, newRot);
    const kicks = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];
    for (const [dx, dy] of kicks) {
      if (!collides(board, ns, x + dx, y + dy)) {
        x += dx; y += dy; rot = newRot; break;
      }
    }
  } else if (move === 'h') {
    if (canHold) {
      if (!hold) {
        const nb = randPiece(bag);
        hold = piece;
        piece = state.next;
        next = nb.piece; bag = nb.bag;
      } else {
        [piece, hold] = [hold, piece];
      }
      rot = 0;
      x = Math.floor(COLS / 2) - 1;
      y = -1;
      canHold = false;
    }
  } else if (move === 'd') {
    if (!collides(board, shape, x, y + 1)) {
      y++;
    } else {
      // Lock
      board = place(board, shape, x, y, piece);
      const cl = clearLines(board);
      board = cl.board;
      if (cl.cleared > 0) {
        combo++;
        const pts = [0,100,300,500,800][cl.cleared] * level;
        score += pts + (combo > 1 ? (combo-1)*50*level : 0);
        lines += cl.cleared;
        level = Math.floor(lines / 10) + 1;
      } else {
        combo = 0;
      }
      return spawnPiece({ board, piece, rot, x, y, next, bag, hold, canHold, score, lines, level, combo, over: false });
    }
  } else if (move === 's') {
    // Hard drop
    const gy = ghostY(board, shape, x, y);
    score += (gy - y) * 2;
    y = gy;
    board = place(board, shape, x, y, piece);
    const cl = clearLines(board);
    board = cl.board;
    if (cl.cleared > 0) {
      combo++;
      const pts = [0,100,300,500,800][cl.cleared] * level;
      score += pts + (combo > 1 ? (combo-1)*50*level : 0);
      lines += cl.cleared;
      level = Math.floor(lines / 10) + 1;
    } else {
      combo = 0;
    }
    return spawnPiece({ board, piece, rot, x, y, next, bag, hold, canHold, score, lines, level, combo, over: false });
  }

  return { board, piece, rot, x, y, next, bag, hold, canHold, score, lines, level, combo, over: false };
}

function render(state) {
  const { board, piece, rot, x, y, next, hold, score, lines, level, over } = state;
  const shape = over ? null : getShape(piece, rot);
  const gy = over ? null : ghostY(board, shape, x, y);

  const lines2D = [];

  // Header
  lines2D.push(`${C.border}╔${'══'.repeat(COLS)}╗${C.reset}`);

  for (let r = 0; r < ROWS; r++) {
    let row = `${C.border}║${C.reset}`;
    for (let c = 0; c < COLS; c++) {
      let cell = board[r][c];
      let isPiece = false, isGhost = false;

      if (!over && shape) {
        for (let pr = 0; pr < shape.length; pr++)
          for (let pc = 0; pc < shape[pr].length; pc++)
            if (shape[pr][pc]) {
              if (x + pc === c && y + pr === r) isPiece = true;
              if (x + pc === c && gy + pr === r) isGhost = true;
            }
      }

      if (isPiece) row += `${C[piece]}${BLOCK}${C.reset}`;
      else if (cell) row += `${C[cell]}${BLOCK}${C.reset}`;
      else if (isGhost && gy !== y) row += `${C.ghost}${GHOST}${C.reset}`;
      else row += `${C.empty}${EMPTY}${C.reset}`;
    }
    row += `${C.border}║${C.reset}`;

    // Side panel
    if (r === 0) row += `  ${C.cyan}┌─────────────┐${C.reset}`;
    else if (r === 1) row += `  ${C.cyan}│${C.reset} ${C.label}NEON TETRIS${C.reset}  ${C.cyan}│${C.reset}`;
    else if (r === 2) row += `  ${C.cyan}└─────────────┘${C.reset}`;
    else if (r === 4) row += `  ${C.label}SCORE${C.reset}`;
    else if (r === 5) row += `  ${C.score}${String(score).padStart(13)}${C.reset}`;
    else if (r === 7) row += `  ${C.label}LEVEL  LINES${C.reset}`;
    else if (r === 8) row += `  ${C.score}${String(level).padStart(6)}  ${String(lines).padStart(5)}${C.reset}`;
    else if (r === 10) row += `  ${C.label}HOLD${C.reset}`;
    else if (r >= 11 && r <= 13) {
      const hi = r - 11;
      if (hold) {
        const hs = getShape(hold, 0);
        if (hi < hs.length) {
          row += '  ';
          for (let c2 = 0; c2 < 4; c2++) {
            row += (c2 < hs[hi].length && hs[hi][c2]) ? `${C[hold]}${BLOCK}${C.reset}` : '  ';
          }
        } else row += '';
      }
    }
    else if (r === 15) row += `  ${C.label}NEXT${C.reset}`;
    else if (r >= 16 && r <= 18) {
      const ni = r - 16;
      if (next) {
        const ns = getShape(next, 0);
        if (ni < ns.length) {
          row += '  ';
          for (let c2 = 0; c2 < 4; c2++) {
            row += (c2 < ns[ni].length && ns[ni][c2]) ? `${C[next]}${BLOCK}${C.reset}` : '  ';
          }
        }
      }
    }

    lines2D.push(row);
  }

  lines2D.push(`${C.border}╚${'══'.repeat(COLS)}╝${C.reset}`);

  if (over) {
    lines2D.push('');
    lines2D.push(`${C.pink}  ██████╗  █████╗ ███╗   ███╗███████╗${C.reset}`);
    lines2D.push(`${C.pink}  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝${C.reset}`);
    lines2D.push(`${C.pink}  ██║  ███╗███████║██╔████╔██║█████╗${C.reset}`);
    lines2D.push(`${C.pink}  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝${C.reset}`);
    lines2D.push(`${C.pink}  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗${C.reset}`);
    lines2D.push(`${C.pink}   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ OVER${C.reset}`);
    lines2D.push('');
    lines2D.push(`  ${C.label}→ "new" で新しいゲーム${C.reset}`);
  } else {
    lines2D.push('');
    lines2D.push(`  ${C.label}l${C.reset}=左  ${C.label}r${C.reset}=右  ${C.label}u${C.reset}=回転  ${C.label}d${C.reset}=落下  ${C.label}s${C.reset}=即落下  ${C.label}h${C.reset}=ホールド`);
  }

  return lines2D.join('\n');
}

// Main
const args = process.argv.slice(2);
const stateJson = args[0];
const move = args[1] || '';

let state;
if (!stateJson || stateJson === 'new' || move === 'new') {
  state = newGame();
  state = spawnPiece({ ...state, next: state.next });
  // Fix: ensure first piece is properly set
  const g = randPiece([]);
  const g2 = randPiece(g.bag);
  state = {
    board: Array.from({ length: ROWS }, () => new Array(COLS).fill(0)),
    piece: g.piece, rot: 0,
    x: Math.floor(COLS / 2) - 1, y: -1,
    next: g2.piece, bag: g2.bag,
    hold: null, canHold: true,
    score: 0, lines: 0, level: 1, combo: 0, over: false,
  };
} else {
  try {
    state = JSON.parse(stateJson);
  } catch {
    state = newGame();
  }
  if (move) state = applyMove(state, move);
}

// Auto-drop if still at top
const shape = getShape(state.piece, state.rot);
if (!collides(state.board, shape, state.x, state.y + 1) && state.y < 0) {
  // piece can still fall - this is fine
}

// Output JSON state + rendered board
const output = {
  state: JSON.stringify(state),
  board: render(state),
};

process.stdout.write(output.board + '\n\n');
// Output state as JSON comment for next turn
process.stdout.write(`__STATE__${output.state}__STATE__\n`);
