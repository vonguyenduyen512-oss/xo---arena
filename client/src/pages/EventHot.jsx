import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { PETALS, TopHud, useFit } from '../components/hud.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/events.css'

/* Màn hình – Sự kiện Hot
   Dựng hoàn toàn bằng code (SVG + CSS). Toạ độ trong .ev-s là toạ độ ảnh mẫu 939x528
   (stage 1280x720 tự thu phóng như Home). Thanh trên (avatar, level, xu, kim cương) dùng chung với Home. */

/* ---------- icon nét đơn giản (giống bộ icon của Home) ---------- */
const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
  doc: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8',
  podium: 'M3 21h18M4 21v-7h5v7M9.5 21V6h5v15M15 21v-10h5v10',
  gear: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  book: 'M4 4h16v16H4zM12 4v16M8 9h.01',
  calendar: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4M9 15h.01M12 15h.01M15 15h.01',
  star: 'M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z',
  mega: 'M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
}
const Ico = ({ n, size = 22, fill = 'none', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={P[n]} />
  </svg>
)

/* ---------- đồ hoạ ---------- */
const Defs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <linearGradient id="evGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3a6" /><stop offset=".5" stopColor="#ffc531" /><stop offset="1" stopColor="#e88a0a" /></linearGradient>
      <linearGradient id="evGoldD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f29a12" /><stop offset=".5" stopColor="#ffd45a" /><stop offset="1" stopColor="#f29a12" /></linearGradient>
      <linearGradient id="evCyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9faff" /><stop offset=".55" stopColor="#4cc7ff" /><stop offset="1" stopColor="#2a74ff" /></linearGradient>
      <linearGradient id="evViolet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9d9ff" /><stop offset=".55" stopColor="#a56bff" /><stop offset="1" stopColor="#6a35e8" /></linearGradient>
      <linearGradient id="evPale" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9b8ff" /></linearGradient>
      <radialGradient id="evCoin" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff4a8" /><stop offset=".6" stopColor="#ffbd1f" /><stop offset="1" stopColor="#d98400" /></radialGradient>
    </defs>
  </svg>
)

const Coin = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="12.500" fill="url(#evCoin)" stroke="#ffe38a" strokeWidth="1.500" />
    <circle cx="14" cy="14" r="9" fill="none" stroke="#e59a0a" strokeWidth="1" opacity=".7" />
    <text x="14" y="19.500" textAnchor="middle" fontSize="15" fontWeight="900" fill="#a96100" fontFamily="Arial, sans-serif">$</text>
  </svg>
)

const Diamond = ({ size = 28, grad = 'evCyan' }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <path d="M8 3h12l6 7-12 15L2 10z" fill={`url(#${grad})`} stroke="#e4fbff" strokeWidth="1" strokeLinejoin="round" />
    <path d="M2 10h24M8 3l-2 7 8 15 8-15-2-7M11 10l3-7 3 7" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth=".8" strokeLinejoin="round" />
  </svg>
)

const Gift = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <rect x="3" y="12" width="22" height="14" rx="2" fill="#ff9a1f" stroke="#ffd27a" strokeWidth="1" />
    <rect x="2" y="8.500" width="24" height="6" rx="2" fill="#ffb53d" stroke="#ffe0a0" strokeWidth="1" />
    <rect x="12" y="8.500" width="4" height="17.500" fill="#ff4f5e" />
    <path d="M14 8.500C10 8.500 7 6 8.500 4S13 4.500 14 8.500zM14 8.500c4 0 7-2.500 5.500-4.500S15 4.500 14 8.500z" fill="#ff4f5e" stroke="#ffb0b8" strokeWidth=".8" strokeLinejoin="round" />
  </svg>
)

const Crown = ({ w = 22, h = 17 }) => (
  <svg width={w} height={h} viewBox="0 0 24 18" aria-hidden>
    <path d="M2 16L1 4l6 5 5-8 5 8 6-5-1 12z" fill="url(#evGold)" stroke="#fff2b8" strokeWidth="1" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1.500" fill="#d8349c" />
  </svg>
)

