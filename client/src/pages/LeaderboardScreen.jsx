import { photoOf } from '../lib/avatar.js'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { Ico, PETALS, TopHud, useFit } from '../components/hud.jsx'
import { Backdrop, NeonFrame } from './WaitingRoom.jsx'
import { NAV } from './ProfileScreen.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'
import '../components/profile.css'
import '../components/leaderboard.css'

/* Màn hình 14 – Bảng xếp hạng (Leaderboard)
   Dựng hoàn toàn bằng code (SVG + CSS), không dùng ảnh thiết kế làm nền hay phủ lên.
   Stage 1280x720 tự thu phóng; nội dung (.lb-s) theo toạ độ ảnh mẫu 971x547 (phóng 1.31827 lần).
   Dữ liệu mẫu bên dưới; hàng của người chơi hiện tại luôn được ghim ở cuối bảng. */

const PER = 5
const norm = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')

const guestOut = (u) => !!u.guest // khách không lên bảng
const vn = (n) => Number(n).toLocaleString('vi-VN')
const pad = (n) => String(n).padStart(2, '0')
const stamp = (d = new Date()) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`

/* ---------- icon ---------- */
const Globe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9.500" /><path d="M2.500 12h19M12 2.500c3 3 3.800 6.200 3.800 9.500S15 18.500 12 21.500M12 2.500C9 5.500 8.200 8.700 8.200 12S9 18.500 12 21.500" />
  </svg>
)
const Friends = () => (
  <svg width="24" height="22" viewBox="0 0 26 24" fill="#fff" aria-hidden>
    <circle cx="9" cy="7" r="4.400" /><path d="M1 21c0-5.200 3.600-8 8-8s8 2.800 8 8z" />
    <circle cx="18.600" cy="7.800" r="3.600" opacity=".9" /><path d="M17 13.400c4.400-.3 8 2 8 7.600h-5c0-3-1.200-5.600-3-7.600z" opacity=".9" />
  </svg>
)
const Trophy = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round" aria-hidden style={{ filter: 'drop-shadow(0 0 5px rgba(150,200,255,.8))' }}>
    <path d="M7 3h10v6a5 5 0 0 1-10 0z" /><path d="M7 5H3.500v1.500A3.500 3.500 0 0 0 7 10M17 5h3.500v1.500A3.500 3.500 0 0 1 17 10" fill="none" strokeWidth="1.800" strokeLinecap="round" />
    <rect x="10.800" y="14" width="2.400" height="4" /><rect x="7.500" y="18" width="9" height="2.600" rx="1" />
  </svg>
)
const BarsBig = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="2.500" y="11" width="5.600" height="10.500" rx="1" /><rect x="9.200" y="2.500" width="5.600" height="19" rx="1" /><rect x="15.900" y="7" width="5.600" height="14.500" rx="1" /></svg>
)
const BarsSm = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="#9fc4ff" aria-hidden><rect x="3" y="12" width="4.600" height="9" rx="1" /><rect x="9.700" y="3" width="4.600" height="18" rx="1" /><rect x="16.400" y="8" width="4.600" height="13" rx="1" /></svg>
)
const Refresh = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 8A8.500 8.500 0 0 0 5.200 6.200L3.500 8M3.500 3.500V8H8" /><path d="M4 16a8.500 8.500 0 0 0 14.800 1.800l1.700-1.800M20.500 20.500V16H16" />
  </svg>
)
const Chev = ({ d = 'left' }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: d === 'left' ? 'none' : 'scaleX(-1)' }}><path d="M15 4.500L7.500 12 15 19.500" /></svg>
)

let sid = 0
const Star = ({ size = 18 }) => {
  const [id] = useState(() => 'lbstar' + ++sid)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ filter: 'drop-shadow(0 0 3px rgba(255,190,40,.8))' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe873" /><stop offset=".55" stopColor="#ffc020" /><stop offset="1" stopColor="#f09a0c" /></linearGradient></defs>
      <path d="M12 2.300l2.900 6.200 6.800.8-5 4.700 1.300 6.700L12 17.300 6 20.700l1.300-6.700-5-4.700 6.800-.8z" fill={`url(#${id})`} stroke="#fff3b0" strokeWidth="1.300" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- vương miện số hạng + vòng nguyệt quế ---------- */
const THEME = {
  1: { c1: '#fff0a8', c2: '#f4a712', edge: '#fff6c8', leaf1: '#fff0b0', leaf2: '#d9961a', ring1: '#ffe48a', ring2: '#d68a14', glow: 'rgba(255,190,50,.95)' },
  2: { c1: '#eaf6ff', c2: '#5d95e8', edge: '#f2faff', leaf1: '#e6f3ff', leaf2: '#7aa6ff', ring1: '#dff0ff', ring2: '#5f8ee0', glow: 'rgba(110,180,255,.95)' },
  3: { c1: '#ffe0cc', c2: '#c0683e', edge: '#fff0e6', leaf1: '#ffe2d0', leaf2: '#d88b62', ring1: '#ffd2b6', ring2: '#b8623a', glow: 'rgba(255,150,100,.9)' },
}

function Crown({ rank, w, h }) {
  const t = THEME[rank]
  return (
    <svg className="lb-crown" width={w} height={h} viewBox="0 0 46 36" aria-hidden style={{ filter: `drop-shadow(0 0 6px ${t.glow})` }}>
      <defs><linearGradient id={`lbcr${rank}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c2} /></linearGradient></defs>
      <path d="M4 31L1.500 9.500l11 8.500L23 2.500 33.500 18l11-8.500L42 31z" fill={`url(#lbcr${rank})`} stroke={t.edge} strokeWidth="1.300" strokeLinejoin="round" />
      <rect x="4" y="29" width="38" height="5" rx="1.800" fill={t.c2} stroke={t.edge} strokeWidth="1" />
      <g fill={t.edge} stroke={t.c2} strokeWidth=".8"><circle cx="2" cy="8.800" r="2.300" /><circle cx="23" cy="2.600" r="2.500" /><circle cx="44" cy="8.800" r="2.300" /></g>
      <text x="23" y="25.200" textAnchor="middle" fontSize="14.500" fontWeight="800" fill="#16206e" stroke="#16206e" strokeWidth=".3" fontFamily="inherit">{rank}</text>
    </svg>
  )
}

function Laurel({ rank, r }) {
  const t = THEME[rank]
  const R = r + 10
  const size = (R + 12) * 2
  const c = size / 2
  const angles = [-44, -27, -10, 7, 24, 41, 58]
  return (
    <svg className="lb-laurel" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ filter: `drop-shadow(0 0 4px ${t.glow})` }}>
      <defs><linearGradient id={`lbl${rank}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.leaf1} /><stop offset="1" stopColor={t.leaf2} /></linearGradient></defs>
      {[1, -1].map((side) => angles.map((a, i) => {
        const rad = (a * Math.PI) / 180
        const x = c + side * R * Math.cos(rad)
        const y = c - R * Math.sin(rad)
        const s = 1 - i * 0.05
        return <ellipse key={`${side}${i}`} cx={0} cy={0} rx={2.700 * s} ry={6.200 * s} fill={`url(#lbl${rank})`} stroke={t.edge} strokeWidth=".5" strokeOpacity=".7"
          transform={`translate(${x} ${y}) rotate(${side * (-a + 22)})`} />
      }))}
    </svg>
  )
}

