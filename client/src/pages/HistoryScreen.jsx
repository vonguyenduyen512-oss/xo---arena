import { photoOf } from '../lib/avatar.js'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import Replay from '../components/Replay.jsx'
import { useApp } from '../store.jsx'
import { Ico, PETALS, TopHud, useFit } from '../components/hud.jsx'
import { Backdrop, NeonFrame } from './WaitingRoom.jsx'
import { NAV } from './ProfileScreen.jsx'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'
import '../components/profile.css'
import '../components/history.css'

/* Màn hình 13 – Lịch sử đấu
   Dựng hoàn toàn bằng code (SVG + CSS), không dùng ảnh thiết kế làm nền hay phủ lên.
   Stage 1280x720 tự thu phóng; nội dung (.hs-s) theo toạ độ ảnh mẫu 962x541 (phóng 1.3306 lần).
   Chỉ hiển thị lịch sử trận đã lưu của tài khoản. */

const PER = 5
const pad = (n) => String(n).padStart(2, '0')
const dmy = (iso) => { const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
const hms = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
const RANGES = [['all', 'Tất cả thời gian', 0], ['7', '7 ngày qua', 7], ['30', '30 ngày qua', 30]]

/* ---------- icon ---------- */
const Crown = () => (
  <svg width="32" height="26" viewBox="0 0 36 28" aria-hidden>
    <defs><linearGradient id="hscr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9bff9b" /><stop offset=".6" stopColor="#3ddc5a" /><stop offset="1" stopColor="#139a3a" /></linearGradient></defs>
    <path d="M3 24L1.500 7.500l9 7L18 2l7.500 12.500 9-7L33 24z" fill="url(#hscr)" stroke="#d6ffd0" strokeWidth="1.200" strokeLinejoin="round" />
    <rect x="3" y="21.500" width="30" height="4.500" rx="1.500" fill="#22b24c" stroke="#d6ffd0" strokeWidth=".9" />
    <g fill="#eaffe6" stroke="#35c85a" strokeWidth=".8"><circle cx="1.800" cy="6.500" r="2.200" /><circle cx="18" cy="2.300" r="2.400" /><circle cx="34.200" cy="6.500" r="2.200" /></g>
  </svg>
)
const Swords = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff5a9a" strokeWidth="3" strokeLinecap="round" aria-hidden style={{ filter: 'drop-shadow(0 0 5px rgba(255,70,140,.8))' }}><path d="M5 5l14 14M19 5L5 19" /></svg>
)
const Scale = () => (
  <svg width="32" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffc83a" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ filter: 'drop-shadow(0 0 5px rgba(255,180,40,.8))' }}>
    <path d="M12 3v18M8 21h8M4 7h16" /><path d="M4 7l-3 7a3.500 3.500 0 0 0 6 0zM20 7l-3 7a3.500 3.500 0 0 0 6 0z" />
  </svg>
)
const Clock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9fc4ff" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.500 2" /></svg>
)
const Play = () => (<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M6 3.500v17l15-8.500z" fill="#fff" /></svg>)
const Cal = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2.500" fill="#fff" fillOpacity=".15" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M7.500 14h2M11 14h2M14.500 14h2M7.500 17.500h2M11 17.500h2" strokeWidth="2.200" />
  </svg>
)
const Chev = ({ d = 'down' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: d === 'down' ? 'none' : d === 'left' ? 'rotate(90deg)' : 'rotate(-90deg)' }}><path d="M5 9l7 7 7-7" /></svg>
)
const Bars = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="#9fc4ff" aria-hidden><rect x="3" y="12" width="4.600" height="9" rx="1" /><rect x="9.700" y="3" width="4.600" height="18" rx="1" /><rect x="16.400" y="8" width="4.600" height="13" rx="1" /></svg>)
const MiniCrown = () => (<svg width="19" height="15" viewBox="0 0 24 18" aria-hidden><path d="M2 16L1 4l6 5 5-8 5 8 6-5-1 12z" fill="#ffc83a" stroke="#fff2b8" strokeWidth="1" strokeLinejoin="round" /></svg>)

/* ---------- bàn cờ thu nhỏ trong mỗi dòng ---------- */
function MiniGrid({ moves = [] }) {
  const SZ = 48
  const g = useMemo(() => {
    if (!moves.length) return { n: 6, x0: 0, y0: 0 }
    const xs = moves.map((m) => m.x), ys = moves.map((m) => m.y)
    const minX = Math.min(...xs) - 1, maxX = Math.max(...xs) + 1, minY = Math.min(...ys) - 1, maxY = Math.max(...ys) + 1
    const n = Math.min(15, Math.max(6, maxX - minX + 1, maxY - minY + 1))
    const x0 = Math.max(0, Math.min(15 - n, Math.round((minX + maxX) / 2 - (n - 1) / 2)))
    const y0 = Math.max(0, Math.min(15 - n, Math.round((minY + maxY) / 2 - (n - 1) / 2)))
    return { n, x0, y0 }
  }, [moves])
  const { n, x0, y0 } = g
  const s = SZ / n
  return (
    <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} aria-hidden>
      <g stroke="rgba(90,175,255,.45)" strokeWidth=".6">
        {Array.from({ length: n + 1 }, (_, i) => <path key={i} d={`M${i * s} 0V${SZ}M0 ${i * s}H${SZ}`} />)}
      </g>
      {moves.filter((m) => m.x >= x0 && m.x < x0 + n && m.y >= y0 && m.y < y0 + n).map((m) => {
        const cx = (m.x - x0 + .5) * s, cy = (m.y - y0 + .5) * s, k = s * .28
        return m.s === 'X'
          ? <path key={`${m.x},${m.y}`} d={`M${cx - k} ${cy - k}L${cx + k} ${cy + k}M${cx + k} ${cy - k}L${cx - k} ${cy + k}`} stroke="#58dcff" strokeWidth={Math.max(1.200, s * .16)} strokeLinecap="round" />
          : <circle key={`${m.x},${m.y}`} cx={cx} cy={cy} r={s * .3} fill="none" stroke="#ff7ee6" strokeWidth={Math.max(1.200, s * .15)} />
      })}
    </svg>
  )
}