const Star = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l3 6.900 7.500.7-5.700 5 1.700 7.400L12 18l-6.500 4 1.700-7.400-5.700-5 7.500-.7z" fill="url(#evGold)" stroke="#fff1a6" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

const Swords = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="#d6e4ff" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 4l12 12M23 4L11 16" />
    <path d="M4 3l3 .5M24 3l-3 .5" />
    <path d="M13 17l-3 3M15 17l3 3M8 22l-3 3M20 22l3 3" stroke="#aebfff" />
    <path d="M9 18l-3 3M19 18l3 3" stroke="#fff" />
  </svg>
)

const MiniTrophy = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <path d="M8 4h12v7a6 6 0 0 1-12 0z" fill="url(#evGold)" stroke="#fff1a6" strokeWidth="1" strokeLinejoin="round" />
    <path d="M8 6H4v1.500A4 4 0 0 0 8 11.500M20 6h4v1.500a4 4 0 0 1-4 4" fill="none" stroke="#ffc531" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 17v4M9 25h10M11 21h6l1 4H10z" fill="#ffc531" stroke="#ffe08a" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

const CalCheck = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="#d6e4ff" strokeWidth="2.100" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3.500" y="6" width="21" height="18" rx="3" />
    <path d="M3.500 11.500h21M9 3.500v5M19 3.500v5" />
    <path d="M10 18l3 3 5.500-6" stroke="#fff" />
  </svg>
)

const Laurel = ({ flip, pale }) => {
  // thân cong từ dưới lên, lá xoè hai bên
  const pt = (t) => {
    const x = (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * 2 + t * t * 20
    const y = (1 - t) * (1 - t) * 66 + 2 * (1 - t) * t * 34 + t * t * 6
    return [x, y]
  }
  const leaves = []
  for (let i = 0; i < 7; i++) {
    const t = 0.12 + i * 0.125
    const [x, y] = pt(t)
    const s = 1 - t * 0.28
    leaves.push({ x: x - 2, y, r: -128 + i * 6, s, side: 'o' })
    if (i < 6) leaves.push({ x: x + 2, y: y - 3, r: -52 + i * 4, s: s * 0.82, side: 'i' })
  }
  const g = pale ? 'evPale' : 'evGoldD'
  return (
    <svg className={`ev-laurel ${flip ? 'r' : 'l'}`} width="38" height="68" viewBox="0 0 38 68" aria-hidden>
      <path d={`M24 66Q2 34 20 6`} fill="none" stroke={pale ? '#e6dcff' : '#e5a825'} strokeWidth="1.600" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={7.500 * l.s} ry={3 * l.s} fill={`url(#${g})`} stroke={pale ? '#ffffff' : '#fff1a8'} strokeWidth=".4" transform={`rotate(${l.r} ${l.x} ${l.y})`} />
      ))}
      <ellipse cx="20" cy="5" rx="3.600" ry="1.800" fill={`url(#${g})`} transform="rotate(-80 20 5)" />
    </svg>
  )
}

const BigTrophy = () => (
  <svg width="144" height="124" viewBox="0 0 160 138" aria-hidden>
    <path d="M40 24C6 20 4 62 42 80M120 24c34-4 36 38-2 56" fill="none" stroke="url(#evGold)" strokeWidth="9" strokeLinecap="round" />
    <path d="M40 24C14 22 12 56 42 74M120 24c26-2 28 32-2 50" fill="none" stroke="#fff2a0" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
    <path d="M34 18h92c0 52-14 80-46 84C48 98 34 70 34 18z" fill="url(#evGold)" stroke="#fff0a0" strokeWidth="1.500" />
    <path d="M44 24c2 38 12 58 36 66-14-12-22-34-22-66z" fill="#fff8c8" opacity=".35" />
    <rect x="30" y="10" width="100" height="14" rx="7" fill="url(#evGoldD)" stroke="#fff0a0" strokeWidth="1.500" />
    <path d="M80 36l6.500 13.500 14.500 1.800-10.800 10 2.900 14.400L80 68.500 66.900 75.700l2.900-14.400-10.800-10 14.500-1.800z" fill="#ffe27a" stroke="#d98a0a" strokeWidth="2" strokeLinejoin="round" />
    <path d="M70 100h20l3 14H67z" fill="url(#evGold)" stroke="#fff0a0" strokeWidth="1" />
    <ellipse cx="80" cy="108" rx="14" ry="5" fill="url(#evGoldD)" stroke="#fff0a0" strokeWidth="1" />
    <path d="M50 118h60l8 14H42z" fill="url(#evGold)" stroke="#fff0a0" strokeWidth="1.500" strokeLinejoin="round" />
    <rect x="42" y="128" width="76" height="8" rx="3" fill="#e9920c" />
  </svg>
)

