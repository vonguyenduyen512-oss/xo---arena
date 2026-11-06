import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { call } from '../lib/socket.js'
import { useApp } from '../store.jsx'
import { Crown, HomeBackdrop, Ico, TopHud, useFit } from '../components/hud.jsx'
import '../components/home.css'
import '../components/create.css'

/* Màn hình 07 – Tạo phòng (stage cố định 1280x720, tự thu phóng theo cửa sổ) */

const genCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

const SIDE = [
  ['/lobby', 'home', 'Sảnh chờ', 'k-home'],
  ['/create-room', 'trophy', 'Tạo phòng', 'k-trophy'],
  ['/join-room', 'door', 'Tham gia phòng', 'k-join'],
  ['/leaderboard', 'podium', 'Bảng xếp hạng', 'k-rank'],
  ['/profile', 'user', 'Hồ sơ', 'k-user'],
  ['/settings', 'gear', 'Cài đặt', 'k-gear'],
]

const MODES = [
  { id: 'Caro 2 người', icon: 'x' },
  { id: 'Caro nhanh', icon: 'bolt' },
  { id: 'Caro giải đấu', icon: 'star' },
]

/* ---------- icon riêng của màn hình này ---------- */
const XMark = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <defs>
      <linearGradient id="crx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8f3ff" /><stop offset="1" stopColor="#3fa6ff" /></linearGradient>
    </defs>
    <g stroke="#eaffff" strokeWidth="1.4" fill="url(#crx)" strokeLinejoin="round">
      <rect x="16" y="3" width="8" height="34" rx="2.500" transform="rotate(45 20 20)" />
      <rect x="16" y="3" width="8" height="34" rx="2.500" transform="rotate(-45 20 20)" />
    </g>
  </svg>
)

const Spark = ({ size = 40, children }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>{children}</svg>
)

const ModeIcon = ({ kind }) => {
  if (kind === 'x') return <XMark size={42} />
  if (kind === 'bolt') {
    return (
      <Spark size={42}>
        <path d="M23 3L9 22h9l-3 15 16-21h-10z" fill="#aab6ff" stroke="#e4e8ff" strokeWidth="1.400" strokeLinejoin="round" />
        <path d="M31 5l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#e4e8ff" />
      </Spark>
    )
  }
  return (
    <Spark size={42}>
      <path d="M20 4l4.800 10 10.700 1.300-8 7.400 2.100 10.600L20 28l-9.600 5.300 2.100-10.600-8-7.400L15.200 14z" fill="#aab6ff" stroke="#e4e8ff" strokeWidth="1.400" strokeLinejoin="round" />
      <path d="M33 4l.8 2.200 2.200.8-2.200.8L33 10l-.8-2.200L30 7l2.200-.8z" fill="#e4e8ff" />
    </Spark>
  )
}

const SwordsFill = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="-30 -30 60 60" aria-hidden>
    <defs>
      <linearGradient id="crsw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9fbff" /><stop offset="1" stopColor="#4cb4ff" /></linearGradient>
    </defs>
    <g fill="url(#crsw)" stroke="#f4fdff" strokeWidth="2" strokeLinejoin="round">
      {[40, -40].map((r) => (
        <path key={r} transform={`rotate(${r})`} d="M0-30L4.500-24V4H12v5H3v11h-6V9h-9V4h7.500V-24z" />
      ))}
    </g>
  </svg>
)

const PeopleFill = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 26 24" fill="currentColor" aria-hidden>
    <circle cx="9.500" cy="7" r="4.500" /><path d="M1 22c0-5 3.800-8 8.500-8s8.500 3 8.500 8z" />
    <circle cx="19.500" cy="9" r="3.200" /><path d="M18.500 14.500c4 .2 7 2.300 7 7.500h-5c0-3-.8-5.500-2-7.500z" />
  </svg>
)

const LockFill = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M7.500 10.500V7a4.500 4.500 0 0 1 9 0v3.500" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" />
    <rect x="4" y="10" width="16" height="12" rx="3" fill="currentColor" />
    <circle cx="12" cy="15.400" r="1.900" fill="#1a2480" /><rect x="11.100" y="16" width="1.800" height="3.600" rx=".9" fill="#1a2480" />
  </svg>
)