/* ---------- sân khấu: chùm đèn + 3 bục ---------- */
function Plinth({ id, cx, top, w, h, base, c1, c2, rim, glow }) {
  const x0 = cx - w / 2, x1 = cx + w / 2, bot = top + h
  return (
    <g>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} stopOpacity=".85" /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={c2} /><stop offset=".5" stopColor={rim} /><stop offset="1" stopColor={c2} /></linearGradient>
        <filter id={`${id}g`} x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx={cx} cy={bot + 6} rx={base / 2 + 8} ry="12" fill={glow} opacity=".5" filter={`url(#${id}g)`} />
      <ellipse cx={cx} cy={bot + 3} rx={base / 2} ry="9" fill={`url(#${id}s)`} stroke={rim} strokeOpacity=".9" strokeWidth="1.400" />
      <ellipse cx={cx} cy={bot + 1} rx={base / 2 - 14} ry="6" fill="none" stroke={rim} strokeOpacity=".35" strokeWidth=".8" />
      <path d={`M${x0} ${top} V${bot - 4} Q${cx} ${bot + 5} ${x1} ${bot - 4} V${top}Z`} fill={`url(#${id}b)`} stroke={rim} strokeWidth="1.400" strokeLinejoin="round" />
      <ellipse cx={cx} cy={top} rx={w / 2} ry="7" fill={`url(#${id}t)`} stroke={rim} strokeWidth="1.300" />
      <ellipse cx={cx} cy={top} rx={w / 2 - 5} ry="4.200" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />
    </g>
  )
}

