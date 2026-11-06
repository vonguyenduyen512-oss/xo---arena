import { photoOf } from '../lib/avatar.js'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { useToast } from '../components/Layout.jsx'
import { call, socket } from '../lib/socket.js'
import { Crown, Gem, Ico, PETALS, useFit } from '../components/hud.jsx'
import { Backdrop, BigCrown, Silhouette, Versus } from './WaitingRoom.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'
import '../components/result.css'

/* Màn hình 11 – Kết quả trận đấu (Chiến thắng / Thất bại / Hòa)
   Dựng hoàn toàn bằng code (SVG + CSS), KHÔNG dùng ảnh thiết kế làm nền hay phủ lên.
   Stage 1280x720 tự thu phóng; nội dung (.wr-s) theo toạ độ ảnh mẫu 951x535 rồi phóng 1.3459 lần
   (cùng hệ toạ độ với màn Chờ đối thủ), nên các số trong result.css khớp 1:1 với ảnh mẫu.
   Dữ liệu thật: state.match từ màn Game (result, moves, opponent), user + matches từ store. */

const REWARD = { win: [500, 20], draw: [100, 5], lose: [50, 0] }

const THEME = {
  win: {
    title: 'CHIẾN THẮNG', sub: 'Bạn đã giành chiến thắng!', crown: true,
    g: ['#fff6b8', '#ffd23c', '#ff9a14'], edge: '#8a3300', glow: 'rgba(255,190,50,.85)', wing: ['#fffbe0', '#ffd75a', '#e6900c'],
  },
  lose: {
    title: 'THẤT BẠI', sub: 'Đừng nản, thử lại nhé!', crown: false,
    g: ['#ffe3ee', '#ff8fb8', '#d6407a'], edge: '#5a0f3a', glow: 'rgba(255,100,170,.8)', wing: ['#f4e8ff', '#c9a6ff', '#7a4bd6'],
  },
  draw: {
    title: 'HÒA', sub: 'Một trận cân tài cân sức!', crown: false,
    g: ['#f2fcff', '#8fe3ff', '#3a9bff'], edge: '#0b2f78', glow: 'rgba(110,200,255,.85)', wing: ['#f2fcff', '#a8e6ff', '#3f8dff'],
  },
}
const TAG = { win: 'Thắng', lose: 'Thua', draw: 'Hòa' }

/* ---------- tiêu đề có cánh ---------- */
function Feather({ a, len, w, fill }) {
  // một chiếc lông: hình giọt nước, gốc ở (0,0), hướng theo góc a (độ)
  return (
    <path transform={`rotate(${a})`} d={`M0 0 C ${len * .25} ${-w} ${len * .8} ${-w * .8} ${len} 0 C ${len * .8} ${w * .5} ${len * .3} ${w * .6} 0 0z`}
      fill={fill} stroke="#fff6d0" strokeOpacity=".75" strokeWidth=".9" strokeLinejoin="round" />
  )
}

function Wing({ side, t }) {
  const f = ['wrwg', 'wrwg', 'wrwg', 'wrwg', 'wrwg', 'wrwg']
  // gốc cánh nằm sát tấm biển, các lông xoè dần lên trên
  const feathers = [
    { a: -66, len: 58, w: 9 }, { a: -50, len: 74, w: 10 }, { a: -35, len: 88, w: 11 },
    { a: -20, len: 96, w: 11 }, { a: -6, len: 94, w: 10.5 }, { a: 8, len: 84, w: 9.5 }, { a: 22, len: 66, w: 8 },
  ]
  return (
    <g transform={`translate(${side === 'l' ? 96 : 284} 62) scale(${side === 'l' ? -1 : 1} 1)`}>
      {feathers.map((p, i) => <Feather key={i} {...p} fill={`url(#${f[i]})`} />)}
      <path d="M0 6 C 22 -10 52 -22 84 -14" fill="none" stroke="#fff8d8" strokeOpacity=".7" strokeWidth="1.2" />
    </g>
  )
}

