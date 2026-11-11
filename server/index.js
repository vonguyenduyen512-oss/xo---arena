// Server realtime cho X-O Arena (Socket.IO). Chạy: cd server && npm install && npm start
// Dùng lại đúng logic bàn cờ của client (client/src/lib/game.js).
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { SIZE, TURN_TIME, checkWin, createBoard } from '../client/src/lib/game.js'
import fs from 'node:fs'
import { randomUUID, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ===== Tài khoản (lưu vào server/users.json) =====
const DB_FILE = new URL('./users.json', import.meta.url)
const SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex')
if (!process.env.JWT_SECRET) console.warn('[security] JWT_SECRET chưa cấu hình; token đăng nhập sẽ hết hiệu lực khi khởi động lại server.')
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('Production yêu cầu JWT_SECRET tối thiểu 32 ký tự')
let users = []
try { users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch {}
const atomicSave = (file, data) => {
  const path = new URL(file)
  const tmp = new URL(path.href + '.tmp')
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, path)
}
const saveUsers = () => atomicSave(DB_FILE, users)
const safe = ({ hash, ...u }) => u
const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '30d' })

// ===== Tài khoản chính Nguyễn Duyên: lưu dữ liệu lên server (server/main-account.json) =====
const MAIN_FILE = new URL('./main-account.json', import.meta.url)
const ONLINE_FILE = new URL('./online-matches.json', import.meta.url)
let onlineMatches = []
try { const saved = JSON.parse(fs.readFileSync(ONLINE_FILE, 'utf8')); if (Array.isArray(saved)) onlineMatches = saved } catch {}
const saveOnline = () => atomicSave(ONLINE_FILE, onlineMatches.slice(-5000))
// Mật khẩu từng tài khoản cố định (khóa = tên không dấu, chữ thường). Phải khớp MAIN_ACCOUNTS ở client/src/store.jsx
const LEGACY_MAIN_PASSES = JSON.parse(
  process.env.LEGACY_MAIN_PASSES_JSON || '{}'
)
// mainData: { [khóa]: { user, matches } }. Tự chuyển từ định dạng cũ { user, matches } (chỉ có Nguyễn Duyên)
let mainData = {}
try {
  const raw = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf8'))
  mainData = raw && raw.user ? { 'nguyen duyen': raw } : (raw || {})
} catch {}
const MAIN_AUTH_FILE = new URL('./main-auth.json', import.meta.url)
let mainAuth = {}
try { mainAuth = JSON.parse(fs.readFileSync(MAIN_AUTH_FILE, 'utf8')) } catch {}
// Upgrade existing fixed accounts to server-side bcrypt hashes without changing saved player data.
let migrated = false

for (const [key, password] of Object.entries(LEGACY_MAIN_PASSES)) {
  if (!mainAuth[key] && typeof password === 'string' && password.length >= 12) {
    mainAuth[key] = {
      hash: bcrypt.hashSync(password, 12),
      locked: false
    }
    migrated = true
  }
}

const saveMainAuth = () => atomicSave(MAIN_AUTH_FILE, mainAuth)
if (migrated) saveMainAuth()
const mainToken = (key) => jwt.sign({ role: 'player', key, version: mainAuth[key]?.version || 0 }, SECRET, { expiresIn: '7d' })
const mainKey = (req) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const payload = jwt.verify(token, SECRET)
    return payload.role === 'player' && mainAuth[payload.key] && !mainAuth[payload.key].locked && (payload.version || 0) === (mainAuth[payload.key].version || 0) ? payload.key : null
  } catch { return null }
}


// ===== Bảng xếp hạng thật (server/leaderboard.json) — server tự tính kết quả từng ván =====
const LB_FILE = new URL('./leaderboard.json', import.meta.url)
const SCORE = { win: 30, draw: 10, lose: -10 } // điểm xếp hạng mỗi ván (không xuống dưới 0)
// Các chế độ chơi: turn = số giây mỗi lượt, mult = hệ số nhân điểm xếp hạng (thắng/hòa/thua đều nhân; hiện cả hai đều x1)
const MODES = {
  'Caro 2 người': { turn: TURN_TIME, mult: 1 },
  'Caro nhanh': { turn: 10, mult: 1 },
}
const DEFAULT_MODE = 'Caro 2 người'
const modeOf = (m) => (MODES[m] ? m : DEFAULT_MODE)
let lb = {}
try { lb = JSON.parse(fs.readFileSync(LB_FILE, 'utf8')) } catch {}
const saveLb = () => atomicSave(LB_FILE, lb)
const lbKey = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')
function recordResult(info, result, mult = 1) {
  if (!info || info.guest || !info.verified) return // khách không lên bảng
  const k = lbKey(info.name)
  if (!k) return
  const e = lb[k] || (lb[k] = { name: info.name, avatar: info.avatar, level: info.level, wins: 0, draws: 0, losses: 0, score: 0 })
  e.name = info.name; e.avatar = info.avatar; e.level = Math.max(e.level || 1, info.level || 1)
  if (result === 'win') e.wins++; else if (result === 'draw') e.draws++; else e.losses++
  e.score = Math.max(0, (e.score || 0) + SCORE[result] * mult)
  e.updatedAt = Date.now()
}
const topPlayers = () => Object.values(lb)
  .sort((a, b) => b.score - a.score || b.wins - a.wins || (a.updatedAt || 0) - (b.updatedAt || 0))
  .slice(0, 100)

