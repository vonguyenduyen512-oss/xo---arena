import { photoOf } from '../lib/avatar.js'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { call, socket } from '../lib/socket.js'
import { Crown, PETALS, TopHud, useFit } from '../components/hud.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'

/* Màn hình 09 – Chờ đối thủ (Waiting Room)
   Stage 1280x720 tự thu phóng theo cửa sổ. Phần nội dung (.wr-s) dựng theo toạ độ của ảnh thiết kế 951x535
   rồi phóng 1.3459 lần, nên mọi số trong waiting.css khớp 1:1 với ảnh mẫu.
   Nếu có ảnh nền gốc (không kèm UI) hãy đặt tại public/img/wait-bg.jpg – CSS sẽ tự dùng thay cho nền SVG. */

/* ---------- đường viền khung ---------- */
const octa = (w, h, c) => [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]
const pts = (a) => a.map(([x, y]) => `${x},${y}`).join(' ')

export function NeonFrame({ w, h, c = 12, id, c1, c2, fill, inset = 5, sw = 2.2 }) {
  return (
    <svg className="wr-frame" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={fill[0]} /><stop offset="1" stopColor={fill[1]} /></linearGradient>
      </defs>
      <polygon points={pts(octa(w, h, c))} fill={`url(#${id}f)`} stroke={`url(#${id})`} strokeWidth={sw} strokeLinejoin="round" transform={`translate(0 0)`} />
      <polygon points={pts(octa(w - inset * 2, h - inset * 2, c - 3).map(([x, y]) => [x + inset, y + inset]))}
        fill="none" stroke={`url(#${id})`} strokeOpacity=".65" strokeWidth=".9" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- icon ---------- */
const Hourglass = () => (
  <svg width="29" height="30" viewBox="0 0 29 30" aria-hidden>
    <defs>
      <linearGradient id="wrhg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fe6ff" /><stop offset="1" stopColor="#1aa8ff" /></linearGradient>
    </defs>
    <rect x="2" y="1.5" width="25" height="3.4" rx="1.2" fill="#fff" />
    <rect x="2" y="25.100" width="25" height="3.400" rx="1.200" fill="#fff" />
    <path d="M5.500 4.900h18c0 5-2.800 8-6 10.100 3.200 2.100 6 5.100 6 10.100h-18c0-5 2.800-8 6-10.100-3.200-2.100-6-5.100-6-10.100z" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinejoin="round" />
    <path d="M14.500 17.200c2.200 1.700 4.500 3.600 5 7.900h-10c.5-4.300 2.800-6.200 5-7.900z" fill="url(#wrhg)" />
    <path d="M9.300 6.800h10.400c-.5 2.400-2.200 4-5.200 5.600-3-1.600-4.700-3.200-5.200-5.600z" fill="url(#wrhg)" opacity=".35" />
  </svg>
)

const FindPeople = () => (
  <svg width="29" height="23" viewBox="0 0 29 23" aria-hidden>
    <g fill="#fff">
      <circle cx="8.500" cy="6" r="4.300" /><path d="M0 20.500c0-5 3.400-8 8.500-8s8.500 3 8.500 8z" />
      <circle cx="17.800" cy="6.600" r="3.600" opacity=".92" /><path d="M16.200 11.700c4.600-.2 7.700 2.400 7.700 6.300h-3.600c0-2.600-1.700-4.600-4.100-6.300z" opacity=".92" />
    </g>
    <circle cx="21.200" cy="16.800" r="4.200" fill="#0a1065" stroke="#fff" strokeWidth="1.800" />
    <path d="M24.200 19.800l3.500 3.200" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
  </svg>
)

export const ChatBubble = () => (
  <svg width="26" height="24" viewBox="0 0 26 24" aria-hidden>
    <path d="M5 1.500h16a4 4 0 0 1 4 4v9.500a4 4 0 0 1-4 4H12.500L6.500 23v-4H5a4 4 0 0 1-4-4V5.500a4 4 0 0 1 4-4z" fill="#fff" />
    <g fill="#3a2bb0"><circle cx="8.300" cy="10.300" r="1.700" /><circle cx="13" cy="10.300" r="1.700" /><circle cx="17.700" cy="10.300" r="1.700" /></g>
  </svg>
)

export const Chev = () => (
  <svg width="13" height="19" viewBox="0 0 13 19" fill="none" stroke="currentColor" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.500 2L3 9.500l7.500 7.500" />
  </svg>
)

export const BigCrown = () => (
  <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden>
    <defs>
      <linearGradient id="wrcr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe785" /><stop offset=".55" stopColor="#ffbf2a" /><stop offset="1" stopColor="#e88a08" /></linearGradient>
    </defs>
    <path d="M3 24L1.500 7.500l9 7L18 2l7.500 12.500 9-7L33 24z" fill="url(#wrcr)" stroke="#fff1b4" strokeWidth="1.200" strokeLinejoin="round" />
    <rect x="3" y="21.500" width="30" height="4.500" rx="1.500" fill="#f2a313" stroke="#fff1b4" strokeWidth=".9" />
    <g fill="#fff6c9" stroke="#ffb02a" strokeWidth=".8"><circle cx="1.800" cy="6.500" r="2.200" /><circle cx="18" cy="2.300" r="2.400" /><circle cx="34.200" cy="6.500" r="2.200" /></g>
  </svg>
)

/* ---------- VS + tia sét (vẽ bằng SVG, toạ độ = toạ độ ảnh mẫu) ---------- */
export function Versus() {
  return (
    <svg className="wr-vs" viewBox="360 150 250 200" width="250" height="200" aria-hidden>
      <defs>
        <linearGradient id="wrvg" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#fff7b8" /><stop offset=".38" stopColor="#ffd23c" /><stop offset=".72" stopColor="#ff9a14" /><stop offset="1" stopColor="#ef6a06" />
        </linearGradient>
        <linearGradient id="wrbeam" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7be8" stopOpacity="0" /><stop offset=".4" stopColor="#ffb4f2" /><stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id="wrbeam2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c58bff" stopOpacity="0" /><stop offset=".45" stopColor="#e6baff" /><stop offset="1" stopColor="#fff" />
        </linearGradient>
        <filter id="wrglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="wrsoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="11" /></filter>
      </defs>

      {/* quầng sáng tím/hồng phía sau */}
      <ellipse cx="482" cy="246" rx="62" ry="50" fill="#d24bff" opacity=".55" filter="url(#wrsoft)" />
      <ellipse cx="482" cy="250" rx="46" ry="38" fill="#ff8a3a" opacity=".35" filter="url(#wrsoft)" />

      {/* tia sét */}
      <g filter="url(#wrglow)" strokeLinecap="round">
        <path d="M356 300 L400 281 L440 266" stroke="url(#wrbeam)" strokeWidth="2.600" fill="none" />
        <path d="M372 296 L424 270" stroke="#fff" strokeWidth=".9" fill="none" opacity=".9" />
        <path d="M606 186 L574 193 L540 210" stroke="url(#wrbeam2)" strokeWidth="2.800" fill="none" />
        <path d="M588 190 L546 207" stroke="#fff" strokeWidth=".9" fill="none" opacity=".9" />
        <path d="M545 158 L522 192" stroke="url(#wrbeam2)" strokeWidth="1.800" fill="none" />
        <path d="M470 312 L447 346" stroke="url(#wrbeam)" strokeWidth="1.800" fill="none" />
        <path d="M498 306 L484 336" stroke="#ffd0f6" strokeWidth="1.200" fill="none" opacity=".8" />
      </g>

      {/* chữ VS: viền cam đậm → thân vàng → highlight */}
      <g filter="url(#wrglow)">
        <g strokeLinejoin="miter" strokeLinecap="butt">
          <polygon points="424,218 449,212 455,257 494,193 513,188 478,290 438,293"
            fill="#a63a00" stroke="#a63a00" strokeWidth="9" strokeLinejoin="round" />
          <path d="M537 218 C515 213 490 214 491 232 C492 251 530 252 529 272 C528 292 492 292 464 297"
            fill="none" stroke="#a63a00" strokeWidth="27" strokeLinejoin="round" />
        </g>
        <polygon points="424,218 449,212 455,257 494,193 513,188 478,290 438,293"
          fill="url(#wrvg)" stroke="#ff7a12" strokeWidth="3.600" strokeLinejoin="round" />
        <path d="M537 218 C515 213 490 214 491 232 C492 251 530 252 529 272 C528 292 492 292 464 297"
          fill="none" stroke="#ff7a12" strokeWidth="22" strokeLinejoin="round" />
        <path d="M537 218 C515 213 490 214 491 232 C492 251 530 252 529 272 C528 292 492 292 464 297"
          fill="none" stroke="url(#wrvg)" strokeWidth="16" strokeLinejoin="round" />
        {/* highlight */}
        <polygon points="430,222 444,219 449,250 441,288" fill="#fffbd0" opacity=".55" />
        <path d="M494 224c8-6 22-5 34-3" stroke="#fffbd0" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".6" />
      </g>
    </svg>
  )
}

/* ---------- nền: đền đài + lồng đèn + sàn đấu phát sáng ---------- */
function Flower({ x, y, s = 1, r = 0, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-5" rx="3.300" ry="5.200" fill="#ffb7ec" transform={`rotate(${a})`} />
      ))}
      <circle r="1.600" fill="#ff6fd0" />
    </g>
  )
}