function Banner({ result }) {
  const t = THEME[result]
  return (
    <svg className="rs-banner" width="380" height="104" viewBox="0 0 380 104" aria-hidden>
      <defs>
        <linearGradient id="rstxt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.g[0]} /><stop offset=".5" stopColor={t.g[1]} /><stop offset="1" stopColor={t.g[2]} />
        </linearGradient>
        <linearGradient id="wrwg" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor={t.wing[2]} /><stop offset=".55" stopColor={t.wing[1]} /><stop offset="1" stopColor={t.wing[0]} />
        </linearGradient>
        <filter id="rsglow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3.200" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#rsglow)" style={{ filter: `drop-shadow(0 0 6px ${t.glow})` }}>
        <Wing side="l" t={t} />
        <Wing side="r" t={t} />
      </g>
      <g style={{ filter: `drop-shadow(0 0 7px ${t.glow})` }}>
        <text x="190" y="64" textAnchor="middle" fontSize="38" fontWeight="800" letterSpacing=".3"
          {...(result === 'win' ? { textLength: 262, lengthAdjust: 'spacingAndGlyphs' } : {})}
          fill="none" stroke={t.edge} strokeWidth="8" strokeLinejoin="round" fontFamily="'Inter Tight','Inter',sans-serif">{t.title}</text>
        <text x="190" y="64" textAnchor="middle" fontSize="38" fontWeight="800" letterSpacing=".3"
          {...(result === 'win' ? { textLength: 262, lengthAdjust: 'spacingAndGlyphs' } : {})}
          fill="none" stroke="#ff8a1a" strokeWidth="4.200" strokeLinejoin="round" fontFamily="'Inter Tight','Inter',sans-serif">{t.title}</text>
        <text x="190" y="64" textAnchor="middle" fontSize="38" fontWeight="800" letterSpacing=".3"
          {...(result === 'win' ? { textLength: 262, lengthAdjust: 'spacingAndGlyphs' } : {})}
          fill="url(#rstxt)" fontFamily="'Inter Tight','Inter',sans-serif">{t.title}</text>
      </g>
    </svg>
  )
}

/* ---------- khung lớn (viền chuyển xanh → tím) ---------- */
const octa = (w, h, c) => [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]
const pts = (a) => a.map(([x, y]) => `${x},${y}`).join(' ')

function BigFrame({ w, h }) {
  return (
    <svg className="rs-frame" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id="rsfg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4cc4ff" /><stop offset=".5" stopColor="#7a8cff" /><stop offset="1" stopColor="#d05cff" />
        </linearGradient>
        <linearGradient id="rsff" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(10,28,140,.5)" /><stop offset=".5" stopColor="rgba(14,12,110,.58)" /><stop offset="1" stopColor="rgba(40,10,120,.56)" />
        </linearGradient>
      </defs>
      <polygon points={pts(octa(w, h, 22))} fill="url(#rsff)" stroke="url(#rsfg)" strokeWidth="2.400" strokeLinejoin="round" />
      <polygon points={pts(octa(w - 12, h - 12, 18).map(([x, y]) => [x + 6, y + 6]))} fill="none" stroke="url(#rsfg)" strokeOpacity=".6" strokeWidth=".9" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- avatar của mình: vòng sáng + vòng nguyệt quế vàng + vương miện ---------- */
function Laurel({ r = 84, side }) {
  const n = 13
  const leaves = Array.from({ length: n }, (_, i) => {
    const phi = side === 'l' ? 182 - i * 6.6 : -2 + i * 6.6 // độ, 90° = đáy
    const rad = (phi * Math.PI) / 180
    const out = i % 2 === 0
    const rr = r + (out ? 2 : -4)
    return { x: Math.cos(rad) * rr, y: Math.sin(rad) * rr, rot: phi + (side === 'l' ? -90 : 90) + (out ? 32 : -22) * (side === 'l' ? -1 : 1), s: 1.55 - i * 0.03 }
  })
  return (
    <g>
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.s})`}>
          <path d="M0 0 C 4 -5 5 -13 0 -19 C -5 -13 -4 -5 0 0z" fill="url(#rslaurel)" stroke="#fff0b0" strokeWidth=".7" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  )
}

function MeAvatar({ user, win }) {
  const photo = photoOf(user.avatar)
  return (
    <div className="rs-av rs-av-me">
      {win && <svg className="rs-laurel" width="200" height="200" viewBox="-100 -100 200 200" aria-hidden>
        <defs>
          <linearGradient id="rslaurel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2a8" /><stop offset=".5" stopColor="#ffc83a" /><stop offset="1" stopColor="#e08a06" /></linearGradient>
        </defs>
        <g style={{ filter: 'drop-shadow(0 0 4px rgba(255,190,50,.8))' }}><Laurel side="l" /><Laurel side="r" /></g>
      </svg>}
      <div className="rs-av-pic">
        {photo ? <img src={photo} alt="" draggable={false} /> : <b className="emoji">{user.avatar}</b>}
      </div>
      <span className="rs-av-ring" />
      {win && <span className="rs-av-crown"><BigCrown /></span>}
    </div>
  )
}

function PlayerTag({ kind }) {
  // kind: win | lose | draw → viền vàng / tím / xanh
  const w = 152, h = 38
  const hex = [[15, 1], [w - 15, 1], [w - 1, h / 2], [w - 15, h - 1], [15, h - 1], [1, h / 2]]
  const id = `rst-${kind}`
  const C = { win: ['#ffe27a', '#e0900c', 'rgba(70,40,0,.5)', 'rgba(30,10,0,.6)'], lose: ['#c9a6ff', '#7a4bd6', 'rgba(40,20,130,.6)', 'rgba(20,8,90,.72)'], draw: ['#9ee6ff', '#3f8dff', 'rgba(10,50,150,.55)', 'rgba(6,24,100,.7)'] }[kind]
  return (
    <div className={`rs-tag ${kind}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C[0]} /><stop offset="1" stopColor={C[1]} /></linearGradient>
          <linearGradient id={id + 'f'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C[2]} /><stop offset="1" stopColor={C[3]} /></linearGradient>
        </defs>
        <polygon points={pts(hex)} fill={`url(#${id}f)`} stroke={`url(#${id})`} strokeWidth="1.800" strokeLinejoin="round" />
        <polygon points={pts(hex.map(([x, y]) => [x + (x < w / 2 ? 5 : -5), y + (y < h / 2 ? 3.500 : y > h / 2 ? -3.500 : 0)]))} fill="none" stroke={`url(#${id})`} strokeOpacity=".5" strokeWidth=".8" strokeLinejoin="round" />
      </svg>
      <span>{TAG[kind]}</span>
    </div>
  )
}