function Scene() {
  const beams = [[262, 236, -26], [425, 237, -4], [650, 236, 18], [190, 246, -34], [742, 246, 30]]
  return (
    <svg className="lb-scene" width="971" height="547" viewBox="0 0 971 547" aria-hidden>
      <defs>
        <linearGradient id="lbbeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#bfe0ff" stopOpacity=".5" /><stop offset=".6" stopColor="#7fa8ff" stopOpacity=".14" /><stop offset="1" stopColor="#7fa8ff" stopOpacity="0" /></linearGradient>
        <radialGradient id="lbhalo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffd06a" stopOpacity=".55" /><stop offset="1" stopColor="#ffd06a" stopOpacity="0" /></radialGradient>
        <radialGradient id="lbhaloL" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#5aa8ff" stopOpacity=".5" /><stop offset="1" stopColor="#5aa8ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="lbhaloR" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#e060ff" stopOpacity=".5" /><stop offset="1" stopColor="#e060ff" stopOpacity="0" /></radialGradient>
      </defs>

      {/* quầng sáng sau 3 người đứng đầu */}
      <ellipse cx="538" cy="180" rx="150" ry="110" fill="url(#lbhalo)" />
      <ellipse cx="346" cy="190" rx="120" ry="90" fill="url(#lbhaloL)" />
      <ellipse cx="729" cy="190" rx="120" ry="90" fill="url(#lbhaloR)" />

      {/* chùm đèn */}
      {beams.map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <path d={`M${x - 7} ${y} L${x + 7} ${y} L${x + 52} ${y - 190} L${x - 52} ${y - 190}Z`} fill="url(#lbbeam)" opacity={i > 2 ? 0.55 : 0.9} />
        </g>
      ))}

      {/* bục */}
      <Plinth id="lbpb" cx={346} top={207} w={133} h={43} base={190} c1="#2f58e0" c2="#122272" rim="#79bcff" glow="#4a8cff" />
      <Plinth id="lbpp" cx={725} top={207} w={134} h={43} base={196} c1="#7a30c8" c2="#2e0f6e" rim="#d68aff" glow="#d060ff" />
      <Plinth id="lbpg" cx={536} top={198} w={152} h={52} base={212} c1="#f2bc3a" c2="#8e5a10" rim="#ffe48a" glow="#ffb82a" />

      {/* đèn rọi nhỏ trên bậc */}
      {[262, 425, 650].map((x) => (
        <g key={x}>
          <rect x={x - 9} y="232" width="18" height="9" rx="2" fill="#1a2a8a" stroke="#7fb4ff" strokeWidth="1" />
          <ellipse cx={x} cy="232" rx="7" ry="2.600" fill="#dff0ff" />
        </g>
      ))}

      {/* confetti */}
      {[[250, 136, 24, '#ff8ab8'], [452, 142, -20, '#ff9a5a'], [638, 143, 30, '#ffb04a'], [186, 213, 40, '#ff8ae6'], [848, 190, 14, '#ff8ae6'], [818, 268, 20, '#ffb04a']].map(([x, y, r, c], i) => (
        <rect key={i} x={x} y={y} width="7" height="5" rx="1" fill={c} opacity=".85" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </svg>
  )
}

/* ---------- huy hiệu người chơi trên bục ---------- */
const MEDAL = {
  1: { x: 538, y: 164, r: 33, crown: [46, 35], cy: 124 },
  2: { x: 346, y: 175, r: 29.5, crown: [44, 34], cy: 133 },
  3: { x: 729, y: 174, r: 29.5, crown: [43, 33], cy: 133 },
}

function Medal({ p, rank }) {
  const m = MEDAL[rank]
  const t = THEME[rank]
  const src = photoOf(p.avatar)
  return (
    <>
      <div className="lb-laurel-wrap" style={{ left: m.x, top: m.y }}><Laurel rank={rank} r={m.r} /></div>
      <div className="lb-medal" style={{ left: m.x - m.r, top: m.y - m.r, width: m.r * 2, height: m.r * 2, background: `linear-gradient(160deg, ${t.ring1}, ${t.ring2})`, boxShadow: `0 0 12px ${t.glow}, 0 0 3px ${t.edge}` }}>
        <span>{src ? <img src={src} alt="" draggable={false} /> : <i>{p.avatar}</i>}</span>
      </div>
      <div className="lb-crown-wrap" style={{ left: m.x - m.crown[0] / 2, top: m.cy - m.crown[1] / 2 }}><Crown rank={rank} w={m.crown[0]} h={m.crown[1]} /></div>
    </>
  )
}

function Tag({ p, rank }) {
  return (
    <div className={`lb-tag t${rank}`}>
      <b>{p.name}</b>
      <em>Lv.{p.level}</em>
      <span><Star size={rank === 1 ? 19 : 17} />{vn(p.score)}</span>
    </div>
  )
}

const Av = ({ a, big }) => {
  const src = photoOf(a)
  return <span className={`lb-av ${big ? 'big' : ''}`}>{src ? <img src={src} alt="" draggable={false} /> : <i>{a}</i>}</span>
}

const NAV_TOPS = [97, 161, 210, 258, 307, 356]
export const NAV_ICON = { history: <Trophy />, rank: <BarsBig /> }

export default function LeaderboardScreen() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('global')
  const [page, setPage] = useState(1)
  const [updated, setUpdated] = useState(() => stamp())
  const [spin, setSpin] = useState(false)
  const [players, setPlayers] = useState([]) // dữ liệu thật từ server
  const [err, setErr] = useState(false)
  const [friends, setFriends] = useState([]) // bạn bè thật (đã chấp nhận)
  const [incoming, setIncoming] = useState([]) // lời mời kết bạn đang chờ
  const [fOpen, setFOpen] = useState(false)
  const [fName, setFName] = useState('')
  const fcall = useCallback((action, to) => fetch('/api/friends', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('xo_player_token') || ''}` },
    body: JSON.stringify({ me: user?.name, myName: user?.name, action, to }),
  }).then(async (r) => ({ ok: r.ok, ...(await r.json()) })).then((d) => {
    if (d.ok) { setFriends(d.friends || []); setIncoming(d.incoming || []) }
    return d
  }).catch(() => ({ ok: false, error: 'Không kết nối được server.' })), [user?.name])
  const load = useCallback(() => fetch('/api/leaderboard').then((r) => r.json())
    .then((d) => { setPlayers(d.players || []); setErr(false); setUpdated(stamp()) })
    .catch(() => setErr(true)), [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (user && !user.guest) fcall('list') }, [fcall]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!user) return null

  const myKey = norm(user.name)
  const all = players.map((p) => (norm(p.name) === myKey ? { ...p, me: true, level: user.level, avatar: user.avatar } : p))
  const inList = all.some((p) => p.me)
  const meEntry = all.find((p) => p.me) || { me: true, name: user.name, level: user.level, avatar: user.avatar, wins: 0, score: 0 }
  const byScore = (a, b) => b.score - a.score || b.wins - a.wins
  const real = tab === 'global' ? all
    : [...friends.map((f) => ({ ...f, me: false })), meEntry].sort(byScore) // tab Bạn bè: mình + bạn bè
  const list = inList || guestOut(user) ? real : [...real, { me: true, name: user.name, level: user.level, avatar: user.avatar, wins: 0, score: 0 }]
  const ranked = list.map((p, i) => ({ ...p, rank: i + 1 }))
  const top = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const pages = Math.max(1, Math.ceil(rest.length / PER))
  const cur = Math.min(page, pages)
  const view = rest.slice((cur - 1) * PER, cur * PER)
  const mine = ranked.find((p) => p.me)
  const first = Math.max(1, Math.min(cur - 1, pages - 2))
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => first + i)
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }
  const refresh = () => {
    if (spin) return
    setSpin(true)
    Promise.all([load(), user.guest ? null : fcall('list')]).finally(() => setTimeout(() => setSpin(false), 500))
  }
  const doFriend = async (action, to) => {
    const d = await fcall(action, to)
    if (!d.ok) return setToast(d.error || 'Có lỗi xảy ra')
    if (action === 'add') { setFName(''); setToast('Đã gửi lời mời kết bạn') }
    if (action === 'accept') setToast('Đã chấp nhận kết bạn')
    if (action === 'remove') setToast('Đã xóa bạn')
    return undefined
  }
  const pick = (t) => { setTab(t); setPage(1) }
  const order = [top[1], top[0], top[2]].filter(Boolean)

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage lb-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="lb-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="lb-s">
          <Scene />

          {/* ===== menu trái ===== */}
          {NAV.map((n, i) => {
            const on = n.k === 'rank'
            return (
              <button key={n.k} type="button" className={`lb-nav ${on ? 'on' : ''} ${n.k === 'back' ? 'back' : ''}`} style={{ top: NAV_TOPS[i] }}
                onClick={!on && n.to ? () => nav(n.to) : undefined}>
                <NeonFrame w={144} h={40} c={9} id={`lbn${i}`} inset={3} sw={on ? 1.800 : 1.400}
                  c1={on ? '#ff9af5' : '#78b4ff'} c2={on ? '#c05cff' : '#5a7cff'}
                  fill={on ? ['rgba(92,34,200,.95)', 'rgba(44,16,140,.97)'] : ['rgba(16,28,140,.9)', 'rgba(8,12,96,.94)']} />
                <span className="lb-nav-in">{NAV_ICON[n.k] || n.icon}<b>{n.label}</b></span>
              </button>
            )
          })}

          {/* ===== tiêu đề ===== */}
          <div className="lb-title">
            <NeonFrame w={275} h={49} c={18} id="lbt" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.92)', 'rgba(4,8,70,.95)']} inset={4} sw={1.600} />
            <span className="lb-title-in">
              <b><Ico n="trophy" size={28} fill="#fff" sw={1.200} />Bảng xếp hạng</b>
              <em>Top người chơi xuất sắc nhất X-O Arena</em>
            </span>
          </div>

          {/* ===== Toàn cầu / Bạn bè ===== */}
          <div className="lb-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'global'} className={tab === 'global' ? 'on' : ''} onClick={() => pick('global')}><Globe />Toàn cầu</button>
            <button type="button" role="tab" aria-selected={tab === 'friends'} className={tab === 'friends' ? 'on' : ''} onClick={() => pick('friends')}><Friends />Bạn bè</button>
          </div>

          {tab === 'friends' && (
            <button type="button" className="lb-addfr" onClick={() => user.guest ? setToast('Khách không dùng được tính năng bạn bè') : setFOpen(true)}
              style={{ left: 640, top: 71, height: 35, padding: '0 12px', zIndex: 6, borderRadius: 12, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(160,205,255,.9)', background: 'linear-gradient(180deg, rgba(60,96,235,.85), rgba(40,40,190,.85))' }}>
              + Bạn bè{incoming.length > 0 && <b style={{ marginLeft: 6, background: '#ff4f7a', borderRadius: 9, padding: '1px 6px' }}>{incoming.length}</b>}
            </button>
          )}

          {/* ===== podium ===== */}
          {order.map((p) => <Medal key={p.rank} p={p} rank={p.rank} />)}
          {order.map((p) => <Tag key={p.rank} p={p} rank={p.rank} />)}

          {/* ===== bảng hạng 4+ ===== */}
          <div className="lb-table">
            <NeonFrame w={763} h={216} c={16} id="lbp" c1="#6fc4ff" c2="#8a6bff" fill={['rgba(10,22,128,.5)', 'rgba(8,12,100,.7)']} inset={5} sw={2} />
          </div>
          <div className="lb-head">
            <span className="c-rank">Hạng</span><span className="c-name">Tên người chơi</span><span className="c-lv">Cấp độ</span><span className="c-win">Số trận thắng</span><span className="c-pt">Điểm xếp hạng</span>
          </div>

          {err && <div style={{ left: 180, top: 300, width: 750, textAlign: 'center', color: '#ffb4c8', fontSize: 13, zIndex: 5 }}>Không kết nối được server để lấy bảng xếp hạng.</div>}
          {!err && ranked.length === 0 && <div style={{ left: 180, top: 300, width: 750, textAlign: 'center', color: '#cfd8ff', fontSize: 13, zIndex: 5 }}>Chưa có ai trên bảng. Hãy đấu một ván online để lên hạng!</div>}
          {view.map((p, i) => (
            <div key={p.rank} className={`lb-row ${p.me ? 'me' : ''}`} style={{ top: 305 + i * 26.6 }}>
              <b className="c-rank">{p.rank}</b>
              <Av a={p.avatar} />
              <span className="c-name">{p.name}</span>
              <span className="c-lv">Lv.{p.level}</span>
              <span className="c-win">{p.wins}</span>
              <span className="c-pt"><Star size={19} /><b>{vn(p.score)}</b></span>
            </div>
          ))}

          {/* hàng của mình – luôn ghim cuối bảng */}
          {mine && (
            <div className="lb-me">
              <b className="c-rank">{mine.rank}</b>
              <Av a={mine.avatar} big />
              <span className="c-name">{mine.name}</span>
              <span className="c-lv">Lv.{mine.level}</span>
              <span className="c-win">{mine.wins}</span>
              <span className="c-pt"><Star size={20} /><b>{vn(mine.score)}</b></span>
            </div>
          )}

          {/* ===== cập nhật + phân trang ===== */}
          <div className="lb-upd">
            <NeonFrame w={192} h={33} c={10} id="lbu" c1="#6fb4ff" c2="#6a7cff" fill={['rgba(18,30,150,.85)', 'rgba(8,14,104,.92)']} inset={3} sw={1.500} />
            <span className="lb-upd-in"><BarsSm /><span>Cập nhật: {updated}</span></span>
            <button type="button" className={`lb-refresh ${spin ? 'spin' : ''}`} onClick={refresh} aria-label="Làm mới bảng xếp hạng"><Refresh /></button>
          </div>
          <div className="lb-pager">
            <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Trang trước"><Chev d="left" /></button>
            {nums.map((n) => <button key={n} type="button" className={n === cur ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>)}
            <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Trang sau"><Chev d="right" /></button>
          </div>
        </div>

        {/* ===== thanh trên + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="lb-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {fOpen && (
        <Modal onClose={() => setFOpen(false)}>
          <div className="panel-title">👥 Bạn bè</div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (fName.trim()) doFriend('add', fName.trim()) }} style={{ marginBottom: 10 }}>
            <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Nhập tên người chơi..." maxLength={24} style={{ flex: 1 }} />
            <button className="btn sm" type="submit">Kết bạn</button>
          </form>
          {incoming.length > 0 && <>
            <b>Lời mời kết bạn</b>
            {incoming.map((p) => (
              <div key={p.key} className="row" style={{ margin: '6px 0', justifyContent: 'space-between' }}>
                <span>{p.name} · Lv.{p.level}</span>
                <span><button className="btn sm" onClick={() => doFriend('accept', p.name)}>Chấp nhận</button> <button className="btn sm" onClick={() => doFriend('decline', p.name)}>Từ chối</button></span>
              </div>
            ))}
          </>}
          <div style={{ margin: '10px 0 4px' }}><b>Danh sách bạn bè ({friends.length})</b></div>
          {friends.length === 0 && <p className="muted">Chưa có bạn bè. Nhập tên người đã từng đấu online để gửi lời mời.</p>}
          {friends.map((p) => (
            <div key={p.name} className="row" style={{ margin: '6px 0', justifyContent: 'space-between' }}>
              <span>{p.name} · Lv.{p.level} · ⭐ {vn(p.score)}</span>
              <button className="btn sm" onClick={() => window.confirm(`Xóa ${p.name} khỏi bạn bè?`) && doFriend('remove', p.name)}>Xóa</button>
            </div>
          ))}
          <button className="btn block" style={{ marginTop: 10 }} onClick={() => setFOpen(false)}>Đóng</button>
        </Modal>
      )}
      {toast}
    </div>
  )
}