function Pagoda({ x, flip = false, tint = '#6aa8ff' }) {
  const t = `translate(${x} 0) ${flip ? 'scale(-1 1)' : ''}`
  const tiers = [
    { y: 168, w: 118, h: 16 }, { y: 232, w: 140, h: 16 }, { y: 300, w: 162, h: 16 }, { y: 372, w: 184, h: 16 },
  ]
  return (
    <g transform={t}>
      <path d="M-20 450V150h104v300z" fill="#171072" />
      <path d="M-20 450V150h40v300z" fill="#0f0a56" />
      {tiers.map((r, i) => (
        <g key={r.y}>
          {/* thân tầng + cửa sổ */}
          <rect x="-10" y={r.y + 14} width={r.w - 30} height={r.h * 3.4} fill={i % 2 ? '#1b1380' : '#211790'} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={8 + k * 30} y={r.y + 24} width="14" height="26" rx="2" fill={k === 1 ? '#ff9ee8' : tint} opacity={k === 1 ? .8 : .55} />
          ))}
          {/* mái cong */}
          <path d={`M-14 ${r.y + 2} Q${r.w * .5} ${r.y - 22} ${r.w + 6} ${r.y - 44} L${r.w + 20} ${r.y - 28} Q${r.w * .55} ${r.y + 8} -14 ${r.y + 18}z`}
            fill="#33259f" stroke={tint} strokeOpacity=".75" strokeWidth="1.300" strokeLinejoin="round" />
          <path d={`M-14 ${r.y + 2} Q${r.w * .5} ${r.y - 22} ${r.w + 6} ${r.y - 44}`} fill="none" stroke="#bcd6ff" strokeOpacity=".55" strokeWidth="1.600" />
          {/* dây đèn nhỏ dọc mái */}
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <circle key={f} cx={r.w * f} cy={r.y + 6 - f * 14 + (f > .5 ? 0 : 3)} r="1.800" fill="#ffc98a" opacity=".9" />
          ))}
        </g>
      ))}
      {/* biểu ngữ vương miện */}
      {[[46, 196], [96, 262]].map(([bx, by]) => (
        <g key={bx} transform={`translate(${bx} ${by})`}>
          <path d="M0 0h30v70l-15-10-15 10z" fill="#2c2296" stroke="#8c82ff" strokeOpacity=".9" strokeWidth="1.200" />
          <path d="M6 30l-1-11 5 4 5-8 5 8 5-4-1 11z" fill="none" stroke="#b6aeff" strokeWidth="1.400" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  )
}

function Lantern({ x, y, r = 11, c = '#ff9a3c', id }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 3.400} fill={`url(#${id})`} />
      <rect x={x - r * .62} y={y - r} width={r * 1.240} height={r * 2} rx={r * .45} fill={c} />
      <rect x={x - r * .85} y={y - r * 1.200} width={r * 1.700} height={r * .32} rx="1" fill="#3a1d66" />
      <rect x={x - r * .85} y={y + r * .9} width={r * 1.700} height={r * .32} rx="1" fill="#3a1d66" />
      <rect x={x - r * .22} y={y - r * .7} width={r * .44} height={r * 1.400} rx={r * .2} fill="#fff" opacity=".55" />
    </g>
  )
}