const Podium = () => (
  <svg width="128" height="40" viewBox="0 0 112 34" aria-hidden>
    <defs>
      <linearGradient id="evPod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a56bff" /><stop offset="1" stopColor="#5a24c4" /></linearGradient>
    </defs>
    <path d="M2 12v10c0 6 24 11 54 11s54-5 54-11V12z" fill="url(#evPod)" />
    <ellipse cx="56" cy="12" rx="54" ry="11" fill="#b58aff" stroke="#e4d2ff" strokeWidth="1" />
    <ellipse cx="56" cy="12" rx="44" ry="7.500" fill="#7a44e8" opacity=".75" />
  </svg>
)

const GiftBox = ({ side }) => {
  const o = side === 'l'
  const top = o ? '#ff9a6a' : '#3f9bff'
  const topD = o ? '#ff7a56' : '#2a78f0'
  const front = o ? '#a56bff' : '#8a4bff'
  const frontD = o ? '#7a3fe0' : '#5f2ed0'
  const rib = o ? '#ffb14a' : '#c9b2ff'
  const ribD = o ? '#ff8a1f' : '#9c7bff'
  return (
    <svg width="74" height="62" viewBox="0 0 74 62" aria-hidden>
      <path d="M8 24h58v30c0 3-3 5-6 5H14c-3 0-6-2-6-5z" fill={front} />
      <path d="M8 24h24v35H14c-3 0-6-2-6-5z" fill={frontD} opacity=".55" />
      <path d="M4 16h66l-2 11H6z" fill={top} stroke="#ffffff" strokeOpacity=".35" strokeWidth="1" />
      <path d="M4 16h66l-.8 4H4.800z" fill={topD} opacity=".6" />
      <rect x="31" y="16" width="12" height="43" fill={rib} />
      <rect x="31" y="16" width="5" height="43" fill={ribD} opacity=".5" />
      <path d="M37 14C26 14 18 8 22 3s12 0 15 11zM37 14c11 0 19-6 15-11s-12 0-15 11z" fill={rib} stroke={ribD} strokeWidth="1.500" strokeLinejoin="round" />
      <ellipse cx="37" cy="14" rx="5" ry="4" fill={ribD} />
    </svg>
  )
}

const CrownBig = () => (
  <svg width="44" height="36" viewBox="0 0 44 36" aria-hidden>
    <path d="M4 30L2 10l11 9L22 3l9 16 11-9-2 20z" fill="url(#evGold)" stroke="#fff2b8" strokeWidth="1.500" strokeLinejoin="round" />
    <rect x="4" y="29" width="36" height="6" rx="2" fill="url(#evGoldD)" stroke="#fff2b8" strokeWidth="1" />
    <circle cx="22" cy="23" r="2.600" fill="#c8266a" /><circle cx="2" cy="9" r="2.200" fill="#fff6c4" /><circle cx="22" cy="2.500" r="2.200" fill="#fff6c4" /><circle cx="42" cy="9" r="2.200" fill="#fff6c4" />
  </svg>
)

const BigGift = () => (
  <svg width="58" height="56" viewBox="0 0 58 56" aria-hidden>
    <defs>
      <linearGradient id="evBg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd45a" /><stop offset="1" stopColor="#ff9a1f" /></linearGradient>
      <linearGradient id="evBg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7aa8" /><stop offset="1" stopColor="#ff4f78" /></linearGradient>
    </defs>
    <rect x="7" y="26" width="44" height="28" rx="3" fill="url(#evBg1)" stroke="#fff0b0" strokeWidth="1.500" />
    <rect x="3" y="18" width="52" height="12" rx="3" fill="url(#evBg1)" stroke="#fff0b0" strokeWidth="1.500" />
    <rect x="25" y="18" width="8" height="36" fill="url(#evBg2)" />
    <path d="M29 18C18 18 10 11 14 6s11 0 15 12zM29 18c11 0 19-7 15-12s-11 0-15 12z" fill="url(#evBg2)" stroke="#ffc0cf" strokeWidth="1.200" strokeLinejoin="round" />
    <ellipse cx="29" cy="18" rx="4.500" ry="3.500" fill="#e63a68" />
    <path d="M49 6l1.500 3.500L54 11l-3.500 1.500L49 16l-1.500-3.500L44 11l3.500-1.500z" fill="#ffe27a" />
  </svg>
)