const Heart = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
    <path d="M12 21s-8-5.300-8-11.300A4.700 4.700 0 0 1 12 6.800a4.700 4.700 0 0 1 8 3.900C20 15.700 12 21 12 21z" />
  </svg>
)

const Wifi = () => (
  <svg width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="#2eea7a" strokeWidth="2.800" strokeLinecap="round" aria-hidden>
    <path d="M2 8a16 16 0 0 1 22 0" /><path d="M6 12.500a10 10 0 0 1 14 0" /><path d="M10 17a4.500 4.500 0 0 1 6 0" />
    <circle cx="13" cy="20" r="1.300" fill="#2eea7a" stroke="none" />
  </svg>
)
const Bars = () => (
  <svg width="22" height="18" viewBox="0 0 22 18" fill="#2eea7a" aria-hidden>
    <rect x="0" y="9" width="4" height="9" rx="1" /><rect x="6" y="5" width="4" height="13" rx="1" /><rect x="12" y="0" width="4" height="18" rx="1" />
    <path d="M18 6l4 3-4 3z" opacity=".8" />
  </svg>
)

/* Khung bo góc vát vẽ bằng SVG để viền phát sáng đúng như ảnh mẫu */
function Frame({ w, h, pts, id, c1, c2, fill, lines = [] }) {
  const [f1, f2] = fill
  const d = pts.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg className="cr-frame" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={f1} /><stop offset="1" stopColor={f2} /></linearGradient>
      </defs>
      <polygon points={d} fill={`url(#${id}f)`} stroke={`url(#${id})`} strokeWidth="2.500" strokeLinejoin="round" />
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id})`} strokeWidth="1.800" strokeOpacity=".9" />
      ))}
    </svg>
  )
}

const MAIN_PTS = [[0, 57], [16, 0], [418, 0], [440, 57], [462, 57], [489, 84], [489, 470], [466, 497], [24, 497], [0, 473]]
const PREV_PTS = [[16, 0], [311, 0], [327, 16], [327, 408], [311, 424], [16, 424], [0, 408], [0, 16]]

export default function CreateRoom() {
  const nav = useNavigate()
  const { user, logout } = useApp()
  const [toast, setToast] = useToast()
  const scale = useFit(1280, 720)

  const [name, setName] = useState('Phòng đấu vui vẻ ♡')
  const [mode, setMode] = useState('Caro 2 người')
  const [players, setPlayers] = useState(2)
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pub, setPub] = useState(true)

  if (!user) return null
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }

  const create = async () => {
    if (!name.trim()) return setToast('Vui lòng nhập tên phòng')
    if (pw && pw.length < 4) return setToast('Mật khẩu phòng tối thiểu 4 ký tự')
    const res = await call('room:create', { code: '1906', user: { name: user.name, level: user.level, avatar: user.avatar } })
    if (!res.ok) return setToast(res.error)
    nav(`/waiting/${res.code}`, { state: { name: name.trim(), mode, players, pub, hasPw: !!pw } })
  }

  return (
    <div className="hm-root">
      <div className="hm-stage cr-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* ===== nền + nhân vật ===== */}
        <HomeBackdrop />
        <div className="cr-glow" />
        <div className="cr-floor" />
        <img className="cr-girl" src="/img/create-girl.png" alt="" />

        <svg className="cr-swirl" viewBox="0 0 420 200" aria-hidden>
          <defs>
            <linearGradient id="sw1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff7ae8" stopOpacity="0" /><stop offset=".4" stopColor="#ffd0f6" /><stop offset="1" stopColor="#ff5fd0" stopOpacity="0" /></linearGradient>
            <linearGradient id="sw2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6bff" stopOpacity="0" /><stop offset=".5" stopColor="#d6b8ff" /><stop offset="1" stopColor="#ff8ae6" stopOpacity="0" /></linearGradient>
          </defs>
          <path d="M6 112C70 40 270 28 410 78" fill="none" stroke="url(#sw1)" strokeWidth="8" strokeLinecap="round" />
          <path d="M30 150C130 196 320 176 414 96" fill="none" stroke="url(#sw2)" strokeWidth="6" strokeLinecap="round" />
          <path d="M60 80C120 40 230 36 330 60" fill="none" stroke="url(#sw2)" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </svg>

        <svg className="cr-xblock" viewBox="0 0 100 90" aria-hidden>
          <defs>
            <linearGradient id="xt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c6f1ff" /><stop offset="1" stopColor="#5db8ff" /></linearGradient>
            <linearGradient id="xs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f86ff" /><stop offset="1" stopColor="#1740c8" /></linearGradient>
          </defs>
          <g strokeLinejoin="round" strokeWidth="1.600">
            <g transform="translate(0 12)" fill="url(#xs)" stroke="#a8dcff">
              <rect x="40" y="2" width="20" height="70" rx="3" transform="rotate(45 50 37)" />
              <rect x="40" y="2" width="20" height="70" rx="3" transform="rotate(-45 50 37)" />
            </g>
            <g fill="url(#xt)" stroke="#f2fcff">
              <rect x="40" y="2" width="20" height="70" rx="3" transform="rotate(45 50 37)" />
              <rect x="40" y="2" width="20" height="70" rx="3" transform="rotate(-45 50 37)" />
            </g>
          </g>
        </svg>

        <div className="cr-banner">
          <span className="cr-banner-crown"><Crown w={36} h={28} /></span>
          <div><b>Tạo phòng ngay</b><i>Cùng bạn bè chiến đấu!</i></div>
        </div>

        {/* ===== menu trái ===== */}
        <nav className="cr-side">
          {SIDE.map(([to, ic, label, k]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `hm-nav ${k} ${isActive ? 'on' : ''}`}>
              <Ico n={ic} size={22} fill={ic === 'home' ? 'currentColor' : 'none'} /><span>{label}</span>
            </NavLink>
          ))}
          <a href="/login" className="hm-nav k-exit" onClick={(e) => { e.preventDefault(); doLogout() }}>
            <Ico n="exit" size={22} /><span>Thoát</span>
          </a>
        </nav>

        {/* ===== thanh trên ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="cr-logo" src="/img/logo.png" alt="X-O Arena" />

        {/* ===== bảng thiết lập ===== */}
        <section className="cr-panel">
          <Frame w={489} h={497} pts={MAIN_PTS} id="frm1" c1="#5fb4ff" c2="#3a5cff" fill={["rgba(26,44,176,.86)", "rgba(16,26,128,.92)"]} lines={[[0, 57, 462, 57]]} />

          <div className="cr-head">
            <SwordsFill size={56} />
            <h1>Tạo phòng</h1>
            <p>Thiết lập thông tin phòng của bạn</p>
          </div>

          <div className="cr-lb" style={{ top: 80 }}><SwordsFill size={19} /><span>Tên phòng</span></div>
          <div className="cr-field" style={{ top: 109 }}>
            <span className="cr-fl"><Crown w={26} h={20} /></span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} spellCheck={false} />
            <span className="cr-sep" />
            <span className="cr-fr"><Ico n="pencil" size={18} sw={2.200} /></span>
          </div>

          <div className="cr-lb" style={{ top: 161 }}><SwordsFill size={19} /><span>Chế độ chơi</span></div>
          <div className="cr-modes">
            {MODES.map((m) => (
              <button key={m.id} type="button" className={`cr-mode ${mode === m.id ? 'on' : ''}`} onClick={() => setMode(m.id)}>
                {mode === m.id && <span className="cr-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></span>}
                <ModeIcon kind={m.icon} />
                <span>{m.id}</span>
              </button>
            ))}
          </div>

          <div className="cr-lb gold" style={{ top: 281 }}><PeopleFill size={19} /><span>Số người</span></div>
          <div className="cr-ppl">
            <label className={`one ${players === 2 ? 'on' : ''}`} style={{ left: 19 }}>
              <input type="radio" name="ppl" checked={players === 2} onChange={() => setPlayers(2)} />
              <PeopleFill size={29} /><span>2 người</span>
            </label>
            {[[4, 142], [6, 286]].map(([n, x]) => (
              <label key={n} className={`rd ${players === n ? 'on' : ''}`} style={{ left: x }}>
                <input type="radio" name="ppl" checked={players === n} onChange={() => setPlayers(n)} />
                <i /><span>{n} người</span>
              </label>
            ))}
          </div>

          <div className="cr-lb gold" style={{ top: 353 }}><LockFill size={19} /><span>Mật khẩu phòng <em>(Tùy chọn)</em></span></div>
          <div className="cr-field" style={{ top: 380 }}>
            <span className="cr-fl"><LockFill size={26} /></span>
            <input type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nhập mật khẩu..." maxLength={20} autoComplete="new-password" />
            <span className="cr-sep" />
            <button type="button" className="cr-fr" onClick={() => setShowPw((v) => !v)} aria-label="Hiện/ẩn mật khẩu"><Ico n={showPw ? 'eye' : 'eyeOff'} size={22} sw={2} /></button>
          </div>

          <div className="cr-lb gold" style={{ top: 431 }}><Ico n="shield" size={18} fill="currentColor" sw={1.500} /><span>Chế độ phòng</span></div>
          <div className="cr-vis">
            <label className={`rd ${pub ? 'on' : ''}`} style={{ left: 46 }}>
              <input type="radio" name="vis" checked={pub} onChange={() => setPub(true)} />
              <i /><Ico n="globe" size={17} sw={1.800} /><span>Công khai</span>
            </label>
            <label className={`rd ${!pub ? 'on' : ''}`} style={{ left: 211 }}>
              <input type="radio" name="vis" checked={!pub} onChange={() => setPub(false)} />
              <i /><LockFill size={16} /><span>Riêng tư</span>
            </label>
          </div>
        </section>

        {/* ===== xem trước phòng ===== */}
        <aside className="cr-preview">
          <Frame w={327} h={424} pts={PREV_PTS} id="frm2" c1="#c9d4ff" c2="#ff5fd0" fill={["rgba(30,40,170,.84)", "rgba(18,22,120,.9)"]} />
          <div className="cr-ph"><Crown w={28} h={22} /><b>Xem trước phòng</b></div>
          <div className="cr-ph-line" />
          <div className="cr-thumb" style={{ backgroundImage: 'url(/img/create-preview.jpg)' }} />
          <div className="cr-info">
            <div className="r0"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" aria-hidden><path d="M4 5h16M12 5v15M8 20h8" /></svg><span>Tên phòng:</span></div>
            <div className="rv"><b>{name.trim() || '—'}</b></div>
            <div className="row r1"><span className="ic"><SwordsFill size={22} /></span><span className="lb">Chế độ:</span><span className="val"><span className="x"><XMark size={22} /></span>{mode}</span></div>
            <div className="row r2"><span className="ic"><PeopleFill size={24} /></span><span className="lb">Số người:</span><span className="val"><span className="x"><PeopleFill size={24} /></span>{players} người</span></div>
            <div className="row r3"><span className="ic"><LockFill size={22} /></span><span className="lb">Mật khẩu:</span><span className="val"><span className="x"><LockFill size={22} /></span>{pw ? 'Có' : 'Không có'}</span></div>
          </div>
        </aside>

        {/* ===== nút dưới ===== */}
        <button type="button" className="cr-back" onClick={() => nav('/home')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
          <b>Quay lại</b>
        </button>
        <div className="cr-create-wrap">
          <button type="button" className="cr-create" onClick={create}>
            <Ico n="rocket" size={30} fill="currentColor" sw={1.200} />
            <b>Tạo phòng</b>
            <svg width="30" height="26" viewBox="0 0 30 26" fill="none" stroke="currentColor" strokeWidth="4.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 3l10 10L4 23M16 3l10 10-10 10" /></svg>
          </button>
        </div>

        <button type="button" className="cr-notice" onClick={soon('Thông báo')}>
          <Ico n="megaphone" size={24} fill="#ffc83a" sw={1.600} />
          <span><b>Thông báo:</b> Chào mừng đến với X-O Arena!</span>
          <Ico n="chev" size={16} sw={3.500} />
        </button>
        <div className="cr-net"><Wifi /><span>Trạng thái mạng:</span><Bars /><span>Ping: 23ms</span></div>
      </div>
      {toast}
    </div>
  )
}