function Star4({ x, y, s = 1, c = '#fff' }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-9C1-3 3-1 9 0 3 1 1 3 0 9-1 3-3 1-9 0-3-1-1-3 0-9z" fill={c} />
}

export function Backdrop() {
  return (
    <svg className="wr-bg-svg" viewBox="0 0 951 535" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="wrsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2ec6" /><stop offset=".30" stopColor="#242ec4" />
          <stop offset=".55" stopColor="#3a2bb4" /><stop offset=".8" stopColor="#1a1068" /><stop offset="1" stopColor="#0a0848" />
        </linearGradient>
        <radialGradient id="wrL" cx="16%" cy="48%" r="34%"><stop offset="0" stopColor="#3d86ff" stopOpacity=".55" /><stop offset="1" stopColor="#3d86ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="wrR" cx="84%" cy="48%" r="34%"><stop offset="0" stopColor="#d23cff" stopOpacity=".5" /><stop offset="1" stopColor="#d23cff" stopOpacity="0" /></radialGradient>
        <radialGradient id="wrC" cx="50%" cy="38%" r="30%"><stop offset="0" stopColor="#8a7cff" stopOpacity=".55" /><stop offset="1" stopColor="#8a7cff" stopOpacity="0" /></radialGradient>
        <radialGradient id="wrVig" cx="50%" cy="50%" r="72%"><stop offset=".55" stopColor="#05033a" stopOpacity="0" /><stop offset="1" stopColor="#05033a" stopOpacity=".7" /></radialGradient>
        <radialGradient id="wrFloor" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#4b5bff" stopOpacity=".55" /><stop offset=".7" stopColor="#2a1fb0" stopOpacity=".35" /><stop offset="1" stopColor="#1a1080" stopOpacity="0" /></radialGradient>
        <linearGradient id="wrRing" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3aa8ff" /><stop offset=".5" stopColor="#7fd6ff" /><stop offset="1" stopColor="#b25bff" />
        </linearGradient>
        <radialGradient id="wrlo"><stop offset="0" stopColor="#ffa24a" stopOpacity=".7" /><stop offset="1" stopColor="#ffa24a" stopOpacity="0" /></radialGradient>
        <radialGradient id="wrlp"><stop offset="0" stopColor="#ff7ee8" stopOpacity=".65" /><stop offset="1" stopColor="#ff7ee8" stopOpacity="0" /></radialGradient>
        <radialGradient id="wrlw"><stop offset="0" stopColor="#ffffff" stopOpacity=".85" /><stop offset=".4" stopColor="#bcd8ff" stopOpacity=".35" /><stop offset="1" stopColor="#8ab4ff" stopOpacity="0" /></radialGradient>
        <filter id="wrglowring" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="1.600" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="wrblur6"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="wrblur2"><feGaussianBlur stdDeviation="1.800" /></filter>
      </defs>

      <rect width="951" height="535" fill="url(#wrsky)" />
      <rect width="951" height="535" fill="url(#wrL)" />
      <rect width="951" height="535" fill="url(#wrR)" />
      <rect width="951" height="535" fill="url(#wrC)" />

      {/* cổng + bậc thềm ở giữa (mờ) */}
      <g filter="url(#wrblur6)" opacity=".8">
        <path d="M410 214V150q0-18 20-24h92q20 6 20 24v64z" fill="#2a2aa8" />
        <path d="M395 150q40-22 80-22t80 22l-8 10q-72-22-144 0z" fill="#5a4ee0" opacity=".8" />
        <path d="M388 420l22-120h132l22 120z" fill="#6a60ff" opacity=".45" />
        {[312, 330, 348, 366, 384, 402].map((y, i) => (
          <rect key={y} x={404 - i * 2.800} y={y} width={142 + i * 5.600} height="9" fill="#9a90ff" opacity={0.25 + i * 0.04} />
        ))}
      </g>

      {/* đền hai bên */}
      <g>
        <Pagoda x={0} tint="#6aa8ff" />
        <Pagoda x={951} flip tint="#ff8ae6" />
      </g>

      {/* lồng đèn */}
      <Lantern x={14} y={207} r={11} c="#ffa24a" id="wrlo" />
      <Lantern x={151} y={266} r={7} c="#ff8cf0" id="wrlp" />
      <Lantern x={149} y={343} r={8} c="#fff6e4" id="wrlw" />
      <Lantern x={803} y={264} r={7} c="#ff8cf0" id="wrlp" />
      <Lantern x={802} y={341} r={8} c="#fff6e4" id="wrlw" />
      <Lantern x={935} y={298} r={10} c="#ffa24a" id="wrlo" />

      {/* sàn đấu phát sáng */}
      <ellipse cx="476" cy="478" rx="470" ry="78" fill="url(#wrFloor)" />
      <g fill="none" stroke="url(#wrRing)" filter="url(#wrglowring)">
        <ellipse cx="476" cy="482" rx="458" ry="62" strokeWidth="3" opacity=".95" />
        <ellipse cx="476" cy="482" rx="372" ry="48" strokeWidth="2.200" opacity=".85" />
        <ellipse cx="476" cy="484" rx="288" ry="36" strokeWidth="1.400" opacity=".65" />
        <ellipse cx="476" cy="486" rx="210" ry="24" strokeWidth="1.200" opacity=".5" />
      </g>
      <g stroke="#6fa8ff" strokeOpacity=".28" strokeWidth="1" fill="none">
        {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${476 + (i - 6) * 8} 440 L${476 + (i - 6) * 82} 535`} />)}
        <path d="M0 505H951M0 520H951" />
      </g>
      <rect x="0" y="500" width="951" height="35" fill="#0a0848" opacity=".55" />

      {/* hoa anh đào */}
      <g>
        <path d="M150 0q40 10 80 4t60 18" stroke="#2a1070" strokeWidth="3" fill="none" opacity=".7" />
        {[[170, 16, 1.2, 10], [196, 30, .9, 40], [214, 8, 1.4, 80], [242, 26, 1, 120], [262, 6, 1.1, 200], [186, 52, .8, 30], [226, 52, .7, 70], [150, 30, .8, 150]].map(([x, y, s, r], i) => <Flower key={'a' + i} x={x} y={y} s={s} r={r} />)}
        {[[606, 10, 1.1, 20], [636, 26, .9, 70], [660, 6, 1.3, 110], [690, 22, 1, 160], [716, 8, .8, 200], [626, 48, .7, 40], [668, 44, .8, 100]].map(([x, y, s, r], i) => <Flower key={'b' + i} x={x} y={y} s={s} r={r} />)}
        {[[938, 62, 1.2, 30], [925, 96, .9, 90], [942, 128, 1, 150], [905, 520, 1.2, 60], [930, 500, .9, 10], [20, 520, 1, 30], [60, 510, .8, 80]].map(([x, y, s, r], i) => <Flower key={'c' + i} x={x} y={y} s={s} r={r} o=".9" />)}
      </g>

      {/* tia sáng nhỏ */}
      <Star4 x={190} y={62} s={1.150} c="#cfe0ff" />
      <Star4 x={592} y={45} s={1.250} c="#d9ecff" />
      <Star4 x={876} y={376} s={.8} c="#fff" />
      <Star4 x={150} y={342} s={.9} c="#fff" />
      <Star4 x={640} y={66} s={.55} c="#cfe0ff" />

      <rect width="951" height="535" fill="url(#wrVig)" />
    </svg>
  )
}

/* ---------- thẻ người chơi ---------- */
const CARD_W = 209
const CARD_H = 245

export function ReadyPill({ label = 'Sẵn sàng' }) {
  return <div className="wr-ready"><i />{label}</div>
}

function MePanel({ user }) {
  const photo = photoOf(user.avatar)
  return (
    <section className="wr-card me">
      <div className="wr-card-fx" />
      <NeonFrame w={CARD_W} h={CARD_H} id="wrfl" c1="#5cd0ff" c2="#2f66ff" fill={['rgba(10,22,128,.50)', 'rgba(8,16,104,.72)']} />
      <div className="wr-avatar">
        <span className="wr-ring" />
        {photo ? <img src={photo} alt="" draggable={false} /> : <b className="emoji">{user.avatar}</b>}
      </div>
      <div className="wr-info" />
      <span className="wr-bigcrown"><BigCrown /></span>
      <div className="wr-name"><span>{user.name}</span><Crown w={19} h={15} /></div>
      <div className="wr-lv">Lv.{user.level}</div>
      <div className="wr-ready-pos"><ReadyPill /></div>
    </section>
  )
}

export function Silhouette() {
  return (
    <svg width="125" height="125" viewBox="0 0 125 125" aria-hidden>
      <defs>
        <clipPath id="wrsc"><circle cx="62.500" cy="62.500" r="58" /></clipPath>
        <radialGradient id="wrsb" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#14126e" /><stop offset="1" stopColor="#090748" /></radialGradient>
      </defs>
      <circle cx="62.500" cy="62.500" r="58" fill="url(#wrsb)" />
      <g clipPath="url(#wrsc)" fill="#8d82f5">
        <ellipse cx="62.500" cy="46" rx="20" ry="25" />
        <ellipse cx="41.500" cy="49.500" rx="4.200" ry="7" />
        <ellipse cx="83.500" cy="49.500" rx="4.200" ry="7" />
        <path d="M54 66h17v14c0 4 12 6 22 10 8 3 12 10 13 18H19c1-8 5-15 13-18 10-4 22-6 22-10z" />
      </g>
      <text x="62.500" y="104" textAnchor="middle" fontSize="23" fontWeight="800" fill="#2a1d86" fontFamily="'Inter Tight','Inter',sans-serif">?</text>
    </svg>
  )
}

function OpponentPanel({ joined, info }) {
  return (
    <section className={`wr-card opp ${joined ? 'joined' : ''}`}>
      <div className="wr-card-fx" />
      <NeonFrame w={CARD_W} h={CARD_H} id="wrfr" c1="#ff63e6" c2="#8a4dff" fill={['rgba(34,12,120,.55)', 'rgba(26,8,96,.74)']} />
      <div className="wr-oavatar">
        <span className="wr-oring" />
        {joined ? (photoOf(info?.avatar) ? <img src={photoOf(info.avatar)} alt="" draggable={false} /> : <b className="emoji">{info?.avatar || '🧑'}</b>) : <Silhouette />}
      </div>
      <div className="wr-info opp" />
      {joined ? (
        <>
          <div className="wr-name opp"><span>{info?.name || 'Đối thủ'}</span></div>
          <div className="wr-lv opp">Lv.{info?.level ?? 1}</div>
          <div className="wr-ready-pos opp"><ReadyPill /></div>
        </>
      ) : (
        <>
          <div className="wr-wait">Đang chờ đối thủ...</div>
          <div className="wr-spin" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ transform: `rotate(${i * 45}deg) translateY(-17.500px)`, opacity: [1, .55, .5, .5, .5, .5, .55, .7][i] }} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function WaitingRoom() {
  const { code } = useParams()
  const { state } = useLocation()
  const { user, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [sec, setSec] = useState(0)
  const [joined, setJoined] = useState(false)
  const quick = code === 'QUICK'

  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Realtime: chờ server báo có đối thủ ('room:updated') rồi vào ván ('game:start')
  const [oppInfo, setOppInfo] = useState(null)
  useEffect(() => {
    const me = { name: user?.name, level: user?.level, avatar: user?.avatar, token: sessionStorage.getItem('xo_player_token') }
    const onUpdated = ({ code: c, players }) => {
      setJoined(players.length === 2)
      if (players.length === 2) call('game:sync', { code: c }).then((r) => { if (r.ok) setOppInfo(r.state.players.find((p) => p.sym !== r.state.you) || null) })
    }
    const onStart = ({ code: c }) => setTimeout(() => nav(`/game/${c}`, { replace: true }), 1200)
    socket.on('room:updated', onUpdated)
    socket.on('game:start', onStart)
    if (quick) call('quick:join', { user: me }).then((r) => { if (!r.ok) { setToast(r.error); nav('/home') } })
    else call('game:sync', { code }).then((r) => { if (!r.ok) { setToast('Phòng không còn tồn tại'); nav('/home') } })
    return () => { socket.off('room:updated', onUpdated); socket.off('game:start', onStart) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const leaveRoom = () => { socket.emit('room:leave'); nav('/home') }

  if (!user) return null
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }
  const copy = () => { navigator.clipboard?.writeText(code); setToast('Đã sao chép mã phòng') }

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="wr-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="wr-s">
          {/* ===== tiêu đề ===== */}
          <div className="wr-title">
            <NeonFrame w={346} h={65} c={25} id="wrt" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.9)', 'rgba(4,8,70,.94)']} inset={4} sw={1.600} />
            <span className="wr-hg"><Hourglass /></span>
            <h1>Chờ đối thủ</h1>
            <p>{joined ? 'Đã tìm thấy đối thủ! Đang vào phòng...' : 'Đang tìm người chơi phù hợp...'}</p>
          </div>

          {!quick && (
            <button type="button" className="wr-code" onClick={copy} title="Sao chép mã phòng">
              <span>Mã phòng</span><b>{code}</b>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
            </button>
          )}

          {/* ===== hai người chơi + VS ===== */}
          <MePanel user={user} />
          <Versus />
          <OpponentPanel joined={joined} info={oppInfo} />

          {/* ===== bộ đếm tìm đối thủ ===== */}
          <div className="wr-timer">
            <NeonFrame w={343} h={71} c={19} id="wrtm" c1="#6fc4ff" c2="#4a5cff" fill={['rgba(6,10,92,.82)', 'rgba(4,6,72,.9)']} inset={4} sw={1.600} />
            <span className="wr-tico"><FindPeople /></span>
            <span className="wr-tlabel">{joined ? 'Đã tìm thấy đối thủ!' : 'Tìm kiếm đối thủ...'}</span>
            <b className="wr-tnum" aria-live="off">{mm}:{ss}</b>
          </div>

          {/* ===== nút ===== */}
          <button type="button" className="wr-pill wr-back" onClick={leaveRoom}>
            <Chev /><b>Quay lại</b>
          </button>
          <button type="button" className="wr-pill wr-leave" onClick={leaveRoom}>
            <Chev /><b>Rời phòng</b>
          </button>
        </div>

        {/* ===== thanh trên (dữ liệu người chơi thật) + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="wr-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {toast}
    </div>
  )
}
