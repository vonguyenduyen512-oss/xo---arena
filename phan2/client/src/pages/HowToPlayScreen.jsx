import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { Ico, PETALS, TopHud, useFit } from '../components/hud.jsx'
import { Backdrop, NeonFrame } from './WaitingRoom.jsx'
import { NAV } from './ProfileScreen.jsx'
import { NAV_ICON } from './LeaderboardScreen.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'
import '../components/profile.css'
import '../components/settings.css'
import '../components/howto.css'

/* Màn hình 16 – Hướng dẫn chơi
   Dựng hoàn toàn bằng code (SVG + CSS). Toạ độ trong .sx-s là toạ độ ảnh mẫu 962x542
   (stage 1280x720 tự thu phóng, giống màn Cài đặt). */

const NAV_TOPS = [96, 155, 202, 250, 298, 347]

/* ---------- icon ---------- */
const Svg = ({ size = 22, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...p}>{children}</svg>
)
const IBook = ({ size = 24 }) => (
  <Svg size={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </Svg>
)
const IPad = ({ size = 28 }) => (
  <Svg size={size} fill="currentColor">
    <path d="M7.200 6.500h9.600a5.200 5.200 0 0 1 5 4.300l.9 5a2.800 2.800 0 0 1-4.800 2.300L15 15.800H9l-2.900 2.300A2.800 2.800 0 0 1 1.300 15.800l.9-5a5.200 5.200 0 0 1 5-4.300z" />
    <path d="M7.500 9.800v4M5.500 11.800h4" stroke="#0c1470" strokeWidth="1.700" /><circle cx="15.500" cy="10.800" r="1" fill="#0c1470" /><circle cx="18" cy="12.800" r="1" fill="#0c1470" />
  </Svg>
)
const ICube = ({ size = 26 }) => (
  <Svg size={size} fill="none" stroke="currentColor" strokeWidth="1.900" strokeLinejoin="round" strokeLinecap="round">
    <path d="M12 2.200l8.800 4.900v9.800L12 21.800l-8.800-4.900V7.100z" /><path d="M3.200 7.100L12 12l8.800-4.900M12 12v9.800" />
  </Svg>
)
const IBurst = ({ size = 26 }) => (
  <Svg size={size} fill="currentColor">
    <path d="M12 1.500l2.600 6.300 6.400-2.600-2.600 6.400 6.300 2.600-6.300 2.600 2.600 6.400-6.400-2.600L12 22.500l-2.600-6.400-6.400 2.600 2.600-6.400L1.300 12l6.300-2.600L5 3l6.400 2.600z" transform="translate(0 -.4) scale(.97)" />
  </Svg>
)
const IStar = ({ size = 22 }) => (
  <Svg size={size} fill="url(#htGold)" stroke="#fff1a6" strokeWidth="1" strokeLinejoin="round">
    <path d="M12 2l3 6.900 7.500.7-5.700 5 1.700 7.400L12 18l-6.500 4 1.700-7.400-5.700-5 7.500-.7z" />
  </Svg>
)
const ITrophy = ({ size = 24 }) => (
  <Svg size={size} fill="none" stroke="url(#htGold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8M12 16v5M7 3h10v6a5 5 0 0 1-10 0zM7 5H3.500v1.500A3.500 3.500 0 0 0 7 10M17 5h3.500v1.500A3.500 3.500 0 0 1 17 10" />
    <path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="url(#htGold)" stroke="none" opacity=".9" />
  </Svg>
)
const IScales = ({ size = 26 }) => (
  <Svg size={size} fill="none" stroke="url(#htGold)" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v17M7 20.500h10M4 7h16M4 7l-3 7a3.500 3.500 0 0 0 6 0zM20 7l-3 7a3.500 3.500 0 0 0 6 0z" />
  </Svg>
)
const IBulb = ({ size = 24 }) => (
  <Svg size={size} fill="none" stroke="#ffe27a" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21.500h4M12 2.500a6.500 6.500 0 0 0-3.800 11.800c.7.600 1.300 1.500 1.300 2.500h5c0-1 .6-1.900 1.300-2.500A6.500 6.500 0 0 0 12 2.500z" fill="#ffd94a" fillOpacity=".25" />
  </Svg>
)
const ICheckBig = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.500l5.500 5.500L20 6.500" /></svg>
)
const Arrow = ({ dir }) => (
  <svg width="17" height="22" viewBox="0 0 17 22" fill="none" stroke="#fff" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === 'l' ? 'M12 3L4 11l8 8' : 'M5 3l8 8-8 8'} />
  </svg>
)

