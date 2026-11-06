// Server realtime cho X-O Arena (Socket.IO). Chạy: cd server && npm install && npm start
// Dùng lại đúng logic bàn cờ của client (client/src/lib/game.js).
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { SIZE, TURN_TIME, checkWin, createBoard } from '../client/src/lib/game.js'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ===== Tài khoản (lưu vào server/users.json) =====
const DB_FILE = new URL('./users.json', import.meta.url)
const SECRET = process.env.JWT_SECRET || 'doi-chuoi-nay-truoc-khi-deploy'
let users = []
try { users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch {}
const saveUsers = () => fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2))
const safe = ({ hash, ...u }) => u
const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '30d' })

// ===== Tài khoản chính Nguyễn Duyên: lưu dữ liệu lên server (server/main-account.json) =====
const MAIN_FILE = new URL('./main-account.json', import.meta.url)
const MAIN_PASS = process.env.MAIN_PASS || '' // đặt qua biến môi trường MAIN_PASS (không để trong code)
let mainData = null
try { mainData = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf8')) } catch {}

// ===== Bảng xếp hạng thật (server/leaderboard.json) — server tự tính kết quả từng ván =====
const LB_FILE = new URL('./leaderboard.json', import.meta.url)
const SCORE = { win: 30, draw: 10, lose: -10 } // điểm xếp hạng mỗi ván (không xuống dưới 0)
let lb = {}
try { lb = JSON.parse(fs.readFileSync(LB_FILE, 'utf8')) } catch {}
const saveLb = () => { try { fs.writeFileSync(LB_FILE, JSON.stringify(lb)) } catch {} }
const lbKey = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')
function recordResult(info, result) {
  if (!info || info.guest) return // khách không lên bảng
  const k = lbKey(info.name)
  if (!k) return
  const e = lb[k] || (lb[k] = { name: info.name, avatar: info.avatar, level: info.level, wins: 0, draws: 0, losses: 0, score: 0 })
  e.name = info.name; e.avatar = info.avatar; e.level = Math.max(e.level || 1, info.level || 1)
  if (result === 'win') e.wins++; else if (result === 'draw') e.draws++; else e.losses++
  e.score = Math.max(0, (e.score || 0) + SCORE[result])
  e.updatedAt = Date.now()
}
const topPlayers = () => Object.values(lb)
  .sort((a, b) => b.score - a.score || b.wins - a.wins || (a.updatedAt || 0) - (b.updatedAt || 0))
  .slice(0, 100)

// ===== Bạn bè (server/friends.json): { key: { friends: [key], incoming: [{key, name}] } } =====
const FR_FILE = new URL('./friends.json', import.meta.url)
let fr = {}
try { fr = JSON.parse(fs.readFileSync(FR_FILE, 'utf8')) } catch {}
const saveFr = () => { try { fs.writeFileSync(FR_FILE, JSON.stringify(fr)) } catch {} }
const frOf = (k) => fr[k] || (fr[k] = { friends: [], incoming: [] })
const card = (k) => lb[k] || { name: k, avatar: '🧑', level: 1, wins: 0, draws: 0, losses: 0, score: 0 }
function friendsApi(b) {
  const me = lbKey(b.me), to = lbKey(b.to)
  if (!me) return [400, { error: 'Thiếu tên người chơi.' }]
  const mine = frOf(me)
  if (b.action === 'add') {
    if (!to || to === me) return [400, { error: 'Tên không hợp lệ.' }]
    if (!lb[to]) return [404, { error: 'Không tìm thấy người chơi này (người đó phải từng đấu online).' }]
    if (mine.friends.includes(to)) return [409, { error: 'Hai bạn đã là bạn bè.' }]
    const other = frOf(to)
    if (mine.incoming.some((x) => x.key === to)) { // họ đã mời mình trước -> tự chấp nhận
      mine.incoming = mine.incoming.filter((x) => x.key !== to)
      mine.friends.push(to); other.friends.push(me)
    } else if (!other.incoming.some((x) => x.key === me)) other.incoming.push({ key: me, name: String(b.myName || b.me).slice(0, 24) })
  } else if (b.action === 'accept') {
    if (!mine.incoming.some((x) => x.key === to)) return [404, { error: 'Không có lời mời này.' }]
    mine.incoming = mine.incoming.filter((x) => x.key !== to)
    if (!mine.friends.includes(to)) mine.friends.push(to)
    const other = frOf(to); if (!other.friends.includes(me)) other.friends.push(me)
  } else if (b.action === 'decline') {
    mine.incoming = mine.incoming.filter((x) => x.key !== to)
  } else if (b.action === 'remove') {
    mine.friends = mine.friends.filter((x) => x !== to)
    const other = frOf(to); other.friends = other.friends.filter((x) => x !== me)
  } else if (b.action !== 'list') return [400, { error: 'Hành động không hợp lệ.' }]
  saveFr()
  return [200, { friends: mine.friends.map(card), incoming: mine.incoming.map((x) => ({ ...card(x.key), key: x.key, name: lb[x.key]?.name || x.name })) }]
}

const send = (res, code, data) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  })
  res.end(JSON.stringify(data))
}
const readBody = (req) => new Promise((ok) => {
  let s = ''
  req.on('data', (c) => { s += c; if (s.length > 5e6) req.destroy() })
  req.on('end', () => { try { ok(JSON.parse(s || '{}')) } catch { ok({}) } })
})
const authUser = (req) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '')
    return users.find((u) => u.id === jwt.verify(t, SECRET).id) || null
  } catch { return null }
}

