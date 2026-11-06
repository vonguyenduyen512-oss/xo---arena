import { photoOf } from '../lib/avatar.js'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { LEADERBOARD } from '../mock.js'
import '../components/home.css'

/* ---------- icon set (SVG, nét đơn giản) ---------- */
const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
  doc: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8',
  podium: 'M3 21h18M4 21v-7h5v7M9.5 21V6h5v15M15 21v-10h5v10',
  gear: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  book: 'M4 4h7a2 2 0 0 1 1 .3A2 2 0 0 1 13 4h7v15h-7a2 2 0 0 0-1 .3 2 2 0 0 0-1-.3H4zM12 4.3V19.5',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z',
  power: 'M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  swords: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2',
  door: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  flame: 'M12 2s6 4.5 6 10a6 6 0 0 1-12 0c0-2.2 1-3.7 2.4-5 .2 2 1.2 3 2.6 3.4C10.6 7.6 10.4 4.6 12 2z',
  star: 'M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z',
  cart: 'M2 3h3l2.7 12.5h10.6L21 7H6M9.5 20.5h.01M17 20.5h.01',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  chat: 'M4 4h16v12H9l-5 4z',
  chev: 'M9 5l7 7-7 7',
}
const Ico = ({ n, size = 22, fill = 'none', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={P[n]} />
  </svg>
)

const Gem = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
    <defs>
      <linearGradient id="gemg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9ff3ff" /><stop offset="1" stopColor="#2a8bff" />
      </linearGradient>
    </defs>
    <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#gemg)" stroke="#d8fbff" strokeWidth="1" strokeLinejoin="round" />
    <path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6" fill="none" stroke="#e9fdff" strokeOpacity=".7" strokeWidth=".8" />
  </svg>
)

const Crown = () => (
  <svg width="18" height="14" viewBox="0 0 24 18" aria-hidden>
    <path d="M2 16L1 4l6 5 5-8 5 8 6-5-1 12z" fill="#ffc83a" stroke="#fff2b8" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

/* ---------- data ---------- */
const NAV = [
  ['/home', 'home', 'Trang chủ'],
  ['/profile', 'trophy', 'Hồ sơ'],
  ['/history', 'doc', 'Lịch sử đấu'],
  ['/leaderboard', 'podium', 'Bảng xếp hạng'],
  ['/settings', 'gear', 'Cài đặt'],
  ['/how-to-play', 'book', 'Hướng dẫn'],
]

const SLIDES = [
  { title: 'X-O ARENA', text: <>Cùng nhau tạo nên<br />những trận đấu đỉnh cao!</>, to: '/mode' },
  { title: 'KẾT BẠN BÈ', text: <>Tạo phòng riêng, mời bạn bè<br />cùng so tài Caro!</>, to: '/create-room' },
  { title: 'LEO HẠNG', text: <>Thắng nhiều trận, nhận<br />thưởng và lên đỉnh bảng xếp hạng!</>, to: '/leaderboard' },
]

const EVENT_END = new Date('2026-11-09T20:00:00+07:00').getTime()
const countdown = () => {
  const ms = EVENT_END - Date.now()
  if (ms <= 0) return 'Đã kết thúc'
  const d = Math.floor(ms / 864e5)
  const h = Math.floor((ms % 864e5) / 36e5)
  return `${d} ngày ${h} giờ`
}

const fmt = (n) => Number(n).toLocaleString('en-US')
const PETALS = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 61 + 13) % 100, d: 9 + (i * 7) % 9, delay: -((i * 5) % 14), s: 0.7 + ((i * 3) % 6) / 8,
}))