// ===== Bạn bè (server/friends.json): { key: { friends: [key], incoming: [{key, name}] } } =====
const FR_FILE = new URL('./friends.json', import.meta.url)
let fr = {}
try { fr = JSON.parse(fs.readFileSync(FR_FILE, 'utf8')) } catch {}
const saveFr = () => atomicSave(FR_FILE, fr)
const safeFriendKey = (k) => !!k && !['__proto__', 'prototype', 'constructor'].includes(k)
const frOf = (k) => Object.hasOwn(fr, k) ? fr[k] : (fr[k] = { friends: [], incoming: [] })
const card = (k) => lb[k] || { name: k, avatar: '🧑', level: 1, wins: 0, draws: 0, losses: 0, score: 0 }
function friendsApi(b) {
  const me = lbKey(b.me), to = lbKey(b.to)
  if (!safeFriendKey(me) || (to && !safeFriendKey(to))) return [400, { error: 'Tên người chơi không hợp lệ.' }]
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


// ===== Dịch vụ bổ sung cho các màn hình chưa có API =====
// Không tạo dữ liệu mẫu, không thay đổi hồ sơ hoặc số dư của người chơi.
const FEATURES_FILE = new URL('./features.json', import.meta.url)
let features = { messages: [], notices: {}, mailbox: {}, news: [], events: [] }
try {
  const stored = JSON.parse(fs.readFileSync(FEATURES_FILE, 'utf8'))
  if (stored && typeof stored === 'object') {
    for (const field of Object.keys(features)) {
      if (Array.isArray(features[field]) ? Array.isArray(stored[field]) : stored[field] && typeof stored[field] === 'object' && !Array.isArray(stored[field])) features[field] = stored[field]
    }
  }
} catch {}
const saveFeatures = () => atomicSave(FEATURES_FILE, features)
const ownArray = (obj, key) => Object.hasOwn(obj, key) && Array.isArray(obj[key]) ? obj[key] : []
const limitedText = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : ''
const playerExists = (key) => !!mainAuth[key] && !!mainData[key]?.user && !mainAuth[key].locked
const friendsWith = (a, b) => ownArray(frOf(a), 'friends').includes(b) && ownArray(frOf(b), 'friends').includes(a)
const achievementsFor = (key) => {
  const history = (mainData[key]?.matches || []).filter(m => m.onlineVerified === true)
  const wins = history.filter(m => m.result === 'win').length
  return [
    { id: 'first-match', title: 'Trận đầu tiên', progress: Math.min(history.length, 1), target: 1, unlocked: history.length >= 1 },
    { id: 'five-matches', title: 'Chơi 5 trận', progress: Math.min(history.length, 5), target: 5, unlocked: history.length >= 5 },
    { id: 'first-win', title: 'Chiến thắng đầu tiên', progress: Math.min(wins, 1), target: 1, unlocked: wins >= 1 },
    { id: 'ten-wins', title: 'Thắng 10 trận', progress: Math.min(wins, 10), target: 10, unlocked: wins >= 10 },
  ]
}
async function featureApi(req, res, url) {
  const key = mainKey(req)
  if (!key || !playerExists(key)) return send(res, 401, { error: 'Vui lòng đăng nhập.' })
  const method = req.method
  if (url === '/api/achievements' && method === 'GET') return send(res, 200, { achievements: achievementsFor(key) })
  if (url === '/api/news' && method === 'GET') return send(res, 200, { news: features.news })
  if (url === '/api/events' && method === 'GET') return send(res, 200, { events: features.events })
  if (url === '/api/daily-tasks' && method === 'GET') {
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)
    const matches = (mainData[key]?.matches || []).filter(m => m.onlineVerified === true && typeof m.at === 'string' && !Number.isNaN(Date.parse(m.at)) && new Date(Date.parse(m.at) + 7 * 3600000).toISOString().slice(0, 10) === today)
    return send(res, 200, { date: today, tasks: [
      { id: 'play-1', title: 'Chơi 1 trận online', progress: Math.min(matches.length, 1), target: 1, completed: matches.length >= 1 },
      { id: 'win-1', title: 'Thắng 1 trận online', progress: Math.min(matches.filter(m => m.result === 'win').length, 1), target: 1, completed: matches.some(m => m.result === 'win') },
    ], note: 'Tiến độ chỉ để hiển thị; phần thưởng phải nhận qua API /api/main/claim.' })
  }
  if (url === '/api/messages' && method === 'GET') {
    const peer = new URL(req.url, 'http://localhost').searchParams.get('with')
    if (peer) {
      const to = lbKey(peer)
      if (!playerExists(to) || !friendsWith(key, to)) return send(res, 403, { error: 'Chỉ xem tin nhắn với bạn bè.' })
      return send(res, 200, { messages: features.messages.filter(m => (m.from === key && m.to === to) || (m.from === to && m.to === key)).slice(-200) })
    }
    const peers = [...new Set(features.messages.filter(m => m.from === key || m.to === key).map(m => m.from === key ? m.to : m.from))]
    return send(res, 200, { conversations: peers.filter(k => friendsWith(key, k)).map(k => ({ key: k, name: mainData[k]?.user?.name || k })) })
  }
  if (url === '/api/messages' && method === 'POST') {
    const b = await readBody(req)
    const to = lbKey(b.to), content = limitedText(b.text, 1000)
    if (!playerExists(to) || !friendsWith(key, to)) return send(res, 403, { error: 'Chỉ gửi tin nhắn cho bạn bè.' })
    if (!content || typeof b.text !== 'string' || b.text.length > 1000) return send(res, 400, { error: 'Tin nhắn phải từ 1 đến 1000 ký tự.' })
    const message = { id: randomUUID(), from: key, to, text: content, at: new Date().toISOString() }
    features.messages.push(message)
    if (features.messages.length > 10000) features.messages = features.messages.slice(-10000)
    saveFeatures()
    return send(res, 201, { message })
  }
  const kind = url === '/api/notifications' ? 'notices' : url === '/api/mailbox' ? 'mailbox' : null
  if (kind && method === 'GET') return send(res, 200, { items: ownArray(features[kind], key).slice(-200).reverse() })
  if (kind && method === 'POST') {
    const b = await readBody(req)
    if (b.action !== 'read' || typeof b.id !== 'string') return send(res, 400, { error: 'Yêu cầu không hợp lệ.' })
    const item = ownArray(features[kind], key).find(x => x.id === b.id)
    if (!item) return send(res, 404, { error: 'Không tìm thấy mục.' })
    item.read = true
    saveFeatures()
    return send(res, 200, { ok: true, item })
  }
  return send(res, 405, { error: 'Phương thức hoặc đường dẫn không hỗ trợ.' })
}