/* ---------- bàn cờ thu nhỏ (vẽ theo nước đi thật) ---------- */
const BW = 254, BH = 125, N = 15

function ResultBoard({ moves = [] }) {
  const g = useMemo(() => {
    let s = 19.600
    let cols = Math.floor(BW / s), rows = Math.floor(BH / s)
    let x0 = 0, y0 = 0
    if (moves.length) {
      const xs = moves.map((m) => m.x), ys = moves.map((m) => m.y)
      const minX = Math.min(...xs) - 1, maxX = Math.max(...xs) + 1
      const minY = Math.min(...ys) - 1, maxY = Math.max(...ys) + 1
      const bw = maxX - minX + 1, bh = maxY - minY + 1
      while ((bw > cols || bh > rows) && s > 8) { s -= 0.5; cols = Math.floor(BW / s); rows = Math.floor(BH / s) }
      cols = Math.min(cols, N); rows = Math.min(rows, N)
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      x0 = Math.max(0, Math.min(N - cols, Math.round(cx - (cols - 1) / 2)))
      y0 = Math.max(0, Math.min(N - rows, Math.round(cy - (rows - 1) / 2)))
    }
    return { s, cols, rows, x0, y0 }
  }, [moves])
  const { s, cols, rows, x0, y0 } = g
  const ox = (BW - cols * s) / 2, oy = (BH - rows * s) / 2
  const cells = moves.filter((m) => m.x >= x0 && m.x < x0 + cols && m.y >= y0 && m.y < y0 + rows)
  return (
    <svg className="rs-grid" width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} aria-hidden>
      <g stroke="rgba(90,175,255,.42)" strokeWidth=".8">
        {Array.from({ length: cols + 1 }, (_, i) => <line key={'v' + i} x1={ox + i * s} y1={oy} x2={ox + i * s} y2={oy + rows * s} />)}
        {Array.from({ length: rows + 1 }, (_, i) => <line key={'h' + i} x1={ox} y1={oy + i * s} x2={ox + cols * s} y2={oy + i * s} />)}
      </g>
      {cells.map((m) => {
        const cx = ox + (m.x - x0 + 0.5) * s, cy = oy + (m.y - y0 + 0.5) * s, k = s * 0.26
        return m.s === 'X' ? (
          <g key={`${m.x},${m.y}`} stroke="#58dcff" strokeWidth={Math.max(2, s * 0.13)} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(60,200,255,.95))' }}>
            <path d={`M${cx - k} ${cy - k}L${cx + k} ${cy + k}M${cx + k} ${cy - k}L${cx - k} ${cy + k}`} />
          </g>
        ) : (
          <circle key={`${m.x},${m.y}`} cx={cx} cy={cy} r={s * 0.28} fill="none" stroke="#ff7ee6" strokeWidth={Math.max(2, s * 0.12)} style={{ filter: 'drop-shadow(0 0 3px rgba(255,100,230,.95))' }} />
        )
      })}
    </svg>
  )
}