/* thu phóng stage 1280x720 theo cửa sổ */
function useFit(w, h) {
  const calc = () => Math.min(window.innerWidth / w, window.innerHeight / h)
  const [s, setS] = useState(calc)
  useEffect(() => {
    const f = () => setS(calc())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

function Avatar({ avatar }) {
  const src = photoOf(avatar)
  return src
    ? <img className="hm-av-img" src={src} alt="" />
    : <span className="hm-av-emoji">{avatar}</span>
}

export default function Home() {
  const nav = useNavigate()
  const { user, logout } = useApp()
  const [toast, setToast] = useToast()
  const scale = useFit(1280, 720)
  const [slide, setSlide] = useState(0)
  const [left, setLeft] = useState(countdown)

  useEffect(() => {
    const a = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500)
    const b = setInterval(() => setLeft(countdown()), 60000)
    return () => { clearInterval(a); clearInterval(b) }
  }, [])

  if (!user) return null
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const pct = Math.min(100, Math.round((user.exp / user.expMax) * 100))
  const sl = SLIDES[slide]

  return (
    <div className="hm-root">
      <div className="hm-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* ===== nền ===== */}
        <div className="hm-bg" />
        <div className="hm-city" />
        <div className="hm-bokeh" />
        {PETALS.map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        {/* ===== nhân vật ===== */}
        <img className="hm-char boy" src="/img/boy.png" alt="" />
        <img className="hm-char girl" src="/img/girl.png" alt="" />

        {/* ===== thanh trên ===== */}
        <div className="hm-me" onClick={() => nav('/profile')}>
          <div className="hm-avatar"><Avatar avatar={user.avatar} /></div>
          <div className="hm-me-info">
            <div className="hm-name">{user.name} <Crown /></div>
            <div className="hm-lv">
              <b>Lv.{user.level}</b>
              <div className="hm-xp"><i style={{ width: pct + '%' }} /><span>{fmt(user.exp)} / {fmt(user.expMax)}</span></div>
            </div>
          </div>
        </div>

        <div className="hm-currency">
          <div className="hm-chip">
            <span className="hm-coin">$</span>
            <b>{fmt(user.coins)}</b>
            <button className="hm-plus" onClick={soon('Nạp xu')} aria-label="Nạp xu"><Ico n="plus" size={16} sw={3} /></button>
          </div>
          <div className="hm-chip">
            <Gem />
            <b>{fmt(user.gems)}</b>
            <button className="hm-plus" onClick={soon('Nạp kim cương')} aria-label="Nạp kim cương"><Ico n="plus" size={16} sw={3} /></button>
          </div>
        </div>

        <div className="hm-icons">
          <button className="hm-round" onClick={soon('Quà tặng')} aria-label="Quà tặng"><Ico n="gift" size={24} /><em>!</em></button>
          <button className="hm-round" onClick={soon('Thông báo')} aria-label="Thông báo"><Ico n="bell" size={24} /><em>!</em></button>
          <button className="hm-round" onClick={() => nav('/settings')} aria-label="Cài đặt"><Ico n="gear" size={24} /></button>
          <button className="hm-round" onClick={() => { logout(); nav('/login') }} aria-label="Đăng xuất"><Ico n="power" size={24} /></button>
        </div>

        <button className="hm-event" onClick={soon('Sự kiện đặc biệt')}>
          <span className="hm-event-ico"><Ico n="gift" size={40} sw={1.6} /></span>
          <span className="hm-event-txt">
            <b>Sự kiện đặc biệt</b>
            <i>Tham gia ngay!</i>
            <small><Ico n="clock" size={14} sw={2.4} /> {left}</small>
          </span>
          <Ico n="chev" size={20} sw={3} />
        </button>

        {/* ===== menu trái ===== */}
        <nav className="hm-side">
          {NAV.map(([to, ic, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `hm-nav ${isActive ? 'on' : ''} c-${ic}`}>
              <Ico n={ic} size={24} fill={ic === 'home' ? 'currentColor' : 'none'} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ===== trung tâm ===== */}
        <img className="hm-logo" src="/img/logo.png" alt="X-O Arena – Caro Trực Tuyến" />
        <div className="hm-slogan"><span>Kết nối bạn bè<br />Thách thức đỉnh cao!</span></div>

        <div className="hm-ctas">
          <div className="hm-cta-wrap q">
<button className="hm-cta q" onClick={() => nav('/mode')}>
              <Ico n="users" size={34} /><b>Chơi Nhanh</b><small>Tìm trận ngay</small>
            </button>
          </div>
          <div className="hm-cta-wrap c">
            <button className="hm-cta c" onClick={() => nav('/create-room')}>
              <Ico n="swords" size={42} sw={2.2} /><b>Tạo Phòng</b><small>Tự do thiết lập</small>
            </button>
          </div>
          <div className="hm-cta-wrap j">
            <button className="hm-cta j" onClick={() => nav('/join-room')}>
              <Ico n="door" size={34} /><b>Tham Gia</b><small>Nhập mã phòng</small>
            </button>
          </div>
        </div>

        <div className="hm-tiles">
          <button className="hm-tile t1" onClick={soon('Sự kiện Hot')}><Ico n="flame" size={34} fill="currentColor" sw={1} /><span>Sự kiện<br />Hot</span><em>!</em></button>
          <button className="hm-tile t2" onClick={soon('Nhiệm vụ')}><Ico n="gift" size={34} /><span>Nhiệm vụ<br />Hằng ngày</span></button>
          <button className="hm-tile t3" onClick={soon('Phần thưởng')}><Ico n="star" size={34} fill="currentColor" sw={1} /><span>Phần thưởng</span></button>
          <button className="hm-tile t4" onClick={soon('Cửa hàng')}><Ico n="cart" size={34} /><span>Cửa hàng</span></button>
        </div>

        {/* ===== banner + chat ===== */}
        <div className="hm-banner" onClick={() => nav(sl.to)} key={slide}>
          <div className="hm-banner-txt">
            <h3>{sl.title}</h3>
            <p>{sl.text}</p>
          </div>
          <img className="b1" src="/img/boy.png" alt="" />
          <img className="b2" src="/img/girl.png" alt="" />
          <div className="hm-dots">
            {SLIDES.map((_, i) => (
              <i key={i} className={i === slide ? 'on' : ''} onClick={(e) => { e.stopPropagation(); setSlide(i) }} />
            ))}
          </div>
        </div>
        <button className="hm-chat" onClick={soon('Chat chung')}>
          <Ico n="chat" size={22} fill="currentColor" sw={1.5} />
          <span>Chào mừng bạn đến với X-O Arena!</span>
          <Ico n="chev" size={18} sw={3} />
        </button>

        {/* ===== BXH ===== */}
        <div className="hm-lb">
          <div className="hm-lb-head">
            <span><Ico n="trophy" size={22} /> Bảng Xếp Hạng</span>
            <button onClick={() => nav('/leaderboard')}>Xem thêm <Ico n="chev" size={11} sw={3.5} /></button>
          </div>
          {LEADERBOARD.slice(0, 3).map((p) => (
            <div className={`hm-lb-row r${p.rank}`} key={p.rank}>
              <span className="medal">{p.rank}</span>
              <span className="pav">{p.avatar}</span>
              <span className="nm">{p.name}</span>
              <b>{fmt(p.score)}</b>
            </div>
          ))}
        </div>

        <div className="hm-tagline">Carô – Kết nối đam mê!</div>
      </div>
      {toast}
    </div>
  )
}