// ===== Vá dữ liệu 1 lần (tự chạy khi khởi động, chạy lại nhiều lần vẫn an toàn) =====
// 1) Đổi tài khoản AC -> Ân (giữ nguyên level, xu, lịch sử, bảng xếp hạng, bạn bè)
// 2) Nguyễn Duyên: Lv30, EXP 1450/3200, 70 thắng 30 thua, 1800 điểm rank (rev 2)
function patchData() {
  let changed = false
  if (mainData['ac'] && !mainData['an']) {
    mainData['an'] = mainData['ac']; delete mainData['ac']
    Object.assign(mainData['an'].user, { name: 'Ân', id: '#62002' })
    if (lb['ac']) { lb['an'] = { ...lb['ac'], name: 'Ân' }; delete lb['ac'] }
    if (fr['ac']) { fr['an'] = fr['ac']; delete fr['ac'] }
    for (const f of Object.values(fr)) {
      f.friends = f.friends.map((x) => (x === 'ac' ? 'an' : x))
      f.incoming = f.incoming.map((x) => (x.key === 'ac' ? { ...x, key: 'an', name: 'Ân' } : x))
    }
    changed = true
  }
  const d = mainData['nguyen duyen']
  if (d && (d.user.rev || 0) < 2) {
    const now = Date.now()
    Object.assign(d.user, { level: 30, exp: 1450, expMax: 3200, rev: 2, updatedAt: now })
    lb['nguyen duyen'] = { ...(lb['nguyen duyen'] || { name: d.user.name, avatar: d.user.avatar }), level: 30, wins: 70, draws: 0, losses: 30, score: 1800, updatedAt: now }
    changed = true
  }
  // 3) Đặt level + điểm xếp hạng cho 6 tài khoản cố định (Nguyễn Duyên giữ nguyên). Chạy 1 lần (rev 4).
  //    Điểm rank khớp công thức: thắng +30, thua -10 (điểm = 30*thắng - 10*thua), level cao thì điểm cao.
  //    Muốn đổi số liệu: sửa bảng SIX rồi tăng REV lên 1 (vd 5) để server áp lại khi khởi động.
  const REV = 4
  const now3 = Date.now()
  const expMaxOf = (lv) => 300 + (lv - 1) * 100
  // [khóa, tên, id, avatar mặc định, level, thắng, thua]
  const SIX = [
    ['quynh', 'Quỳnh', '#62001', 'a1', 9, 12, 2], // 340
    ['an',    'Ân',    '#62002', 'a2', 8, 11, 3], // 300
    ['vy',    'Vy',    '#62003', 'a3', 7, 9, 2],  // 250
    ['huy',   'Huy',   '#62007', 'a6', 6, 8, 3],  // 210
    ['quan',  'Quân',  '#62004', 'a4', 5, 6, 2],  // 160
    ['luat',  'Luật',  '#62006', 'a5', 5, 6, 3],  // 150
  ]
  SIX.forEach(([k, name, id, av, level, wins, losses], i) => {
    const m = mainData[k]
    const expMax = expMaxOf(level)
    if (!m || (m.user.rev || 0) < REV) {
      const avatar = m?.user?.avatar && m.user.avatar !== 'duo' ? m.user.avatar : av
      const user = { id, name, email: '', birthday: '', guest: false, main: true, avatar, level, exp: Math.round(expMax / 2), expMax, coins: 1015099, gems: 1000559, updatedAt: now3, rev: REV }
      mainData[k] = { user, matches: m?.matches || [] } // giữ nguyên lịch sử trận đã có
      changed = true
    }
    // Bảng xếp hạng kiểm tra riêng (dấu rev) để dù file nào bị lệch cũng tự sửa đúng 1 lần
    if ((lb[k]?.rev || 0) < REV) {
      lb[k] = { name, avatar: mainData[k].user.avatar, level, wins, draws: 0, losses, score: Math.max(0, wins * 30 - losses * 10), updatedAt: now3 + i, rev: REV }
      changed = true
    }
  })
  if (changed) {
    try { atomicSave(MAIN_FILE, mainData); saveLb(); saveFr() } catch {}
  }
}
// Không tự động ghi đè điểm rank, cấp độ hoặc lịch sử khi khởi động.
// patchData()

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
// Admin: chỉ cấu hình trên máy chủ, không nhúng mật khẩu vào client.
const ADMIN_NAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || ''
const adminAuth = (req) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    return jwt.verify(token, SECRET).role === 'admin'
  } catch { return false }
}
const adminPlayers = () => [
  ...Object.entries(mainData).map(([key, entry]) => {
    const m = entry.matches || [], u = entry.user || {}
    return { id: u.id || key, name: u.name || key, avatar: u.avatar || '🧑', status: 'Offline',
      joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Chưa rõ',
      total: m.length, wins: m.filter(x => x.result === 'win').length,
      losses: m.filter(x => x.result === 'lose').length, locked: !!mainAuth[key]?.locked, key }
  }),
  ...users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar || '🧑', status: 'Offline',
    joined: new Date(u.createdAt || Date.now()).toLocaleDateString('vi-VN'), total: 0, wins: 0, losses: 0, locked: !!u.locked }))
]
const authUser = (req) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '')
    const payload = jwt.verify(t, SECRET)
    return payload.id && !payload.role ? users.find((u) => u.id === payload.id && !u.locked) || null : null
  } catch { return null }
}