async function api(req, res) {
  const url = req.url.split('?')[0]
  if (req.method === 'OPTIONS') return send(res, 200, {})

  if (req.method === 'POST' && url === '/api/friends') {
    const [code, data] = friendsApi(await readBody(req))
    return send(res, code, data)
  }
  if (req.method === 'GET' && url === '/api/leaderboard') return send(res, 200, { players: topPlayers() })

  if (req.method === 'POST' && url === '/api/main/load') {
    const b = await readBody(req)
    if (!MAIN_PASS || b.pass !== MAIN_PASS) return send(res, 401, { error: 'Sai mật khẩu.' })
    return send(res, 200, { data: mainData })
  }
  if (req.method === 'POST' && url === '/api/main/save') {
    const b = await readBody(req)
    if (!MAIN_PASS || b.pass !== MAIN_PASS) return send(res, 401, { error: 'Sai mật khẩu.' })
    if (!b.user || typeof b.user !== 'object') return send(res, 400, { error: 'Thiếu dữ liệu.' })
    // chỉ ghi đè khi bản gửi lên mới hơn hoặc bằng bản đang lưu
    if (!mainData || (b.user.updatedAt || 0) >= (mainData.user?.updatedAt || 0)) {
      mainData = { user: b.user, matches: Array.isArray(b.matches) ? b.matches.slice(0, 500) : [] }
      fs.writeFileSync(MAIN_FILE, JSON.stringify(mainData))
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'POST' && url === '/api/register') {
    const { email, password, name, birthday } = await readBody(req)
    const em = String(email || '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(em)) return send(res, 400, { error: 'Email không hợp lệ.' })
    if (String(password || '').length < 6) return send(res, 400, { error: 'Mật khẩu tối thiểu 6 ký tự.' })
    if (!String(name || '').trim()) return send(res, 400, { error: 'Vui lòng nhập họ và tên.' })
    if (users.some((u) => u.email === em)) return send(res, 409, { error: 'Email này đã được đăng ký.' })
    const u = {
      id: randomUUID(), email: em, name: String(name).trim().slice(0, 24), birthday: birthday || '',
      avatar: '🧑', level: 1, exp: 0, hash: bcrypt.hashSync(password, 10), createdAt: Date.now(),
    }
    users.push(u); saveUsers()
    return send(res, 200, { token: sign(u), user: safe(u) })
  }

  if (req.method === 'POST' && url === '/api/login') {
    const { id, password } = await readBody(req)
    const key = String(id || '').trim().toLowerCase()
    const u = users.find((x) => x.email === key || x.name.toLowerCase() === key)
    if (!u || !bcrypt.compareSync(String(password || ''), u.hash))
      return send(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu.' })
    return send(res, 200, { token: sign(u), user: safe(u) })
  }

  if (url === '/api/me') {
    const u = authUser(req)
    if (!u) return send(res, 401, { error: 'Chưa đăng nhập.' })
    if (req.method === 'GET') return send(res, 200, { user: safe(u) })
    if (req.method === 'PATCH') {
      const b = await readBody(req)
      if (typeof b.name === 'string' && b.name.trim()) u.name = b.name.trim().slice(0, 24)
      if (typeof b.avatar === 'string' && b.avatar.length < 500_000) u.avatar = b.avatar
      for (const k of ['level', 'exp']) if (Number.isFinite(b[k])) u[k] = b[k]
      saveUsers()
      return send(res, 200, { user: safe(u) })
    }
  }
  send(res, 404, { error: 'Không tìm thấy' })
}
const PORT = process.env.PORT || 3001
const httpServer = createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api(req, res)
  res.writeHead(200); res.end('X-O Arena server OK')
})
const io = new Server(httpServer, { cors: { origin: true } })

/** @type {Map<string, any>} */
const rooms = new Map()
let quickWaiting = null // socket đang chờ ghép nhanh

const pub = (u) => ({ name: String(u?.name || 'Người chơi').slice(0, 24), level: Number(u?.level) || 1, avatar: u?.avatar || '🧑', guest: !!u?.guest })
const playersOf = (r) => r.players.map((p) => ({ ...p.info, sym: p.sym }))
const symOf = (r, sock) => r.players.find((p) => p.id === sock.id)?.sym

function newRoom(code) {
  const r = { code, players: [], board: createBoard(), moves: [], turn: 'X', started: false, over: null, timer: null, deadline: 0, drawFrom: null }
  rooms.set(code, r)
  return r
}

function startTurnTimer(r) {
  clearTimeout(r.timer)
  r.deadline = Date.now() + TURN_TIME * 1000
  r.timer = setTimeout(() => finish(r, { winner: r.turn === 'X' ? 'O' : 'X', reason: 'timeout' }), TURN_TIME * 1000 + 800)
}

function finish(r, over) {
  if (r.over) return
  clearTimeout(r.timer)
  r.over = over
  if (r.players.length === 2) { // ghi kết quả lên bảng xếp hạng
    for (const p of r.players) recordResult(p.info, over.winner ? (over.winner === p.sym ? 'win' : 'lose') : 'draw')
    saveLb()
  }
  io.to(r.code).emit('game:over', over)
    r.cleanup = setTimeout(() => rooms.delete(r.code), 60_000)
}

function startGame(r) {
  r.started = true
  startTurnTimer(r)
  io.to(r.code).emit('game:start', { code: r.code })
}

function snapshotFor(r, sock) {
  return {
    code: r.code, you: symOf(r, sock), players: playersOf(r), moves: r.moves, turn: r.turn,
    timeLeft: Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000)), over: r.over,
  }
}