/* ---------- đồ hoạ trang trí ---------- */
const Laurel = ({ flip }) => {
  const leaves = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10
    const x = 34 - Math.sin(t * 1.5) * 26 + t * 4
    const y = 92 - t * 78
    return { x, y, r: -28 - t * 55, s: 1 - t * 0.35 }
  })
  return (
    <svg className={`ht-laurel ${flip ? 'r' : 'l'}`} width="44" height="98" viewBox="0 0 44 98" aria-hidden>
      <defs><linearGradient id={`htL${flip ? 'r' : 'l'}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe98a" /><stop offset="1" stopColor="#d58a12" /></linearGradient></defs>
      <path d="M38 95C20 82 12 55 22 14" fill="none" stroke="#e5a825" strokeWidth="1.600" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={8 * l.s} ry={3.300 * l.s} fill={`url(#htL${flip ? 'r' : 'l'})`}
          transform={`rotate(${l.r} ${l.x} ${l.y})`} stroke="#fff1a8" strokeWidth=".4" />
      ))}
    </svg>
  )
}

const BigTrophy = () => (
  <svg width="58" height="48" viewBox="0 0 58 48" aria-hidden>
    <defs>
      <linearGradient id="htT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2a0" /><stop offset=".55" stopColor="#ffc531" /><stop offset="1" stopColor="#b86c0a" /></linearGradient>
    </defs>
    <path d="M15 5h28v14c0 9-6 15-14 15S15 28 15 19z" fill="url(#htT)" stroke="#fff0a0" strokeWidth="1.200" />
    <path d="M15 8H6v5c0 6 4 10 9 10M43 8h9v5c0 6-4 10-9 10" fill="none" stroke="url(#htT)" strokeWidth="3.200" strokeLinecap="round" />
    <path d="M26 33h6v6h-6z" fill="#e9a21c" /><path d="M19 39h20l2 6H17z" fill="url(#htT)" stroke="#fff0a0" strokeWidth=".8" />
    <path d="M29 11l2 4.200 4.600.5-3.400 3.100 1 4.500-4.200-2.400-4.200 2.400 1-4.500-3.400-3.100 4.600-.5z" fill="#fff6c4" opacity=".92" />
  </svg>
)

/* bàn cờ phối cảnh + 5 quân X liền nhau */
const Board = () => {
  const cols = 9
  const top = [14, 188], bot = [0, 202]
  const vlines = Array.from({ length: cols + 1 }, (_, i) => {
    const t = i / cols
    return [top[0] + (top[1] - top[0]) * t, 0, bot[0] + (bot[1] - bot[0]) * t, 98]
  })
  const hy = [0, 20, 44, 70, 98]
  return (
    <svg className="ht-board" width="202" height="100" viewBox="-1 -1 204 100" aria-hidden>
      <defs>
        <linearGradient id="htBf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(40,90,230,.35)" /><stop offset="1" stopColor="rgba(20,40,170,.6)" /></linearGradient>
      </defs>
      <polygon points="14,0 188,0 202,98 0,98" fill="url(#htBf)" stroke="#59b7ff" strokeWidth="1.500" />
      {vlines.slice(1, -1).map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#4aa0ff" strokeOpacity=".75" strokeWidth=".9" />)}
      {hy.slice(1, -1).map((y, i) => {
        const t = y / 98
        return <line key={i} x1={14 - 14 * t} y1={y} x2={188 + 14 * t} y2={y} stroke="#4aa0ff" strokeOpacity=".75" strokeWidth=".9" />
      })}
      <g stroke="#fff" strokeWidth="2.600" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px #8fd0ff)' }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const cx = 31 + i * 35.500
          return <path key={i} d={`M${cx - 7} 56l14 15M${cx + 7} 56l-14 15`} />
        })}
      </g>
      <line x1="19" y1="63.500" x2="183" y2="63.500" stroke="#fff" strokeWidth="1.600" strokeOpacity=".9" style={{ filter: 'drop-shadow(0 0 3px #8fd0ff)' }} />
    </svg>
  )
}

