import { photoOf } from '../lib/avatar.js'
import { useEffect, useState } from 'react'

/* Các mảnh dùng chung cho những màn hình dựng theo stage 1280x720 (Home, Tạo phòng, ...) */

const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
  podium: 'M3 21h18M4 21v-7h5v7M9.5 21V6h5v15M15 21v-10h5v10',
  user: 'M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
  gear: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z',
  power: 'M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  swords: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2',
  door: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  exit: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  plus: 'M12 5v14M5 12h14',
  chev: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  eyeOff: 'M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.7A16.5 16.5 0 0 0 2 12s4 7 10 7a9.600 9.600 0 0 0 4.200-1M9.900 9.900a3 3 0 0 0 4.200 4.200',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3.500 7 3.500 10S15 19 12 22M12 2C9 5 8.500 9 8.500 12S9 19 12 22',
  shield: 'M12 2l8 3v6c0 5-3.500 9-8 11-4.500-2-8-6-8-11V5z',
  pencil: 'M4 20l1-4L16.500 4.500a2 2 0 0 1 3 0l0 0a2 2 0 0 1 0 3L8 19zM14 7l3 3',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  star: 'M12 2l3 6.9 7.5.7-5.7 5 1.700 7.400L12 18l-6.500 4 1.700-7.400-5.700-5 7.500-.7z',
  rocket: 'M5 15c-1.500 1.300-2 5-2 5s3.700-.5 5-2c.7-.8.700-2.100-.1-2.900a2.100 2.100 0 0 0-2.900-.1zM12 15l-3-3a22 22 0 0 1 2-4A12.900 12.900 0 0 1 22 2c0 2.700-.8 7.500-6 11a22.400 22.400 0 0 1-4 2zM9 12H4s.6-3 2-4c1.600-1.100 5 0 5 0M12 15v5s3-.6 4-2c1.100-1.600 0-5 0-5',
  megaphone: 'M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14',
}

export const Ico = ({ n, size = 22, fill = 'none', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={P[n]} />
  </svg>
)

export const Crown = ({ w = 18, h = 14 }) => (
  <svg width={w} height={h} viewBox="0 0 24 18" aria-hidden>
    <path d="M2 16L1 4l6 5 5-8 5 8 6-5-1 12z" fill="#ffc83a" stroke="#fff2b8" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

export const Gem = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
    <defs>
      <linearGradient id="gemg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9ff3ff" /><stop offset="1" stopColor="#2a8bff" />
      </linearGradient>
    </defs>
    <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#gemg2)" stroke="#d8fbff" strokeWidth="1" strokeLinejoin="round" />
    <path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6" fill="none" stroke="#e9fdff" strokeOpacity=".7" strokeWidth=".8" />
  </svg>
)

export const fmt = (n) => Number(n).toLocaleString('en-US')

export const PETALS = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 61 + 13) % 100, d: 9 + (i * 7) % 9, delay: -((i * 5) % 14), s: 0.7 + ((i * 3) % 6) / 8,
}))

/* thu phóng stage w x h theo cửa sổ */
export function useFit(w = 1280, h = 720) {
  const calc = () => Math.min(window.innerWidth / w, window.innerHeight / h)
  const [s, setS] = useState(calc)
  useEffect(() => {
    const f = () => setS(calc())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

export function Avatar({ avatar }) {
  const src = photoOf(avatar)
  return src
    ? <img className="hm-av-img" src={src} alt="" />
    : <span className="hm-av-emoji">{avatar}</span>
}

/* Nền Home: nền + thành phố mờ + bokeh + cánh hoa rơi */
export function HomeBackdrop() {
  return (
    <>
      <div className="hm-bg" />
      <div className="hm-city" />
      <div className="hm-bokeh" />
      {PETALS.map((p, i) => (
        <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
      ))}
    </>
  )
}

/* Thanh trên: hồ sơ + xu/kim cương + 4 nút tròn (giống Home) */
export function TopHud({ user, onProfile, onSettings, onLogout, soon }) {
  const pct = Math.min(100, Math.round((user.exp / user.expMax) * 100))
  return (
    <>
      <div className="hm-me" onClick={onProfile}>
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
        <button className="hm-round" onClick={onSettings} aria-label="Cài đặt"><Ico n="gear" size={24} /></button>
        <button className="hm-round" onClick={onLogout} aria-label="Đăng xuất"><Ico n="power" size={24} /></button>
      </div>
    </>
  )
}