const Ring = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
    <defs><linearGradient id="evRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd0a0" /><stop offset=".5" stopColor="#ff9a7a" /><stop offset="1" stopColor="#ff6aa8" /></linearGradient></defs>
    <rect x="3" y="3" width="28" height="28" rx="9" fill="none" stroke="url(#evRing)" strokeWidth="3.200" />
    <rect x="6.500" y="6.500" width="21" height="21" rx="6.500" fill="none" stroke="#ffe0b8" strokeOpacity=".7" strokeWidth="1" strokeDasharray="1.600 2.400" />
    {[[17, 2.500], [31.500, 17], [17, 31.500], [2.500, 17], [6, 6], [28, 6], [28, 28], [6, 28]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i < 4 ? 2.100 : 1.500} fill={i % 2 ? '#ffd45a' : '#ffb0d8'} />
    ))}
  </svg>
)

const Check = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff3b0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.500l5.500 5.500L20 6.500" /></svg>
)

/* X và O trang trí quanh nhân vật */
const DecoX = () => (
  <svg className="ev-deco x" width="34" height="32" viewBox="0 0 34 32" aria-hidden>
    <defs><linearGradient id="evDx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a8c8ff" /><stop offset="1" stopColor="#4a8bff" /></linearGradient></defs>
    <path d="M5 4l24 24M29 4L5 28" stroke="url(#evDx)" strokeWidth="7" strokeLinecap="round" />
  </svg>
)
const DecoO = ({ cls, size = 40, c1 = '#ff9be8', c2 = '#d23cff', sw = 8 }) => (
  <svg className={`ev-deco ${cls}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <defs><linearGradient id={`evDo${cls}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
    <circle cx="20" cy="20" r={20 - sw / 2 - 1} fill="none" stroke={`url(#evDo${cls})`} strokeWidth={sw} />
  </svg>
)

const Sparkle = ({ x, y, s = 1, c = '#fff' }) => (
  <svg className="ev-spark" style={{ left: x, top: y }} width={14 * s} height={14 * s} viewBox="0 0 14 14" aria-hidden>
    <path d="M7 0l1.600 5.400L14 7l-5.400 1.600L7 14 5.400 8.600 0 7l5.400-1.600z" fill={c} />
  </svg>
)

/* ---------- dữ liệu ---------- */
const NAV = [
  ['/home', 'home', 'Trang chủ'],
  ['/profile', 'trophy', 'Hồ sơ'],
  ['/history', 'doc', 'Lịch sử đấu'],
  ['/leaderboard', 'podium', 'Bảng xếp hạng'],
  ['/settings', 'gear', 'Cài đặt'],
  ['/how-to-play', 'book', 'Hướng dẫn'],
]

const TABS = [
  { k: 'hot', label: 'Sự kiện Hot', icon: 'gift' },
  { k: 'week', label: 'Sự kiện Tuần', icon: 'calendar' },
  { k: 'special', label: 'Sự kiện Đặc biệt', icon: 'star' },
  { k: 'notice', label: 'Thông báo', icon: 'mega' },
]

const MISSIONS = [
  { k: 'm1', title: 'Chơi 10 trận đấu', max: 10, icon: <Swords />, reward: { kind: 'coin', n: 500 } },
  { k: 'm2', title: 'Thắng 5 trận', max: 5, icon: <MiniTrophy />, reward: { kind: 'gem', n: 50 } },
  { k: 'm3', title: 'Đăng nhập 7 ngày', max: 7, icon: <CalCheck />, reward: { kind: 'gift', n: 1 } },
]
const GIFT_COINS = 200 // 1 hộp quà = 200 xu

// Điểm tích lũy tính từ lịch sử trận của tài khoản, không dùng số giả.
const MILESTONES = [
  { at: 200, kind: 'coin', n: 500, label: '500' },
  { at: 500, kind: 'gem', n: 100, label: '100' },
  { at: 1000, kind: 'gift', n: 1, label: '1' },
  { at: 2000, kind: 'ring', n: 0, label: '' },
]
const NODE_X = [609, 672, 735, 798]
// điểm -> toạ độ x trên thanh tiến độ (theo từng đoạn giữa các mốc)
const pointX = (p) => {
  if (p <= MILESTONES[0].at) return NODE_X[0] - 33 + (p / MILESTONES[0].at) * 33
  for (let i = 0; i < MILESTONES.length - 1; i++) {
    const a = MILESTONES[i].at, b = MILESTONES[i + 1].at
    if (p <= b) return NODE_X[i] + ((p - a) / (b - a)) * (NODE_X[i + 1] - NODE_X[i])
  }
  return NODE_X[3]
}

const RewardIcon = ({ kind, size = 26 }) => {
  if (kind === 'coin') return <Coin size={size} />
  if (kind === 'gem') return <Diamond size={size} />
  if (kind === 'gift') return <Gift size={size} />
  return <Ring />
}

const loadState = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    if (v && Array.isArray(v.m) && Array.isArray(v.ms)) return v
  } catch { /* ignore */ }
  return { m: [false, false, false], ms: [true, false, false, false] }
}