/* ---------- khung ---------- */
const Box = ({ cls, l, t, w, h, id, c = 14, fill, c1 = '#6fc4ff', c2 = '#8a6bff', inset = 5, sw = 2, children }) => (
  <div className={`ht-box ${cls || ''}`} style={{ left: l, top: t, width: w, height: h }}>
    <NeonFrame w={w} h={h} c={c} id={id} c1={c1} c2={c2} fill={fill} inset={inset} sw={sw} />
    {children}
  </div>
)

const TABS = [
  { k: 'intro', label: 'Giới thiệu', icon: <IPad size={27} />, l: 188, w: 145 },
  { k: 'rules', label: 'Luật chơi', icon: <IBook size={25} />, l: 349, w: 140 },
  { k: 'modes', label: 'Các chế độ', icon: <ICube size={25} />, l: 497, w: 133 },
  { k: 'tips', label: 'Mẹo chơi', icon: <IBurst size={25} />, l: 637, w: 143 },
]

const RULES = [
  'Hai người chơi lần lượt đánh, mỗi lần 1 quân (X hoặc O).',
  'Quân được đặt vào ô trống trên bàn cờ.',
  'Ai có 5 quân liên tiếp trước sẽ thắng.',
  'Nếu bàn cờ đầy mà không có ai thắng, trận đấu sẽ hòa.',
]
const RULE_Y = [213, 252, 278, 306]
const TIPS = [
  'Luôn tìm cơ hội tạo 2 hướng tấn công.',
  'Chặn ngay nước đi của đối thủ.',
  'Giữ thế trận ở trung tâm bàn cờ.',
  'Suy nghĩ trước 2 - 3 nước đi.',
]
const MODES = [
  ['Chơi thường', 'Đấu nhanh với người chơi khác.'],
  ['Chơi với bạn bè', 'Tạo phòng và chia sẻ mã 6 ký tự.'],
  ['Chơi với AI', 'Luyện tập kỹ năng với máy.'],
  ['Chơi 2 người', 'Hai người thay phiên đánh trên cùng một máy.'],
]

function LeftIntro() {
  return (
    <>
      <div className="ht-h" style={{ left: 17, top: 9 }}><IStar size={22} /><b>X-O Arena là gì?</b></div>
      <p className="ht-p" style={{ left: 10, top: 37, width: 270 }}>
        X-O Arena là game cờ Caro trực tuyến, nơi bạn có thể thách đấu với người chơi khác, rèn luyện tư duy và leo top bảng xếp hạng.
      </p>
      <img className="ht-logo2" src="/img/logo.png" alt="X-O Arena" draggable={false} />
      <i className="ht-hr" style={{ top: 109 }} />
      <div className="ht-h" style={{ left: 17, top: 117 }}><ITrophy size={23} /><b>Mục tiêu</b></div>
      <p className="ht-p" style={{ left: 13, top: 148, width: 226 }}>
        Đặt 5 quân liên tiếp theo hàng ngang, hàng dọc hoặc đường chéo để giành chiến thắng.
      </p>
      <Board />
      <div className="ht-win">
        <Laurel /><Laurel flip />
        <span className="ht-win-trophy"><BigTrophy /></span>
        <div className="ht-plate"><b>5 quân liên tiếp</b><b>= Thắng!</b></div>
      </div>
    </>
  )
}

