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

/* Màn hình 15 – Cài đặt
   Dựng hoàn toàn bằng code (SVG + CSS), không dùng ảnh thiết kế làm nền hay phủ lên.
   Stage 1280x720 tự thu phóng; nội dung (.sx-s) theo toạ độ ảnh mẫu 962x542 (phóng 1.33056 lần).
   Giá trị chỉnh ở đây là bản nháp (draft), chỉ ghi vào store khi bấm "Lưu cài đặt". */

/* ---------- icon (nét trắng, dùng chung cho tiêu đề + từng dòng) ---------- */
const S = ({ children, size = 24, fill = 'none', sw = 1.900 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
)
const IGamepad = () => (
  <S size={30} fill="currentColor" sw={1}>
    <path d="M7.200 6.500h9.600a5.200 5.200 0 0 1 5 4.300l.9 5a2.800 2.800 0 0 1-4.800 2.300L15 15.800H9l-2.900 2.300A2.800 2.800 0 0 1 1.300 15.800l.9-5a5.200 5.200 0 0 1 5-4.300z" />
    <path d="M7.500 9.800v4M5.500 11.800h4" stroke="#0c1470" strokeWidth="1.700" /><circle cx="15.500" cy="10.800" r="1" fill="#0c1470" stroke="none" /><circle cx="18" cy="12.800" r="1" fill="#0c1470" stroke="none" />
  </S>
)
const ISpeaker = () => (<S fill="currentColor" sw={1.600}><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.500 8.500a5 5 0 0 1 0 7M18.600 5.600a9 9 0 0 1 0 12.800" fill="none" /></S>)
const IMusic = () => (<S sw={2}><path d="M9 18V5.500l11-2V16" /><circle cx="6" cy="18" r="3" fill="currentColor" /><circle cx="17" cy="16" r="3" fill="currentColor" /></S>)
const IMonitor = () => (<S sw={2}><rect x="2" y="3.500" width="20" height="13.500" rx="2" /><path d="M8 21h8M12 17v4M5.500 13l3.500-3.500 3 3 2.500-2.500 3 3" /></S>)
const IGrid = () => (<S sw={2}><rect x="3.500" y="3.500" width="7" height="7" rx="1.500" /><rect x="13.500" y="3.500" width="7" height="7" rx="1.500" /><rect x="3.500" y="13.500" width="7" height="7" rx="1.500" /><rect x="13.500" y="13.500" width="7" height="7" rx="1.500" /></S>)
const IDiamond = () => (<S sw={1.800}><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M9 3L7 9l5 12 5-12-2-6" /></S>)
const IExpand = () => (<S sw={2.200}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></S>)
const ISparkle = () => (<S fill="currentColor" sw={1.200}><path d="M11 2l2.400 7.600L21 12l-7.600 2.400L11 22l-2.400-7.600L1 12l7.600-2.400z" transform="translate(1 0) scale(.9)" /><path d="M19 2l.9 2.600L22.500 5.500l-2.600.9L19 9l-.9-2.600-2.600-.9 2.600-.9z" /></S>)
const IShield = () => (<S size={30} fill="currentColor" sw={1.200}><path d="M12 2l8 3v6c0 5-3.500 9-8 11-4.500-2-8-6-8-11V5z" /><path d="M8.300 12l2.600 2.700 4.800-5.400" stroke="#0c1470" strokeWidth="2.300" fill="none" /></S>)
const IInfo = () => (<S size={28} sw={2.200}><circle cx="12" cy="12" r="9.500" /><path d="M12 11v6" strokeWidth="2.800" /><circle cx="12" cy="7.400" r=".6" fill="currentColor" strokeWidth="1.800" /></S>)
const ICube = () => (<S sw={1.900}><path d="M12 2.200l8.800 4.900v9.800L12 21.800l-8.800-4.900V7.100z" /><path d="M3.200 7.100L12 12l8.800-4.900M12 12v9.800" /></S>)
const IMail = () => (<S fill="currentColor" sw={1.500}><rect x="2" y="4.500" width="20" height="15" rx="2.200" /><path d="M2.800 6.500L12 13l9.200-6.500" stroke="#0c1470" strokeWidth="1.700" fill="none" /></S>)
const IDoc = () => (<S sw={1.900}><path d="M6 2.500h8.500L19.500 7.500V21.500H6z" /><path d="M14 2.800V8h5.200M9.200 12.200h6.600M9.200 15.800h6.600M9.200 8.600h2.600" /></S>)
const ICheck = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.500l5.500 5.500L20 6.500" /></svg>)
const IChevR = () => (<svg width="13" height="16" viewBox="0 0 13 18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 2l7 7-7 7" /></svg>)
const IDrop = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 9l7 7 7-7" /></svg>)

/* ---------- ô điều khiển ---------- */
const Toggle = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`sx-toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
)

function Slide({ value, onChange, label }) {
  return (
    <input className="sx-range" type="range" min="0" max="100" value={value} aria-label={label}
      style={{ '--v': value + '%' }} onChange={(e) => onChange(+e.target.value)} />
  )
}

function Select({ value, onChange, options, label }) {
  return (
    <label className="sx-select">
      <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <IDrop />
    </label>
  )
}

const Panel = ({ cls, w, h, id, icon, title, children }) => (
  <section className={`sx-panel ${cls}`} style={{ width: w, height: h }}>
    <NeonFrame w={w} h={h} c={16} id={id} c1="#6fc4ff" c2="#8a6bff" fill={['rgba(12,24,136,.55)', 'rgba(8,12,104,.72)']} inset={5} sw={2} />
    <div className="sx-head">{icon}<b>{title}</b></div>
    <i className="sx-line" />
    {children}
  </section>
)

const Row = ({ y, icon, label, children }) => (
  <div className="sx-row" style={{ top: y }}>
    <span className="sx-ico">{icon}</span>
    <span className="sx-label">{label}</span>
    {children}
  </div>
)

const NAV_TOPS = [96, 155, 202, 250, 298, 347]

export default function SettingsScreen() {
  const { user, settings, setSettings, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [d, setD] = useState(settings)
  if (!user) return null

  const set = (k) => (v) => setD((o) => ({ ...o, [k]: v }))
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }
  const save = () => { setSettings(d); setToast('Đã lưu cài đặt') }

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage sx-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="sx-bg"><Backdrop /></div>
        {PETALS.slice(0, 12).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="sx-s">
          {/* ===== menu trái ===== */}
          {NAV.map((n, i) => {
            const on = n.k === 'settings'
            return (
              <button key={n.k} type="button" className={`sx-nav ${on ? 'on' : ''} ${n.k === 'back' ? 'back' : ''}`} style={{ top: NAV_TOPS[i] }}
                onClick={!on && n.to ? () => nav(n.to) : undefined}>
                <NeonFrame w={143} h={39} c={9} id={`sxn${i}`} inset={3} sw={on ? 1.800 : 1.400}
                  c1={on ? '#ff9af5' : '#78b4ff'} c2={on ? '#c05cff' : '#5a7cff'}
                  fill={on ? ['rgba(92,34,200,.95)', 'rgba(44,16,140,.97)'] : ['rgba(16,28,140,.9)', 'rgba(8,12,96,.94)']} />
                <span className="sx-nav-in">{NAV_ICON[n.k] || n.icon}<b>{n.label}</b></span>
              </button>
            )
          })}

          {/* ===== tiêu đề ===== */}
          <div className="sx-title">
            <NeonFrame w={269} h={47} c={18} id="sxt" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.92)', 'rgba(4,8,70,.95)']} inset={4} sw={1.600} />
            <span className="sx-title-in">
              <b><Ico n="gear" size={27} fill="#fff" sw={1.200} />Cài đặt</b>
              <em>Tùy chỉnh trải nghiệm của bạn</em>
            </span>
          </div>

          {/* ===== Cài đặt trò chơi ===== */}
          <Panel cls="tl" id="sxp1" w={392} h={193} icon={<IGamepad />} title="Cài đặt trò chơi">
            <Row y={58} icon={<ISpeaker />} label="Âm thanh hiệu ứng"><Slide value={d.sfx} onChange={set('sfx')} label="Âm thanh hiệu ứng" /><em className="sx-val">{d.sfx}%</em></Row>
            <Row y={92} icon={<IMusic />} label="Âm nhạc nền"><Slide value={d.music} onChange={set('music')} label="Âm nhạc nền" /><em className="sx-val">{d.music}%</em></Row>
            <Row y={127} icon={<IMonitor />} label="Hiệu ứng hình ảnh"><Slide value={d.fx} onChange={set('fx')} label="Hiệu ứng hình ảnh" /><em className="sx-val">{d.fx}%</em></Row>
            <Row y={160} icon={<IGrid />} label="Chế độ chơi">
              <div className="sx-modes" role="radiogroup" aria-label="Chế độ chơi">
                <button type="button" role="radio" aria-checked={d.mode === 'classic'} className={d.mode === 'classic' ? 'on' : ''} onClick={() => set('mode')('classic')}><i />Cổ điển</button>
                <button type="button" role="radio" aria-checked={d.mode === 'adv'} className={d.mode === 'adv' ? 'on' : ''} onClick={() => set('mode')('adv')}><i />Nâng cao</button>
              </div>
            </Row>
          </Panel>

          {/* ===== Cài đặt hiển thị ===== */}
          <Panel cls="tr" id="sxp2" w={374} h={193} icon={<Ico n="globe" size={28} sw={2} />} title="Cài đặt hiển thị">
            <Row y={59} icon={<IMonitor />} label="Độ phân giải"><Select value={d.res} onChange={set('res')} options={['1280 x 720', '1600 x 900', '1920 x 1080']} label="Độ phân giải" /></Row>
            <Row y={96} icon={<IDiamond />} label="Chất lượng đồ họa"><Select value={d.quality} onChange={set('quality')} options={['Thấp', 'Trung bình', 'Cao']} label="Chất lượng đồ họa" /></Row>
            <Row y={131} icon={<IExpand />} label="Chế độ toàn màn hình"><Toggle on={d.fullscreen} onChange={set('fullscreen')} label="Chế độ toàn màn hình" /></Row>
            <Row y={165} icon={<ISparkle />} label="Hiệu ứng mờ chuyển cảnh"><Toggle on={d.blur} onChange={set('blur')} label="Hiệu ứng mờ chuyển cảnh" /></Row>
          </Panel>

          {/* ===== Cài đặt tài khoản ===== */}
          <Panel cls="bl" id="sxp3" w={392} h={151} icon={<IShield />} title="Cài đặt tài khoản">
            <Row y={54} icon={<Ico n="user" size={24} fill="currentColor" sw={1.500} />} label="Hiển thị thông tin công khai"><Toggle on={d.publicInfo} onChange={set('publicInfo')} label="Hiển thị thông tin công khai" /></Row>
            <Row y={85} icon={<Ico n="bell" size={24} fill="currentColor" sw={1.500} />} label="Cho phép nhận thông báo"><Toggle on={d.notify} onChange={set('notify')} label="Cho phép nhận thông báo" /></Row>
            <Row y={121} icon={<Ico n="lock" size={24} fill="currentColor" sw={1.700} />} label="Đổi mật khẩu">
              <button type="button" className="sx-btn pw" onClick={soon('Đổi mật khẩu')}><b>Đổi mật khẩu</b><IChevR /></button>
            </Row>
          </Panel>

          {/* ===== Thông tin & Hỗ trợ ===== */}
          <Panel cls="br" id="sxp4" w={374} h={151} icon={<IInfo />} title="Thông tin & Hỗ trợ">
            <Row y={54} icon={<ICube />} label="Phiên bản game"><em className="sx-ver">v1.0.0</em></Row>
            <Row y={86} icon={<IMail />} label="Liên hệ hỗ trợ">
              <button type="button" className="sx-btn sm" onClick={soon('Gửi hỗ trợ')}><b>Gửi hỗ trợ</b><IChevR /></button>
            </Row>
            <Row y={122} icon={<IDoc />} label="Điều khoản sử dụng">
              <button type="button" className="sx-btn sm" onClick={soon('Điều khoản sử dụng')}><b>Xem chi tiết</b><IChevR /></button>
            </Row>
          </Panel>

          {/* ===== lưu ===== */}
          <button type="button" className="sx-save" onClick={save}>
            <NeonFrame w={218} h={41} c={12} id="sxs" inset={3} sw={1.800} c1="#ff9af5" c2="#b060ff" fill={['rgba(100,40,214,.95)', 'rgba(48,18,150,.97)']} />
            <span className="sx-save-in"><ICheck /><b>Lưu cài đặt</b></span>
          </button>
        </div>

        {/* ===== thanh trên + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => {}} onLogout={doLogout} />
        <img className="sx-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {toast}
    </div>
  )
}