const RES = {
  win: { label: 'Thắng', cls: 'win', icon: <Crown /> },
  lose: { label: 'Thua', cls: 'lose', icon: <Swords /> },
  draw: { label: 'Hòa', cls: 'draw', icon: <Scale /> },
}

export default function HistoryScreen() {
  const { user, matches, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [page, setPage] = useState(1)
  const [range, setRange] = useState('all')
  const [open, setOpen] = useState(false)
  const [replay, setReplay] = useState(null)
  if (!user) return null

  const base = matches
  const days = RANGES.find((r) => r[0] === range)[2]
  const list = days ? base.filter((m) => Date.now() - new Date(m.at).getTime() <= days * 864e5) : base
  const pages = Math.max(1, Math.ceil(list.length / PER))
  const cur = Math.min(page, pages)
  const view = list.slice((cur - 1) * PER, cur * PER)
  const cnt = (r) => list.filter((m) => m.result === r).length
  const pc = (n) => (list.length ? ((n / list.length) * 100).toFixed(1) : '0.0') + '%'
  const first = Math.max(1, Math.min(cur - 1, pages - 2))
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => first + i)
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage hs-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="hs-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="hs-s">
          {/* ===== menu trái ===== */}
          {NAV.map((n, i) => {
            const on = n.k === 'history'
            return (
              <button key={n.k} type="button" className={`hs-nav ${on ? 'on' : ''}`} style={{ top: [98, 160, 209, 258, 306, 353][i] }}
                onClick={!on && n.to ? () => nav(n.to) : undefined}>
                {n.icon}<b>{n.label}</b>
              </button>
            )
          })}

          {/* ===== tiêu đề ===== */}
          <div className="hs-box hs-title">
            <NeonFrame w={285} h={62} c={24} id="hst" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.9)', 'rgba(4,8,70,.94)']} inset={4} sw={1.600} />
            <span className="hs-title-in">
              <b><Ico n="trophy" size={28} fill="#fff" sw={1.200} />Lịch sử đấu</b>
              <em>Xem lại hành trình thi đấu của bạn</em>
            </span>
          </div>

          {/* ===== bộ lọc thời gian ===== */}
          <div className="hs-filter">
            <button type="button" className="hs-filter-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              <Cal /><b>{RANGES.find((r) => r[0] === range)[1]}</b><Chev />
            </button>
            {open && (
              <ul>
                {RANGES.map(([k, label]) => (
                  <li key={k}><button type="button" className={k === range ? 'on' : ''} onClick={() => { setRange(k); setPage(1); setOpen(false) }}>{label}</button></li>
                ))}
              </ul>
            )}
          </div>

          {/* ===== bảng ===== */}
          <div className="hs-box hs-table">
            <NeonFrame w={769} h={342} c={20} id="hsp" c1="#6fc4ff" c2="#8a6bff" fill={['rgba(10,22,128,.46)', 'rgba(8,12,100,.62)']} inset={6} sw={2.200} />
          </div>
          <div className="hs-head"><span>#</span><span>Đối thủ</span><span>Kết quả</span><span>Bàn cờ</span><span>Thời gian</span><span>Thao tác</span></div>

          {view.map((m, i) => {
            const r = RES[m.result] || RES.draw
            const gi = (cur - 1) * PER + i + 1
            return (
              <div key={m.id} className={`hs-row ${i === 0 ? 'first' : ''}`} style={{ top: 172 + i * 59.5 }}>
                <b className="hs-no">#{gi}</b>
                <div className="hs-opp">
                  <span className="hs-av">{photoOf(m.opponent.avatar) ? <img src={photoOf(m.opponent.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i>{m.opponent.avatar}</i>}</span>
                  <div><b>{m.opponent.name}</b><em>Lv.{m.opponent.level}</em></div>
                </div>
                <div className={`hs-res ${r.cls}`}>
                  {r.icon}
                  <div><b>{r.label}</b><em>({m.score})</em></div>
                </div>
                <div className="hs-mini"><MiniGrid moves={m.moves} /></div>
                <div className="hs-time"><Clock /><div><span>{dmy(m.at)}</span><span>{hms(m.at)}</span></div></div>
                <div className="hs-act">
                  <button type="button" className="hs-replay" onClick={() => setReplay(m)}><Play /><b>Xem lại</b></button>
                </div>
              </div>
            )
          })}
          {view.length === 0 && <div className="hs-empty">Không có trận nào trong khoảng thời gian này.</div>}

          {/* ===== tổng kết + phân trang ===== */}
          <div className="hs-sum">
            <span><Bars />Tổng trận: <b>{list.length}</b></span>
            <span><MiniCrown />Thắng: <b>{cnt('win')} ({pc(cnt('win'))})</b></span>
            <span><Scale />Hòa: <b>{cnt('draw')} ({pc(cnt('draw'))})</b></span>
            <span><Swords />Thua: <b>{cnt('lose')} ({pc(cnt('lose'))})</b></span>
          </div>
          <div className="hs-pager">
            <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Trang trước"><Chev d="left" /></button>
            {nums.map((n) => <button key={n} type="button" className={n === cur ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>)}
            <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Trang sau"><Chev d="right" /></button>
          </div>
        </div>

        {/* ===== thanh trên + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="hs-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {replay && <Replay match={replay} onClose={() => setReplay(null)} />}
      {toast}
    </div>
  )
}