function LeftList({ items, title, icon }) {
  return (
    <>
      <div className="ht-h" style={{ left: 17, top: 9 }}>{icon}<b>{title}</b></div>
      <ul className="ht-list">
        {items.map(([h, p]) => <li key={h}><b>{h}</b><span>{p}</span></li>)}
      </ul>
    </>
  )
}

export default function HowToPlayScreen() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('intro')
  if (!user) return null

  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }
  const page = tab === 'modes' ? 2 : 1
  const goPage = (p) => setTab(p === 2 ? 'modes' : 'intro')

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage sx-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="sx-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs><linearGradient id="htGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff09a" /><stop offset="1" stopColor="#ffb21e" /></linearGradient></defs>
        </svg>

        <div className="sx-s">
          {/* ===== menu trái ===== */}
          {NAV.map((n, i) => {
            const on = n.k === 'help'
            return (
              <button key={n.k} type="button" className={`sx-nav ${on ? 'on' : ''} ${n.k === 'back' ? 'back' : ''}`} style={{ top: NAV_TOPS[i] }}
                onClick={!on && n.to ? () => nav(n.to) : undefined}>
                <NeonFrame w={143} h={39} c={9} id={`htn${i}`} inset={3} sw={on ? 1.800 : 1.400}
                  c1={on ? '#ff9af5' : '#78b4ff'} c2={on ? '#c05cff' : '#5a7cff'}
                  fill={on ? ['rgba(92,34,200,.95)', 'rgba(44,16,140,.97)'] : ['rgba(16,28,140,.9)', 'rgba(8,12,96,.94)']} />
                <span className="sx-nav-in">{NAV_ICON[n.k] || n.icon}<b>{n.label}</b></span>
              </button>
            )
          })}

          {/* ===== tiêu đề ===== */}
          <div className="sx-title ht-title">
            <NeonFrame w={298} h={49} c={18} id="htt" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.92)', 'rgba(4,8,70,.95)']} inset={4} sw={1.600} />
            <span className="sx-title-in">
              <b><IBook size={27} />Hướng dẫn chơi</b>
              <em>Nắm vững luật chơi - Thắng dễ dàng hơn!</em>
            </span>
          </div>

          {/* ===== khung lớn ===== */}
          <Box cls="ht-main" l={168} t={111} w={781} h={361} c={22} id="htm" fill={['rgba(10,22,128,.4)', 'rgba(8,12,100,.6)']} inset={6} sw={2.200} />

          {/* ===== tab ===== */}
          {TABS.map((t, i) => {
            const on = tab === t.k
            return (
              <button key={t.k} type="button" role="tab" aria-selected={on} className={`ht-tab ${on ? 'on' : ''}`}
                style={{ left: t.l, width: t.w }} onClick={() => setTab(t.k)}>
                <NeonFrame w={t.w} h={34} c={9} id={`htb${i}`} inset={3} sw={on ? 1.800 : 1.300}
                  c1={on ? '#ff9af5' : '#78b4ff'} c2={on ? '#c05cff' : '#5a7cff'}
                  fill={on ? ['rgba(100,40,220,.96)', 'rgba(52,20,160,.97)'] : ['rgba(14,26,140,.55)', 'rgba(8,12,96,.7)']} />
                <span className="ht-tab-in">{t.icon}<b>{t.label}</b></span>
              </button>
            )
          })}

          {/* ===== nội dung trái ===== */}
          <Box cls="ht-left" l={183} t={163} w={477} h={299} c={14} id="htl" fill={['rgba(12,24,136,.5)', 'rgba(8,12,104,.7)']} inset={4} sw={1.600}>
            {tab === 'intro' && <LeftIntro />}
            {tab === 'rules' && <LeftList title="Luật chơi" icon={<IScales size={24} />}
              items={[['Lượt đi', 'Hai người chơi lần lượt đánh, mỗi lần 1 quân (X hoặc O). X đi trước.'], ['Đặt quân', 'Quân được đặt vào ô trống trên bàn cờ 15x15.'], ['Chiến thắng', 'Ai có 5 quân liên tiếp trước sẽ thắng.'], ['Hòa', 'Nếu bàn cờ đầy mà không có ai thắng, trận đấu sẽ hòa.']]} />}
            {tab === 'modes' && <LeftList title="Các chế độ" icon={<ICube size={24} />} items={MODES} />}
            {tab === 'tips' && <LeftList title="Mẹo chơi" icon={<IBulb size={24} />} items={TIPS.map((t) => ['✔', t])} />}
          </Box>

          {/* ===== luật chơi ===== */}
          <Box cls="ht-rules" l={669} t={163} w={262} h={174} c={14} id="htr" fill={['rgba(12,24,136,.5)', 'rgba(8,12,104,.7)']} inset={4} sw={1.600}>
            <div className="ht-h" style={{ left: 15, top: 8 }}><IScales size={25} /><b>Luật chơi</b></div>
            <i className="ht-hr" style={{ top: 34, left: 12, right: 12 }} />
            {RULES.map((r, i) => (
              <div key={i} className="ht-rule" style={{ top: RULE_Y[i] - 163 }}>
                <span className="ht-num">{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
          </Box>

          {/* ===== mẹo chơi ===== */}
          <Box cls="ht-tips" l={669} t={343} w={262} h={119} c={14} id="htp" fill={['rgba(12,24,136,.5)', 'rgba(8,12,104,.7)']} inset={4} sw={1.600}>
            <div className="ht-h" style={{ left: 15, top: 6 }}><IBulb size={23} /><b>Mẹo chơi</b></div>
            <i className="ht-hr" style={{ top: 29, left: 12, right: 12 }} />
            {TIPS.map((t, i) => (
              <div key={i} className="ht-tip" style={{ top: 44 + i * 20.500 }}>
                <span className="ht-ok"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4.500" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.500l5.500 5.500L20 6.500" /></svg></span>
                <span>{t}</span>
              </div>
            ))}
          </Box>

          {/* ===== phân trang ===== */}
          <button type="button" className="ht-pg" style={{ left: 417 }} aria-label="Trang trước" disabled={page === 1} onClick={() => goPage(1)}>
            <NeonFrame w={43} h={32} c={9} id="htg1" inset={3} sw={1.600} c1="#a8d4ff" c2="#6a8cff" fill={['rgba(12,24,150,.95)', 'rgba(6,10,100,.97)']} />
            <span><Arrow dir="l" /></span>
          </button>
          <div className="ht-page">{page} / 2</div>
          <button type="button" className="ht-pg" style={{ left: 546 }} aria-label="Trang sau" disabled={page === 2} onClick={() => goPage(2)}>
            <NeonFrame w={43} h={32} c={9} id="htg2" inset={3} sw={1.600} c1="#a8d4ff" c2="#6a8cff" fill={['rgba(12,24,150,.95)', 'rgba(6,10,100,.97)']} />
            <span><Arrow dir="r" /></span>
          </button>

          {/* ===== đã hiểu ===== */}
          <button type="button" className="ht-ok-btn" onClick={() => nav('/home')}>
            <NeonFrame w={158} h={42} c={13} id="htok" inset={3} sw={1.900} c1="#ff9af5" c2="#b060ff" fill={['rgba(100,40,214,.95)', 'rgba(48,18,150,.97)']} />
            <span><ICheckBig /><b>Đã hiểu</b></span>
          </button>
        </div>

        {/* ===== thanh trên + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="sx-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {toast}
    </div>
  )
}