async function api(req, res) {
  const url = req.url.split('?')[0]
  if (req.method === 'OPTIONS') return send(res, 200, {})
  if (['/api/achievements', '/api/news', '/api/events', '/api/daily-tasks', '/api/messages', '/api/notifications', '/api/mailbox'].includes(url)) return featureApi(req, res, url)

  if (req.method === 'POST' && url === '/api/admin/login') {
    if (!ADMIN_HASH || SECRET === 'doi-chuoi-nay-truoc-khi-deploy')
      return send(res, 503, { error: 'Admin chưa được cấu hình trên server. Xem server/README-BACKEND.md.' })
    const b = await readBody(req)
    if (String(b.username || '') !== ADMIN_NAME || !bcrypt.compareSync(String(b.password || ''), ADMIN_HASH))
      return send(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu.' })
    return send(res, 200, { token: jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '8h' }) })
  }
  if (url.startsWith('/api/admin/')) {
    if (!adminAuth(req)) return send(res, 401, { error: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' })
    if (req.method === 'GET' && url === '/api/admin/me') return send(res, 200, { ok: true, role: 'admin' })
    if (req.method === 'GET' && url === '/api/admin/players') return send(res, 200, { players: adminPlayers() })
    if (req.method === 'POST' && url === '/api/admin/players/lock') {
      const b = await readBody(req)
      const key = lbKey(b.key)
      if (mainAuth[key]) {
        mainAuth[key].locked = b.locked === true; saveMainAuth()
        return send(res, 200, { ok: true, key, locked: mainAuth[key].locked })
      }
      const registered = users.find(u => u.id === String(b.key || ''))
      if (!registered) return send(res, 404, { error: 'Không tìm thấy tài khoản.' })
      registered.locked = b.locked === true; saveUsers()
      return send(res, 200, { ok: true, key: registered.id, locked: registered.locked })
    }
    if (req.method === 'POST' && url === '/api/admin/players/delete') {
      const b = await readBody(req)
      const key = lbKey(b.key)
      // Lưu trữ an toàn bằng cách khóa thay vì xóa vĩnh viễn.
      if (mainAuth[key]) { mainAuth[key].locked = true; saveMainAuth(); return send(res, 200, { ok: true, archived: true, key }) }
      const registered = users.find(u => u.id === String(b.key || ''))
      if (!registered) return send(res, 404, { error: 'Không tìm thấy tài khoản.' })
      registered.locked = true; saveUsers()
      return send(res, 200, { ok: true, archived: true, key: registered.id })
    }
    if (req.method === 'GET' && url === '/api/admin/rooms') return send(res, 200, { rooms: [...rooms.values()].map(r => ({
      id: r.code, code: r.code, name: r.name || 'Phòng ' + r.code, mode: r.mode,
      status: r.over ? 'Đã kết thúc' : r.started ? 'Đang chơi' : 'Đang chờ',
      players: r.players.length, at: new Date(r.createdAt).toLocaleString('vi-VN') })) })
    if (req.method === 'POST' && url === '/api/admin/rooms/close') {
      const b = await readBody(req), r = rooms.get(String(b.code || ''))
      if (!r) return send(res, 404, { error: 'Không tìm thấy phòng.' })
      clearTimeout(r.timer); clearTimeout(r.cleanup)
      io.to(r.code).emit('game:over', { winner: null, reason: 'admin-close' })
      for (const p of r.players) { const socket = io.sockets.sockets.get(p.id); if (socket) { socket.leave(r.code); socket.data.room = null } }
      rooms.delete(r.code)
      return send(res, 200, { ok: true })
    }
    return send(res, 404, { error: 'API quản trị không tồn tại.' })
  }
  if (req.method === 'POST' && url === '/api/friends') {
    const key = mainKey(req)
    if (!key) return send(res, 401, { error: 'Vui lòng đăng nhập tài khoản chính để quản lý bạn bè.' })
    const body = await readBody(req)
    const [code, data] = friendsApi({ ...body, me: key, myName: mainData[key]?.user?.name || key })
    return send(res, code, data)
  }
  if (req.method === 'GET' && url === '/api/rooms') { // danh sách phòng thật (chỉ phòng Công khai, đang chờ hoặc đang chơi)
    const list = [...rooms.values()]
      .filter((r) => r.pub && !r.over && r.players.length > 0 && /^\d{4}$/.test(r.code))
      .map((r) => ({ code: r.code, name: r.name, mode: r.mode, players: r.players.length, playing: r.started, hasPw: !!r.password, createdAt: r.createdAt }))
      .sort((a, b) => Number(a.playing) - Number(b.playing) || b.createdAt - a.createdAt)
    return send(res, 200, { online: io.engine.clientsCount, rooms: list })
  }
  if (req.method === 'GET' && url === '/api/leaderboard') return send(res, 200, { players: topPlayers() })

  // Điểm danh theo ngày Việt Nam (UTC+7), chỉ server quyết định ngày hợp lệ.
  if (req.method === 'POST' && url === '/api/main/login') {
    const b = await readBody(req)
    const key = lbKey(b.key)
    const account = mainAuth[key]
    if (!account || account.locked || !bcrypt.compareSync(String(b.password || ''), account.hash))
      return send(res, 401, { error: 'Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa.' })
    return send(res, 200, { token: mainToken(key), data: mainData[key] || null })
  }
  if (req.method === 'POST' && url === '/api/main/change-password') {
    const key = mainKey(req)
    if (!key) return send(res, 401, { error: 'Chưa đăng nhập.' })
    const b = await readBody(req)
    if (!bcrypt.compareSync(String(b.currentPassword || ''), mainAuth[key].hash)) return send(res, 401, { error: 'Mật khẩu hiện tại không đúng.' })
    if (typeof b.newPassword !== 'string' || b.newPassword.length < 12 || b.newPassword.length > 128) return send(res, 400, { error: 'Mật khẩu mới phải từ 12 đến 128 ký tự.' })
    mainAuth[key].hash = bcrypt.hashSync(b.newPassword, 12)
    mainAuth[key].version = (mainAuth[key].version || 0) + 1
    saveMainAuth()
    return send(res, 200, { ok: true, token: mainToken(key) })
  }
  if (req.method === 'POST' && url === '/api/main/checkin') {
    const b = await readBody(req)
    const k = mainKey(req)
    if (!k) return send(res, 401, { error: 'Sai thông tin tài khoản.' })
    const entry = mainData[k]
    if (!entry?.user) return send(res, 404, { error: 'Không có dữ liệu tài khoản.' })
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const days = [...new Set((entry.user.loginDays || []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today))]
    if (days.includes(today)) return send(res, 200, { ok: true, already: true, data: entry })
    entry.user.loginDays = [...days, today]
    entry.user.updatedAt = Date.now()
    entry.user.rev = (entry.user.rev || 0) + 1
    atomicSave(MAIN_FILE, mainData)
    return send(res, 200, { ok: true, already: false, data: entry })
  }
  // Nhận thưởng trên server: kiểm tra điều kiện và ghi một lần, không tin phần thưởng client gửi.
  if (req.method === 'POST' && url === '/api/main/claim') {
    const b = await readBody(req)
    const k = mainKey(req)
    if (!k) return send(res, 401, { error: 'Sai thông tin tài khoản.' })
    const entry = mainData[k]
    if (!entry?.user) return send(res, 404, { error: 'Không có dữ liệu tài khoản.' })
    const id = String(b.id || '')
    const rewards = {
      'nov26:m1': { kind: 'coin', n: 500 },
      'nov26:m2': { kind: 'gem', n: 50 },
      'nov26:m3': { kind: 'coin', n: 200 },
      'nov26:mile:200': { kind: 'coin', n: 500 },
      'nov26:mile:500': { kind: 'gem', n: 100 },
      // Hộp quà hiện được quy đổi thành 200 xu, giống nhiệm vụ đăng nhập 7 ngày.
      'nov26:mile:1000': { kind: 'coin', n: 200 },
      'nov26:mile:2000': { kind: 'frame', id: 'november' },
    }
    // Phần thưởng sự kiện tuần 24-30/11/2026; server tự xác minh lịch sử.
    const weekMission = /^week26:mission:([0-4])$/.exec(id)
    const weekMile = /^week26:mile:(10|20|30|40|50)$/.exec(id)
    if (weekMission || weekMile) {
      const u = entry.user
      const nowVN = new Date(Date.now() + 7*3600000).toISOString().slice(0,10)
      if (nowVN < '2026-11-24' || nowVN > '2026-11-30') return send(res,409,{error:'Sự kiện tuần chưa diễn ra hoặc đã kết thúc.',data:entry})
      const history = (entry.matches || []).filter(m => m.onlineVerified === true && typeof m.at === 'string' && !Number.isNaN(Date.parse(m.at)) && (() => { const d = new Date(Date.parse(m.at) + 7*3600000).toISOString().slice(0,10); return d >= '2026-11-24' && d <= '2026-11-30' })())
      const sorted = [...history].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))
      let streak=0,best=0
      for(const m of sorted){streak=m.result==='win'?streak+1:0;best=Math.max(best,streak)}
      const days=new Set((u.loginDays||[]).filter(d=>d>='2026-11-24'&&d<='2026-11-30')).size
      const progress=[history.length,history.filter(m=>m.result==='win').length,history.filter(m=>m.friendMatch===true).length,days,best]
      const max=[30,15,5,5,3]
      const points=progress.reduce((a,n,i)=>a+Math.min(n,max[i]),0)
      const eligible=weekMission ? progress[Number(weekMission[1])] >= max[Number(weekMission[1])] : points>=Number(weekMile[1])
      if(!eligible)return send(res,409,{error:'Chưa đủ điều kiện nhận thưởng.',data:entry})
      if((u.eventClaims||[]).includes(id))return send(res,409,{error:'Đã nhận phần thưởng này.',data:entry})
      const missionRewards=[{kind:'coin',n:1000},{kind:'gem',n:100},{kind:'coin',n:200},{kind:'coin',n:500},{kind:'gem',n:50}]
      const mileRewards={10:{kind:'coin',n:500},20:{kind:'gem',n:50},30:{kind:'coin',n:200},40:{kind:'frame',id:'weekly'},50:{kind:'coin',n:1000}}
      const reward=weekMission?missionRewards[Number(weekMission[1])]:mileRewards[Number(weekMile[1])]
      u.eventClaims=[...(u.eventClaims||[]),id]
      if(reward.kind==='coin')u.coins=(u.coins||0)+reward.n
      if(reward.kind==='gem')u.gems=(u.gems||0)+reward.n
      if(reward.kind==='frame')u.frames=[...new Set([...(u.frames||[]),reward.id])]
      u.rev=(u.rev||0)+1
      u.updatedAt=Date.now()
      atomicSave(MAIN_FILE, mainData)
      return send(res,200,{ok:true,data:entry})
    }
    // Nhiệm vụ ngày: ID gắn ngày theo giờ Việt Nam; không nhận thưởng ngày khác.
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)
    const daily = /^nov26:daily:(\d{4}-\d{2}-\d{2}):(m[12])$/.exec(id)
    const dailyReward = daily?.[2] === 'm1' ? { kind: 'coin', n: 500 } : daily?.[2] === 'm2' ? { kind: 'gem', n: 50 } : null
    if (daily && (daily[1] !== today || !today.startsWith('2026-11-'))) return send(res, 409, { error: 'Nhiệm vụ này không thuộc ngày hôm nay.' })
    const reward = daily ? dailyReward : rewards[id]
    if (!reward) return send(res, 400, { error: 'Phần thưởng không hợp lệ.' })
    const history = Array.isArray(entry.matches) ? entry.matches.filter(m => m.onlineVerified === true) : []
    const wins = history.filter(m => m.result === 'win').length
    const points = history.length * 10 + wins * 20
    const days = new Set((entry.user.loginDays || []).filter(d => /^2026-11-\d{2}$/.test(d))).size
    const todayHistory = history.filter(m => typeof m.at === 'string' && !Number.isNaN(Date.parse(m.at)) && new Date(Date.parse(m.at) + 7 * 3600000).toISOString().slice(0, 10) === today)
    const eligible = daily ? (daily[2] === 'm1' ? todayHistory.length >= 10 : todayHistory.filter(m => m.result === 'win').length >= 5)
      : id === 'nov26:m1' ? history.length >= 10
      : id === 'nov26:m2' ? wins >= 5
      : id === 'nov26:m3' ? days >= 7
      : points >= Number(id.split(':').at(-1))
    if (!eligible) return send(res, 409, { error: 'Chưa đạt điều kiện nhận thưởng.', data: entry })
    const u = entry.user
    if ((u.eventClaims || []).includes(id)) return send(res, 409, { error: 'Phần thưởng đã nhận.', data: entry })
    u.eventClaims = [...(u.eventClaims || []), id]
    if (reward.kind === 'coin') u.coins = (u.coins || 0) + reward.n
    if (reward.kind === 'gem') u.gems = (u.gems || 0) + reward.n
    if (reward.kind === 'frame') u.frames = [...new Set([...(u.frames || []), reward.id])]
    u.updatedAt = Date.now()
    atomicSave(MAIN_FILE, mainData)
    return send(res, 200, { ok: true, data: entry })
  }
  if (req.method === 'POST' && url === '/api/main/load') {
    const b = await readBody(req)
    const k = mainKey(req)
    if (!k) return send(res, 401, { error: 'Sai mật khẩu.' })
    return send(res, 200, { data: mainData[k] || null })
  }
  if (req.method === 'POST' && url === '/api/main/save') {
    const b = await readBody(req)
    const k = mainKey(req)
    if (!k) return send(res, 401, { error: 'Sai mật khẩu.' })
    if (!b.user || typeof b.user !== 'object') return send(res, 400, { error: 'Thiếu dữ liệu.' })
    // chỉ ghi đè khi bản gửi lên mới hơn hoặc bằng bản đang lưu
    // rev: số phiên bản dữ liệu. Bản gửi lên có rev thấp hơn bản trên server (vd tab cũ chưa tải lại) thì bỏ qua
    if (mainData[k] && (b.user.rev || 0) < (mainData[k].user?.rev || 0)) return send(res, 200, { ok: false, stale: true })
    if (!mainData[k] || (b.user.updatedAt || 0) >= (mainData[k].user?.updatedAt || 0)) {
      // Phần thưởng và kho khung do server quản lý, không cho bản lưu cũ ghi đè.
      const old = mainData[k]?.user || {}
      const incoming = b.user
      // Giữ lịch sử cũ, nhưng KHÔNG nhận trận mới do client tự khai.
      const nextMatches = (mainData[k]?.matches || []).slice(0, 500)
      const matchCoins = 0
      const matchGems = 0
      const protectedUser = {
        ...incoming,
        level: old.level ?? incoming.level, exp: old.exp ?? incoming.exp, expMax: old.expMax ?? incoming.expMax,
        rev: (old.rev || 0) + 1, updatedAt: Date.now(),
        coins: (old.coins ?? incoming.coins) + matchCoins,
        gems: (old.gems ?? incoming.gems) + matchGems,
        eventClaims: old.eventClaims || [],
        frames: old.frames || [],
        activeFrame: (old.frames || []).includes(incoming.activeFrame) ? incoming.activeFrame : 'none',
        loginDays: old.loginDays || [],
        id: old.id || incoming.id,
name: old.name || incoming.name,

main: old.main ?? false,
        role: old.role,
        isAdmin: old.isAdmin ?? false,
        locked: old.locked ?? false,

wins: old.wins,
losses: old.losses,
draws: old.draws,
      }
      mainData[k] = { user: protectedUser, matches: nextMatches }
      atomicSave(MAIN_FILE, mainData)
    }
    return send(res, 200, { ok: true, data: mainData[k] })
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
    if (!u || u.locked || !bcrypt.compareSync(String(password || ''), u.hash))
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
// Chỉ tài khoản cố định đã xác thực mới được ghi lịch sử vào tài khoản.
const verifiedKey = (u) => {
  try {
    const payload = jwt.verify(String(u?.token || ''), SECRET)
    return payload.role === 'player' && mainAuth[payload.key] && !mainAuth[payload.key].locked && (payload.version || 0) === (mainAuth[payload.key].version || 0) ? payload.key : null
  } catch { return null }
}
const verifiedInfo = (u) => {
  const key = verifiedKey(u)
  if (!key) return { info: pub({ name: 'Khách', guest: true }), key: null }
  const account = mainData[key]?.user || { name: key, level: 1, avatar: '🧑' }
  return { info: pub(account), key }
}
const saveVerifiedMatch = (r, over) => {
  const id = r.matchId
  if (!id || onlineMatches.some(m => m.id === id)) return
  const at = new Date().toISOString()
  const match = { id, room: r.code, mode: r.mode, at, reason: over.reason, winner: over.winner, moves: r.moves.map(m => ({...m})), players: r.players.map(p => ({ name: p.info.name, sym: p.sym })) }
  onlineMatches.push(match)
  saveOnline()
  for (const p of r.players) {
    if (!p.accountKey) continue
    const k = p.accountKey
    const entry = mainData[k]
    if (!entry?.user) continue
    const result = !over.winner ? 'draw' : over.winner === p.sym ? 'win' : 'lose'
    const opponent = r.players.find(q => q.id !== p.id)?.info || { name: 'Đối thủ' }
    const otherPlayer = r.players.find(q => q.id !== p.id)
    const isFriendMatch = Boolean(otherPlayer?.accountKey && frOf(lbKey(entry.user.name)).friends.includes(lbKey(opponent.name)))
    const item = { id, room: r.code, opponent, result, moves: match.moves, reason: over.reason, at, onlineVerified: true, friendMatch: isFriendMatch }
    entry.matches = [item, ...(entry.matches || []).filter(m => m.id !== id)].slice(0, 500)
    const reward = { win: [500,20,100], draw: [100,5,30], lose: [50,0,20] }[result]
    const u = entry.user
    u.coins = (u.coins || 0) + reward[0]; u.gems = (u.gems || 0) + reward[1]
    u.exp = (u.exp || 0) + reward[2]
    u.expMax = u.expMax || (300 + ((u.level || 1) - 1) * 100)
    while (u.exp >= u.expMax) { u.exp -= u.expMax; u.level = (u.level || 1) + 1; u.expMax = 300 + (u.level - 1) * 100 }
    u.updatedAt = Date.now(); u.rev = (u.rev || 0) + 1
  }
  atomicSave(MAIN_FILE, mainData)
}
let quickWaiting = null // socket đang chờ ghép nhanh

const pub = (u) => ({ name: String(u?.name || 'Người chơi').slice(0, 24), level: Number(u?.level) || 1, avatar: u?.avatar || '🧑', guest: !!u?.guest })
const playersOf = (r) => r.players.map((p) => ({ ...p.info, sym: p.sym }))
const symOf = (r, sock) => r.players.find((p) => p.id === sock.id)?.sym

function newRoom(code, mode = DEFAULT_MODE) {
  const r = { matchId: randomUUID(), code, mode: modeOf(mode), name: '', pub: true, password: '', createdAt: Date.now(), players: [], board: createBoard(), moves: [], turn: 'X', started: false, over: null, timer: null, deadline: 0, drawFrom: null }
  rooms.set(code, r)
  return r
}

function startTurnTimer(r) {
  clearTimeout(r.timer)
  const sec = MODES[r.mode].turn
  r.deadline = Date.now() + sec * 1000
  r.timer = setTimeout(() => finish(r, { winner: r.turn === 'X' ? 'O' : 'X', reason: 'timeout' }), sec * 1000 + 800)
}

function finish(r, over) {
  if (r.over) return
  clearTimeout(r.timer)
  r.over = over
  if (r.players.length === 2 && over.reason !== 'admin-close') { // ghi kết quả lên bảng xếp hạng
    for (const p of r.players) recordResult(p.info, over.winner ? (over.winner === p.sym ? 'win' : 'lose') : 'draw', MODES[r.mode].mult)
    saveLb()
    saveVerifiedMatch(r, over)
  }
  io.to(r.code).emit('game:over', { ...over, matchId: r.matchId })
    r.cleanup = setTimeout(() => { if (rooms.get(r.code) === r) rooms.delete(r.code) }, 60_000)
}

function startGame(r) {
  r.started = true
  startTurnTimer(r)
  io.to(r.code).emit('game:start', { code: r.code })
}

function snapshotFor(r, sock) {
  return {
    code: r.code, matchId: r.matchId, mode: r.mode, turnTime: MODES[r.mode].turn, mult: MODES[r.mode].mult, you: symOf(r, sock), players: playersOf(r), moves: r.moves, turn: r.turn,
    timeLeft: Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000)), over: r.over,
  }
}