io.on('connection', (sock) => {
  sock.data.room = null

  const joinRoom = (r, user) => {
    r.players.push({ id: sock.id, sym: r.players.length === 0 ? 'X' : 'O', info: pub(user) })
    sock.join(r.code)
    sock.data.room = r.code
    io.to(r.code).emit('room:updated', { code: r.code, players: playersOf(r) })
    if (r.players.length === 2) startGame(r)
  }

  sock.on('room:create', ({ code, user }, cb) => {
    const c = String(code || '').toUpperCase().slice(0, 8)
    if (c.length < 4) return cb?.({ ok: false, error: 'Mã phòng không hợp lệ' })
   const old = rooms.get(c)
if (old && !old.over && old.started) return cb?.({ ok: false, error: 'Phòng ' + c + ' đang có ván đấu' })
if (old) { clearTimeout(old.timer); rooms.delete(c) }
    joinRoom(newRoom(c), user)
    cb?.({ ok: true, code: c })
  })

  sock.on('room:join', ({ code, user }, cb) => {
    const r = rooms.get(String(code || '').toUpperCase())
    if (!r || r.over) return cb?.({ ok: false, error: 'Không tìm thấy phòng' })
    if (r.players.length >= 2) return cb?.({ ok: false, error: 'Phòng đã đầy' })
    joinRoom(r, user)
    cb?.({ ok: true, code: r.code })
  })

  sock.on('quick:join', ({ user }, cb) => {
    if (quickWaiting && quickWaiting.id !== sock.id && quickWaiting.connected) {
      const other = quickWaiting
      quickWaiting = null
      const r = newRoom('Q' + Math.random().toString(36).slice(2, 7).toUpperCase())
      const first = other.data.user
      other.data.joinFn(r, first)
      joinRoom(r, user)
    } else {
      quickWaiting = sock
      sock.data.user = user
      sock.data.joinFn = (r, u) => { // ghép cho người đang chờ
        r.players.push({ id: sock.id, sym: 'X', info: pub(u) })
        sock.join(r.code)
        sock.data.room = r.code
      }
    }
    cb?.({ ok: true })
  })

  // Trang Game vừa mở → xin trạng thái hiện tại của phòng
  sock.on('game:sync', ({ code }, cb) => {
    const r = rooms.get(String(code || '').toUpperCase())
    if (!r || !symOf(r, sock)) return cb?.({ ok: false })
    cb?.({ ok: true, state: snapshotFor(r, sock) })
  })

    sock.on('game:move', ({ x, y }) => {
    const r = rooms.get(sock.data.room)
    if (!r) return console.log('[move] TU CHOI: khong co phong. sock.data.room =', sock.data.room)
    if (!r.started || r.over) return console.log('[move] TU CHOI: phong', r.code, 'started =', r.started, 'over =', !!r.over)
    const sym = symOf(r, sock)
    if (sym !== r.turn || !Number.isInteger(x) || !Number.isInteger(y))
      return console.log('[move] TU CHOI: sai luot. nguoi danh =', sym, ', luot =', r.turn)
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || r.board[y][x])
      return console.log('[move] TU CHOI: o khong hop le', x, y)
    r.board[y][x] = sym
    r.moves.push({ x, y, s: sym })
    console.log('[move] OK', sym, x, y, '- nuoc thu', r.moves.length, '- phong', r.code)
    r.drawFrom = null
    io.to(r.code).emit('game:moved', { x, y, s: sym })
    const line = checkWin(r.board, x, y, sym)
    if (line) return finish(r, { winner: sym, reason: 'five', line })
    if (r.moves.length === SIZE * SIZE) return finish(r, { winner: null, reason: 'full' })
    r.turn = sym === 'X' ? 'O' : 'X'
    startTurnTimer(r)
  })

  sock.on('game:resign', () => {
    const r = rooms.get(sock.data.room)
    const sym = r && symOf(r, sock)
    if (r && sym && r.started) finish(r, { winner: sym === 'X' ? 'O' : 'X', reason: 'resign' })
  })

  sock.on('draw:offer', () => {
    const r = rooms.get(sock.data.room)
    if (!r || r.over || r.moves.length < 6) return
    r.drawFrom = sock.id
    sock.to(r.code).emit('draw:offered')
  })
  sock.on('draw:answer', ({ accept }) => {
    const r = rooms.get(sock.data.room)
    if (!r || r.over || !r.drawFrom || r.drawFrom === sock.id) return
    if (accept) finish(r, { winner: null, reason: 'agreed' })
    else sock.to(r.code).emit('draw:declined')
    r.drawFrom = null
  })

  sock.on('chat:send', ({ text }) => {
    const r = rooms.get(sock.data.room)
    const p = r?.players.find((q) => q.id === sock.id)
    const t = String(text || '').trim().slice(0, 200)
    if (p && t) sock.to(r.code).emit('chat:message', { from: p.info.name, text: t })
  })
    // Chơi lại: cả 2 cùng bấm thì ván mới bắt đầu, đổi quân X/O
  sock.on('rematch:request', (a, b) => {
    const cb = typeof a === 'function' ? a : b
    const r = rooms.get(sock.data.room)
    if (!r || !r.over || !symOf(r, sock)) return cb?.({ ok: false })
    if (r.players.length < 2) return cb?.({ ok: false, error: 'Đối thủ đã rời phòng' })
    r.rematch = r.rematch || new Set()
    r.rematch.add(sock.id)
    if (r.rematch.size < 2) {
      sock.to(r.code).emit('rematch:asked') // báo cho đối thủ
      return cb?.({ ok: true, waiting: true })
    }
    clearTimeout(r.cleanup)
    r.rematch.clear()
    r.board = createBoard(); r.moves = []; r.turn = 'X'
    r.over = null; r.started = false; r.drawFrom = null
    // r.players.forEach((p) => { p.sym = p.sym === 'X' ? 'O' : 'X' })
    io.to(r.code).emit('room:updated', { code: r.code, players: playersOf(r) })
    startGame(r) // phát 'game:start'
    cb?.({ ok: true, started: true })
  })

  const leave = () => {
    if (quickWaiting?.id === sock.id) quickWaiting = null
    const r = rooms.get(sock.data.room)
    if (!r || !symOf(r, sock)) return
    sock.leave(r.code)
    sock.data.room = null
    if (r.over) { // rời phòng sau khi ván đã kết thúc
      r.players = r.players.filter((p) => p.id !== sock.id)
      r.rematch?.delete(sock.id)
      sock.to(r.code).emit('rematch:left') // báo đối thủ: không chơi lại được nữa
      if (!r.players.length) { clearTimeout(r.cleanup); rooms.delete(r.code) }
      return
    }
    const sym = symOf(r, sock)
    if (r.started && !r.over) finish(r, { winner: sym === 'X' ? 'O' : 'X', reason: 'resign' }) // rời giữa ván = thua
    else if (!r.started) { // phòng chưa đủ người → đóng
      clearTimeout(r.timer); rooms.delete(r.code)
    }
  }
  sock.on('room:leave', leave)
  sock.on('disconnect', leave)
})

httpServer.listen(PORT, () => console.log(`X-O Arena server chạy ở cổng ${PORT}`))