/* ---------- icon nhỏ ---------- */
const Gift = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs><linearGradient id="rsgift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#f0a010" /></linearGradient></defs>
    <rect x="3" y="9" width="18" height="12" rx="1.500" fill="url(#rsgift)" />
    <rect x="2" y="6.500" width="20" height="4.500" rx="1.200" fill="#ffd45a" stroke="#fff1b4" strokeWidth=".8" />
    <rect x="10.600" y="6.500" width="2.800" height="14.500" fill="#e0432e" />
    <path d="M12 6.500C10 2.500 6 3 6.500 5.500 7 7 10 6.500 12 6.500zM12 6.500C14 2.500 18 3 17.500 5.500 17 7 14 6.500 12 6.500z" fill="#ff5a3c" stroke="#ffd45a" strokeWidth=".8" />
  </svg>
)

const Coin = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
    <defs><radialGradient id="rscoin" cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff1a0" /><stop offset=".55" stopColor="#ffc22e" /><stop offset="1" stopColor="#d98200" /></radialGradient></defs>
    <circle cx="15" cy="15" r="13.500" fill="url(#rscoin)" stroke="#fff0b0" strokeWidth="1.200" />
    <circle cx="15" cy="15" r="10" fill="none" stroke="#c97a00" strokeOpacity=".7" strokeWidth="1" />
    <path d="M15 8.500l1.900 4.100 4.400.5-3.300 3 .9 4.400L15 18.200l-3.900 2.300.9-4.400-3.300-3 4.400-.5z" fill="#fff6c8" stroke="#d98200" strokeWidth=".7" strokeLinejoin="round" />
  </svg>
)

const Replay = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 12a8 8 0 1 1-2.500-5.800" /><path d="M20 3.500V8h-4.500" />
  </svg>
)

const Bars = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <rect x="3" y="12" width="4.600" height="9" rx="1" /><rect x="9.700" y="3" width="4.600" height="18" rx="1" /><rect x="16.400" y="8" width="4.600" height="13" rx="1" />
  </svg>
)

const Spark = ({ x, y, s = 1 }) => (
  <svg className="rs-spark" style={{ left: x, top: y }} width="22" height="22" viewBox="-11 -11 22 22" aria-hidden>
    <path transform={`scale(${s})`} d="M0-10C1-3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #bcd8ff)' }} />
  </svg>
)