io.on('connection', (sock) => {
  sock.data.room = null

  const joinRoom = (r, user) => {
    const v = verifiedInfo(user)
    if (v.key && r.players.some(p => p.accountKey === v.key)) return false
    if (v.key) v.info.verified = true
    r.players.push({ id: sock.id, sym: r.players.length === 0 ? 'X' : 'O', info: v.info, accountKey: v.key })
    sock.join(r.code)
    sock.data.room = r.code
    io.to(r.code).emit('room:updated', { code: r.code, players: playersOf(r) })
    if (r.players.length === 2) startGame(r)
    return true
  }

  sock.on('room:create', ({ code, user, mode, password, name, pub } = {}, cb) => {
    if (sock.data.room) return cb?.({ ok: false, error: 'Hãy rời phòng hiện tại trước.' })
    let c = String(code || '').toUpperCase().slice(0, 8)
    if (!c) { // không gửi mã -> server tự cấp mã 4 số chưa ai dùng
      do { c = String(1000 + Math.floor(Math.random() * 9000)) } while (rooms.has(c))
    }
    if (!/^[A-Z0-9]{4,8}$/.test(c)) return cb?.({ ok: false, error: 'Mã phòng không hợp lệ' })
   const old = rooms.get(c)
if (old && !old.over) return cb?.({ ok: false, error: 'Mã phòng đã được sử dụng' })
if (old) { clearTimeout(old.timer); rooms.delete(c) }
    const nr = newRoom(c, mode)
    nr.password = String(password || '').slice(0, 20) // rỗng = phòng không có mật khẩu
    nr.name = String(name || 'Phòng ' + c).trim().slice(0, 30)
    nr.pub = pub !== false // Riêng tư: không hiện trong danh sách, chỉ vào bằng mã
    console.log('[room] tao phong', c, '- che do:', nr.mode, '- mat khau:', nr.password ? 'CO' : 'khong', '-', nr.pub ? 'cong khai' : 'rieng tu')
    joinRoom(nr, user)
    cb?.({ ok: true, code: c })
  })

  sock.on('room:join', ({ code, user, password } = {}, cb) => {
    if (sock.data.room) return cb?.({ ok: false, error: 'Hãy rời phòng hiện tại trước.' })
    const r = rooms.get(String(code || '').toUpperCase())
    if (!r || r.over) return cb?.({ ok: false, error: 'Không tìm thấy phòng' })
    if (r.players.length >= 2) return cb?.({ ok: false, error: 'Phòng đã đầy' })
    if (r.password && String(password || '') !== r.password)
      return cb?.({ ok: false, needPassword: true, error: password ? 'Sai mật khẩu phòng' : 'Phòng này có mật khẩu, hãy nhập mật khẩu' })
    if (!joinRoom(r, user)) return cb?.({ ok: false, error: 'Tài khoản đã có trong phòng.' })
    cb?.({ ok: true, code: r.code })
  })

  sock.on('quick:join', ({ user } = {}, cb) => {
    if (sock.data.room) return cb?.({ ok: false, error: 'Bạn đang ở trong một phòng.' })
    if (quickWaiting && quickWaiting.id !== sock.id && quickWaiting.connected) {
      const other = quickWaiting
      const firstKey = verifiedKey(other.data.user)
      const nextKey = verifiedKey(user)
      if (firstKey && firstKey === nextKey) {
        return cb?.({ ok: false, error: 'Không thể tự ghép trận bằng cùng một tài khoản.' })
      }
      quickWaiting = null
      let code
      do { code = 'Q' + randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase() } while (rooms.has(code))
      const r = newRoom(code, 'Caro nhanh')
      const first = verifiedInfo(other.data.user)
      if (first.key) first.info.verified = true
      r.players.push({ id: other.id, sym: 'X', info: first.info, accountKey: first.key })
      other.join(r.code)
      other.data.room = r.code
      if (!joinRoom(r, user)) {
        other.leave(r.code)
        other.data.room = null
        rooms.delete(r.code)
        quickWaiting = other
        return cb?.({ ok: false, error: 'Không thể ghép trận.' })
      }
    } else {
      quickWaiting = sock
      sock.data.user = user
    }
    cb?.({ ok: true })
  })

  // Trang Game vừa mở → xin trạng thái hiện tại của phòng
  sock.on('game:sync', ({ code } = {}, cb) => {
    const r = rooms.get(String(code || '').toUpperCase())
    if (!r || sock.data.room !== r.code || !symOf(r, sock)) return cb?.({ ok: false })
    cb?.({ ok: true, state: snapshotFor(r, sock) })
  })

    sock.on('game:move', ({ x, y } = {}) => {
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
    if (r && sym && r.started && !r.over) finish(r, { winner: sym === 'X' ? 'O' : 'X', reason: 'resign' })
  })

  sock.on('draw:offer', () => {
    const r = rooms.get(sock.data.room)
    if (!r || !r.started || r.over || !symOf(r, sock) || r.moves.length < 6 || r.drawFrom) return
    r.drawFrom = sock.id
    sock.to(r.code).emit('draw:offered')
  })
  sock.on('draw:answer', ({ accept } = {}) => {
    const r = rooms.get(sock.data.room)
    if (!r || !r.started || r.over || !symOf(r, sock) || !r.drawFrom || r.drawFrom === sock.id) return
    if (accept) finish(r, { winner: null, reason: 'agreed' })
    else sock.to(r.code).emit('draw:declined')
    r.drawFrom = null
  })

  sock.on('chat:send', ({ text } = {}) => {
    const r = rooms.get(sock.data.room)
    const p = r?.players.find((q) => q.id === sock.id)
    const t = String(text || '').trim().slice(0, 200)
    if (p && t && !r.over) sock.to(r.code).emit('chat:message', { from: p.info.name, text: t })
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
    r.matchId = randomUUID(); r.board = createBoard(); r.moves = []; r.turn = 'X'
    r.over = null; r.started = false; r.drawFrom = null
    r.players.forEach((p) => { p.sym = p.sym === 'X' ? 'O' : 'X' })
    io.to(r.code).emit('room:updated', { code: r.code, players: playersOf(r) })
    startGame(r) // phát 'game:start'
    cb?.({ ok: true, started: true })
  })

  const leave = () => {
    if (quickWaiting?.id === sock.id) quickWaiting = null
    const r = rooms.get(sock.data.room)
    if (!r || !symOf(r, sock)) { sock.data.room = null; return }
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