const WEEK_START = '2026-11-24'
const WEEK_END = '2026-11-30'
const WEEK_MISSIONS = [
  { title: 'Chơi 30 trận đấu', max: 30, icon: <Swords />, reward: {kind:'coin',n:1000} },
  { title: 'Thắng 15 trận', max: 15, icon: <MiniTrophy />, reward: {kind:'gem',n:100} },
  { title: 'Chơi cùng bạn bè 5 trận', max: 5, icon: <Ico n="home" size={24}/>, reward: {kind:'coin',n:200} },
  { title: 'Đăng nhập 5 ngày trong tuần', max: 5, icon: <CalCheck />, reward: {kind:'coin',n:500} },
  { title: 'Đạt chuỗi thắng 3 trận', max: 3, icon: <Star size={25}/>, reward: {kind:'gem',n:50} },
]
const WEEK_MILES = [
  {at:10,kind:'coin',n:500},{at:20,kind:'gem',n:50},
  {at:30,kind:'coin',n:200},{at:40,kind:'ring',n:0},{at:50,kind:'coin',n:1000},
]
const vietnamDay = (at) => {
  const t = Date.parse(at)
  return Number.isFinite(t) ? new Date(t + 7*3600000).toISOString().slice(0,10) : ''
}
const weekProgress = (matches, loginDays) => {
  const week = matches.filter(m => m.onlineVerified === true && vietnamDay(m.at) >= WEEK_START && vietnamDay(m.at) <= WEEK_END)
  const ordered = [...week].sort((a,b) => Date.parse(a.at)-Date.parse(b.at))
  let streak = 0, best = 0
  for (const m of ordered) {
    streak = m.result === 'win' ? streak+1 : 0
    best = Math.max(best,streak)
  }
  return [
    week.length,
    week.filter(m=>m.result==='win').length,
    week.filter(m=>m.friendMatch === true).length,
    new Set((loginDays||[]).filter(d=>d>=WEEK_START && d<=WEEK_END)).size,
    best,
  ]
}
function WeeklyContent({user,matches,claims,claimEventReward,claiming,setClaiming,setToast,nav}) {
  const progress=weekProgress(matches,user?.loginDays)
  const todayVN = new Date(Date.now()+7*3600000).toISOString().slice(0,10)
  const eventOpen = todayVN >= WEEK_START && todayVN <= WEEK_END
  const points=progress.reduce((sum,n,i)=>sum+Math.min(n,WEEK_MISSIONS[i].max),0)
  const claim=async(id, title)=>{
    if(claiming)return
    setClaiming(true)
    try {
      const r=await claimEventReward(id)
      setToast(r.ok?`Đã nhận ${title}!`:(r.error||'Không thể nhận thưởng.'))
    } finally {setClaiming(false)}
  }
  return <div className="ew-content">
    <div className="ew-missions">
      <div className="ew-heading">Nhiệm vụ tuần</div>
      <div className="ew-week-date"><Ico n="clock" size={14}/> Thời gian: 24/11 - 30/11/2026</div>
      {WEEK_MISSIONS.map((m,i)=>{
        const done=claims.includes(`week26:mission:${i}`)
        const ready=progress[i]>=m.max
        return <div className="ew-row" key={i} style={{top:40+i*37}}>
          <div className="ew-icon">{m.icon}</div>
          <div className="ew-label">{m.title}</div>
          <div className="ew-progress"><i style={{width:`${Math.min(100,progress[i]/m.max*100)}%`}}/></div>
          <span className="ew-count">{Math.min(progress[i],m.max)} / {m.max}</span>
          <div className="ew-reward"><RewardIcon kind={m.reward.kind}/><span>{m.reward.n}</span></div>
          <button className={`ew-button ${ready&&!done?'ready':''}`} disabled={done||claiming||!eventOpen} onClick={()=>ready?claim(`week26:mission:${i}`,m.title):nav(i===3?'/home':'/home')}>{done?'Đã nhận':!eventOpen?'Chưa mở':ready?'Nhận':'Đến'}</button>
        </div>
      })}
    </div>
    <div className="ew-mile">
      <div className="ew-mile-title"><Gift size={28}/> Phần thưởng tuần</div>
      <div className="ew-mile-track"><i style={{width:`${Math.min(100,points/50*100)}%`}}/></div>
      {WEEK_MILES.map((m,i)=>{
        const done=claims.includes(`week26:mile:${m.at}`)
        const ready=points>=m.at
        return <div className="ew-mile-item" key={m.at} style={{left:143+i*92}}>
          <button title={`Mốc ${m.at} điểm`} disabled={!eventOpen||!ready||done||claiming} className={ready?'ready':''} onClick={()=>claim(`week26:mile:${m.at}`,`mốc ${m.at}`)}>
            {done?<Check/>:m.kind==='crown'?<CrownBig/>:<RewardIcon kind={m.kind} size={30}/>}
            {m.n>0&&<small>{m.n}</small>}
          </button>
          <i/><b>{m.at}</b>
        </div>
      })}
    </div>
  </div>
}