export default function Result() {
  const { state } = useLocation()
  const { user, matches } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [waiting, setWaiting] = useState(false)
  const online = !!state?.match && state.match.room !== 'LOCAL' && state.match.room !== 'AI'

  // Online: nhận tín hiệu chơi lại từ server
  useEffect(() => {
    if (!online) return undefined
    const code = state.match.room
    const onStart = () => nav('/game/' + code, { replace: true })
    const onAsked = () => setToast('Đối thủ muốn chơi lại - bấm "Chơi lại" để đồng ý')
    const onLeft = () => { setWaiting(false); setToast('Đối thủ đã rời phòng') }
    socket.on('game:start', onStart); socket.on('rematch:asked', onAsked); socket.on('rematch:left', onLeft)
    return () => { socket.off('game:start', onStart); socket.off('rematch:asked', onAsked); socket.off('rematch:left', onLeft) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state?.match) return <Navigate to="/home" replace />
  if (!user) return null

  const { match } = state
  const r = THEME[match.result] ? match.result : 'draw'
  const t = THEME[r]
  const [coins, gems] = REWARD[r]
  const w = matches.filter((m) => m.result === 'win').length
  const d = matches.filter((m) => m.result === 'draw').length
  const l = matches.filter((m) => m.result === 'lose').length
  const meKind = r
  const oppKind = r === 'win' ? 'lose' : r === 'lose' ? 'win' : 'draw'
  const opp = match.opponent || { name: 'Đối thủ', level: 12 }

  const go = (path) => { if (online) socket.emit('room:leave'); nav(path) }
  const replay = async () => {
    if (!online) return nav('/game/' + match.room, { replace: true })
    if (waiting) return undefined
    const res = await call('rematch:request', {})
    if (!res.ok) return setToast(res.error || 'Không thể chơi lại')
    if (!res.started) { setWaiting(true); setToast('Đã gửi lời mời, đang chờ đối thủ...') }
    return undefined
  }

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage rs-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="rs-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="wr-s">
          {/* ===== tiêu đề ===== */}
          <div className={`rs-title ${r}`}>
            {t.crown && <span className="rs-title-crown"><BigCrown /></span>}
            <Banner result={r} />
            <p>{t.sub}</p>
            {r === 'win' && <><Spark x={-4} y={22} s={.9} /><Spark x={236} y={44} s={1.1} /></>}
          </div>

          {/* ===== khung lớn + hai người chơi ===== */}
          <div className="rs-main"><BigFrame w={676} h={246} /></div>

          <div className="rs-side me">
            <MeAvatar user={user} win={r === 'win'} />
            <div className="rs-name"><span>{user.name}</span><Crown w={17} h={13} /></div>
            <div className="rs-lv">Lv.{user.level}</div>
            <PlayerTag kind={meKind} />
          </div>

          <div className="rs-side opp">
            <div className="rs-av rs-av-opp">{photoOf(opp.avatar) ? <div className="rs-av-pic rs-av-pic-opp"><img src={photoOf(opp.avatar)} alt="" draggable={false} /></div> : opp.avatar ? <div className="rs-av-pic rs-av-pic-opp"><b className="emoji">{opp.avatar}</b></div> : <Silhouette />}<span className="rs-av-ring opp" /></div>
            <div className="rs-name"><span>{opp.name}</span></div>
            <div className="rs-lv">Lv.{opp.level}</div>
            <PlayerTag kind={oppKind} />
          </div>

          {/* ===== bàn cờ + VS ===== */}
          <div className="rs-board">
            <ResultBoard moves={match.moves} />
          </div>
          <div className="rs-vswrap"><Versus /></div>

          {/* ===== thống kê ===== */}
          <div className="rs-stats">
            <div><span>Thắng</span><b>{w}</b></div>
            <div><span>Hòa</span><b>{d}</b></div>
            <div><span>Thua</span><b>{l}</b></div>
          </div>

          {/* ===== phần thưởng ===== */}
          <div className="rs-reward">
            <div className="rs-reward-in">
              <span className="rs-rw gold"><Coin /><b>+{coins}</b></span>
              <span className="rs-rw cyan"><Gem /><b>+{gems}</b></span>
            </div>
          </div>
          <div className="rs-reward-tag"><Gift /><b>Phần thưởng</b></div>

          {/* ===== nút ===== */}
          <button type="button" className="rs-btn blue" style={{ left: 186, width: 172 }} onClick={() => go('/home')}>
            <Ico n="home" size={24} fill="#fff" sw={1.500} /><b>Về trang chủ</b>
          </button>
          <button type="button" className="rs-btn violet" style={{ left: 390, width: 178 }} onClick={replay}>
            <Replay /><b>{waiting ? 'Đang chờ...' : 'Chơi lại'}</b>
          </button>
          <button type="button" className="rs-btn indigo" style={{ left: 598, width: 174 }} onClick={() => go('/history')}>
            <Bars /><b>Xem lịch sử</b>
          </button>
        </div>

        {/* ===== logo + nút về nhà ===== */}
        <img className="rs-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
        <button type="button" className="hm-round rs-home" onClick={() => go('/home')} aria-label="Trang chủ">
          <Ico n="home" size={26} fill="#fff" sw={1.600} />
        </button>
      </div>
      {toast}
    </div>
  )
}
