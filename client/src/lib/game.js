// Logic bàn cờ thuần (không phụ thuộc React). Server sẽ dùng lại đúng hàm này.
export const SIZE = 15
export const WIN = 5
export const TURN_TIME = 30

export const createBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null))

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]]

// Trả về mảng các ô thắng (>= 5 quân liên tiếp) hoặc null
export function checkWin(board, x, y, symbol, need = WIN) {
  for (const [dx, dy] of DIRS) {
    const line = [[x, y]]
    for (const s of [1, -1]) {
      let i = x + dx * s
      let j = y + dy * s
      while (board[j]?.[i] === symbol) {
        line.push([i, j])
        i += dx * s
        j += dy * s
      }
    }
    if (line.length >= need) return line
  }
  return null
}

export function boardFromMoves(moves, upTo = moves.length) {
  const b = createBoard()
  moves.slice(0, upTo).forEach((m) => { b[m.y][m.x] = m.s })
  return b
}

// Đối thủ giả lập (AI đơn giản) để FE chơi được khi chưa có backend
const COUNT_SCORE = [1, 10, 100, 1000, 100000]
function scoreCell(board, x, y, sym) {
  let total = 0
  for (const [dx, dy] of DIRS) {
    let n = 0
    let open = 0
    for (const s of [1, -1]) {
      let i = x + dx * s
      let j = y + dy * s
      while (board[j]?.[i] === sym) { n++; i += dx * s; j += dy * s }
      if (board[j]?.[i] === null) open++
    }
    total += COUNT_SCORE[Math.min(n, 4)] * (open === 2 ? 2 : open === 1 ? 1 : 0.1)
  }
  return total
}

export function aiMove(board, me = 'O', foe = 'X') {
  let best = null
  let bestScore = -1
  let hasStone = false
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x]) { hasStone = true; continue }
      let near = false
      for (let dy = -2; dy <= 2 && !near; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (board[y + dy]?.[x + dx]) { near = true; break }
        }
      }
      if (!near) continue
      const s = scoreCell(board, x, y, me) * 1.1 + scoreCell(board, x, y, foe) + Math.random()
      if (s > bestScore) { bestScore = s; best = { x, y } }
    }
  }
  if (!hasStone) return { x: 7, y: 7 }
  return best || { x: 7, y: 7 }
}

// Tạo nước đi mẫu cho dữ liệu giả (replay)
export function makeMoves(result) {
  const win = [[7, 7], [8, 7], [9, 7], [10, 7], [11, 7]]
  const other = [[7, 8], [8, 8], [9, 8], [10, 8], [3, 3]]
  const scatter = [[3, 3], [5, 10], [1, 12], [12, 2], [2, 6]]
  const out = []
  if (result === 'lose') {
    for (let i = 0; i < 5; i++) {
      out.push({ x: scatter[i][0], y: scatter[i][1], s: 'X' })
      out.push({ x: win[i][0], y: win[i][1], s: 'O' })
    }
  } else {
    const n = result === 'draw' ? 4 : 5
    for (let i = 0; i < n; i++) {
      out.push({ x: win[i][0], y: win[i][1], s: 'X' })
      if (i < 4 || result === 'draw') out.push({ x: other[i][0], y: other[i][1], s: 'O' })
    }
  }
  return out
}