export default function EventHot() {
  const nav = useNavigate()
  const { user, matches, logout, claimEventReward, checkInToday } = useApp()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('hot')
  const [claiming, setClaiming] = useState(false)
  const wins = matches.filter(m => m.result === 'win').length
  const POINTS = matches.length * 10 + wins * 20
  const todayVN = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const checkedToday = (user?.loginDays || []).includes(todayVN)
  const todayMatches = matches.filter(m => typeof m.at === 'string' && !Number.isNaN(Date.parse(m.at)) && new Date(new Date(m.at).getTime() + 7 * 3600000).toISOString().slice(0, 10) === todayVN)
  const progress = [todayMatches.length, todayMatches.filter(m => m.result === 'win').length, new Set((user?.loginDays || []).filter(d => d.startsWith('2026-11'))).size]
  const claims = user?.eventClaims || []
  const fillX = pointX(POINTS)
  if (!user) return null

  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }
  const claimMission = async (i) => {
    const m = MISSIONS[i]
    if (claiming) return
    setClaiming(true)
    try {
      const result = await claimEventReward(i < 2 ? `nov26:daily:${todayVN}:${m.k}` : `nov26:${m.k}`)
      setToast(result.ok ? `Đã nhận thưởng ${m.title}! Số dư đã cập nhật.` : (result.error || 'Không thể nhận thưởng.'))
    } finally { setClaiming(false) }
  }
  const doCheckIn = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const r = await checkInToday()
      setToast(r.ok ? (r.already ? 'Hôm nay bạn đã điểm danh rồi.' : 'Điểm danh hôm nay thành công!') : (r.error || 'Điểm danh thất bại.'))
    } finally { setClaiming(false) }
  }
  const claimMile = async (i) => {
    const m = MILESTONES[i]
    if (claiming) return
    setClaiming(true)
    try {
      const result = await claimEventReward(`nov26:mile:${m.at}`)
      setToast(result.ok ? (m.kind === 'ring' ? 'Đã mở khóa khung avatar Tháng 11! Vào Hồ sơ để trang bị.' : `Đã nhận thưởng mốc ${m.at}!`) : (result.error || 'Không thể nhận thưởng.'))
    } finally { setClaiming(false) }
  }
  const pickTab = (k) => setTab(k)

  return (
    <div className="hm-root">
      <div className="hm-stage ev-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Defs />
        <div className="ev-bg" />
        <div className="ev-bokeh" />
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="ev-s">
          {/* ===== nhân vật + trang trí ===== */}
          <img className="ev-char boy" src="/img/boy.png" alt="" draggable={false} />
          <img className="ev-char girl" src="/img/girl.png" alt="" draggable={false} />
          <DecoX />
          <DecoO cls="o1" size={42} />
          <DecoO cls="o2" size={26} c1="#9fd0ff" c2="#5a7cff" sw={6} />
          <Sparkle x={330} y={90} s={0.8} c="#7fd0ff" /><Sparkle x={702} y={105} s={0.7} c="#ffb0f0" /><Sparkle x={150} y={150} s={0.6} c="#cfe0ff" />

          {/* ===== tiêu đề ===== */}
          <div className="ev-title">
            <Laurel pale /><Laurel pale flip />
            <div className="ev-title-pill">
              <span className="ev-title-gift">{tab === 'week' ? <Ico n="calendar" size={48} /> : tab === 'special' ? <Star size={48} /> : tab === 'notice' ? <Ico n="mega" size={48} /> : <BigGift />}</span>
              <b>{TABS.find(t => t.k === tab)?.label || 'Sự kiện Hot'}</b>
            </div>
          </div>

          {/* ===== menu trái ===== */}
          <nav className="ev-nav">
            {NAV.map(([to, ic, label], i) => (
              <button key={to} type="button" className={`ev-nav-i c-${ic} ${i === 0 ? 'on' : ''}`} style={{ top: 3 + i * 41 }} onClick={() => nav(to)}>
                <Ico n={ic} size={17} fill={ic === 'home' ? 'currentColor' : 'none'} sw={ic === 'home' ? 1.5 : 2.2} />
                <b>{label}</b>
              </button>
            ))}
          </nav>

          {/* ===== khung lớn ===== */}
          <div className="ev-main">
            {/* cột tab */}
            <div className="ev-tabs">
              {TABS.map((t, i) => (
                <div key={t.k}>
                  <button type="button" className={`ev-tab ${tab === t.k ? 'on' : ''}`} aria-pressed={tab === t.k} style={{ top: i === 0 ? 17 : 73 + (i - 1) * 57 }} onClick={() => pickTab(t.k)}>
                    {t.k === 'hot' ? <Gift size={22} /> : <Ico n={t.icon} size={22} sw={1.9} />}
                    <b>{t.label}</b>
                  </button>
                  {i > 0 && i < 3 && <i className="ev-tab-hr" style={{ top: 129 + (i - 1) * 57 }} />}
                </div>
              ))}
            </div>

            {tab === 'week' ? <WeeklyContent user={user} matches={matches} claims={claims} claimEventReward={claimEventReward} claiming={claiming} setClaiming={setClaiming} setToast={setToast} nav={nav} /> : tab === 'special' || tab === 'notice' ? <div className="ev-other-panel"><div className="ev-other-icon">{tab === 'special' ? <Star size={66} /> : <Ico n="mega" size={66} />}</div><h2>{tab === 'special' ? 'Sự kiện Đặc biệt' : 'Thông báo'}</h2><p>{tab === 'special' ? 'Hiện chưa có sự kiện đặc biệt được công bố.' : 'Hiện chưa có thông báo sự kiện.'}</p><button type="button" onClick={() => setTab('hot')}>Xem Sự kiện Hot</button></div> : <Fragment>
            {/* thẻ sự kiện */}
            <div className="ev-card">
              <div className="ev-card-rays" />
              <div className="ev-card-glow" />
              <span className="ev-pill-ev">Sự kiện</span>
              <span className="ev-crown"><CrownBig /></span>
              <h2 className="ev-h2"><span>Đua Top</span><span style={{ fontSize: "0.82em", whiteSpace: "nowrap" }}>Tháng 11–12</span></h2>
              <Laurel /><Laurel flip />
              <svg className="ev-shard" width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M1 3l11-2-3 11-3-5z" fill="#6fd2ff" opacity=".9" /></svg>
              <span className="ev-podium"><Podium /></span>
              <span className="ev-trophy"><BigTrophy /></span>
              <span className="ev-box l"><GiftBox side="l" /></span>
              <span className="ev-box r"><GiftBox side="r" /></span>
              <span className="ev-gem a"><Diamond size={28} /></span>
              <span className="ev-gem b"><Diamond size={22} grad="evViolet" /></span>
              <Sparkle x={86} y={183} s={0.9} c="#ffe9a6" /><Sparkle x={168} y={150} s={0.7} c="#ffd0f4" /><Sparkle x={212} y={196} s={0.8} c="#fff" />
              <div className="ev-time"><Ico n="clock" size={14} sw={2.4} /><b>Thời gian: 01/11 - 20/12/2026</b></div>
            </div>

            {/* cột phải */}
            <p className="ev-intro">Tham gia thi đấu, tích điểm xếp hạng và<br />nhận ngay nhiều <em>phần thưởng hấp dẫn!</em></p>

            <div className="ev-missions">
              {MISSIONS.map((m, i) => {
                const done = claims.includes(i < 2 ? `nov26:daily:${todayVN}:${m.k}` : `nov26:${m.k}`)
                const ready = !done && progress[i] >= m.max
                return (
                  <div className="ev-row" key={m.k} style={{ top: i * 40.500 }}>
                    <span className="ev-row-ico">{m.icon}</span>
                    <span className="ev-row-t">{m.title}</span>
                    <span className="ev-bar"><i style={{ width: Math.min(100, (progress[i] / m.max) * 100) + '%' }} /></span>
                    <span className="ev-cnt">{progress[i]} / {m.max}</span>
                    <span className="ev-rw"><RewardIcon kind={m.reward.kind} size={m.reward.kind === 'gift' ? 30 : 32} /></span>
                    <span className="ev-rw-n">{m.reward.n}</span>
                    <button type="button" className={`ev-claim ${done ? 'done' : ''}`} disabled={done || claiming || (i === 2 ? (ready ? false : checkedToday) : !ready)} onClick={() => i === 2 && !ready ? doCheckIn() : claimMission(i)} title={i === 2 ? 'Mỗi ngày điểm danh một lần, đủ 7 ngày mới nhận quà' : ''}>
                      {done ? 'Đã nhận' : i === 2 && !ready ? (checkedToday ? 'Đã điểm danh' : 'Điểm danh') : 'Nhận'}
                      {ready && <em>!</em>}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="ev-mile">
              <div className="ev-mile-h"><Crown /><b>Phần thưởng mốc tích lũy</b></div>
              {MILESTONES.map((m, i) => {
                const claimed = claims.includes(`nov26:mile:${m.at}`)
                const ready = !claimed && POINTS >= m.at
                const cls = claimed ? 'claimed' : ready ? 'ready' : 'locked'
                return (
                  <button key={m.at} type="button" className={`ev-mbox ${cls}`} style={{ left: NODE_X[i] - 22 - 562 }} disabled={!ready || claiming} onClick={() => claimMile(i)}
                    aria-label={`Mốc ${m.at} điểm`}>
                    {claimed ? <span className="ev-mchk"><Check size={22} /></span> : <RewardIcon kind={m.kind} size={m.kind === 'ring' ? 36 : 32} />}
                    {m.label && <em>{m.label}</em>}
                    <i className="ev-mtail" />
                  </button>
                )
              })}
              <div className="ev-track">
                <i className="ev-track-bg" />
                <i className="ev-track-fill" style={{ width: fillX - 577 }} />
              </div>
              {MILESTONES.map((m, i) => (
                <Fragment key={m.at}>
                  <i className={`ev-node ${POINTS >= m.at ? 'on' : ''}`} style={{ left: NODE_X[i] - 562 - 7 }} />
                  <span className="ev-nlab" style={{ left: NODE_X[i] - 562 - 20 }}>{m.at}</span>
                </Fragment>
              ))}
              <div className="ev-pts">
                <span>Điểm hiện tại</span>
                <div><Star size={20} /><b>{POINTS}</b></div>
              </div>
            </div>
            </Fragment>}
          </div>
        </div>

        {/* ===== thanh trên (dùng chung với Home) ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
      </div>
      {toast}
    </div>
  )
}
