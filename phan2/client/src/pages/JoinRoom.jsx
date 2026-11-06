import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { call } from '../lib/socket.js'
import { useApp } from '../store.jsx'
import { Crown, Ico, PETALS, TopHud, useFit } from '../components/hud.jsx'
import { ROOMS } from '../mock.js'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'

/* Màn hình 08 – Tham gia phòng
   Stage 1280x720 tự thu phóng theo cửa sổ. Phần nội dung (.jr-s) dựng theo toạ độ của ảnh thiết kế 954x537
   rồi phóng 1.3417 lần, nên mọi số trong join.css khớp 1:1 với ảnh mẫu. */

const PER_PAGE = 8
const ONLINE = 245

/* ---------- icon riêng ---------- */
const PeopleFill = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 26 24" fill="currentColor" aria-hidden>
    <circle cx="9.500" cy="7" r="4.500" /><path d="M1 22c0-5 3.800-8 8.500-8s8.500 3 8.500 8z" />
    <circle cx="19.500" cy="9" r="3.200" /><path d="M18.500 14.500c4 .2 7 2.300 7 7.500h-5c0-3-.8-5.500-2-7.500z" />
  </svg>
)

const Crowd = () => (
  <svg width="36" height="27" viewBox="0 0 36 27" aria-hidden>
    <g fill="#a9c8ff"><circle cx="8" cy="9" r="4.200" /><path d="M0 24c0-5 3.500-8 8-8 1.800 0 3.400.5 4.600 1.400-2 1.600-3.200 3.800-3.400 6.600z" /><circle cx="28" cy="9" r="4.200" /><path d="M36 24c0-5-3.500-8-8-8-1.800 0-3.400.5-4.600 1.400 2 1.600 3.200 3.800 3.400 6.600z" /></g>
    <g fill="#fff"><circle cx="18" cy="7.500" r="5.500" /><path d="M7.500 26c0-6 4.500-9.500 10.500-9.500S28.500 20 28.500 26z" /></g>
  </svg>
)

const Keyboard = () => (
  <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden>
    <defs><linearGradient id="jrkb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#74b6ff" /><stop offset="1" stopColor="#4a86f4" /></linearGradient></defs>
    <rect x="1" y="2" width="28" height="20" rx="4.500" fill="url(#jrkb)" />
    <g fill="#e4f2ff">
      {[5, 9.600, 14.200, 18.800, 23.400].map((x) => <rect key={'a' + x} x={x - 1} y="6" width="2.600" height="3" rx=".6" />)}
      {[5, 9.600, 14.200, 18.800, 23.400].map((x) => <rect key={'b' + x} x={x - 1} y="11" width="2.600" height="3" rx=".6" />)}
      <rect x="8" y="16" width="14" height="3" rx=".8" />
    </g>
  </svg>
)

const Trophy = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
    <defs><linearGradient id="jrtr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0a0" /><stop offset=".55" stopColor="#ffc533" /><stop offset="1" stopColor="#f08a0c" /></linearGradient></defs>
    <g fill="url(#jrtr)" stroke="#fff4c4" strokeWidth=".8" strokeLinejoin="round">
      <path d="M6.500 2.500h11v6.300a5.500 5.500 0 0 1-11 0z" />
      <path d="M6.500 4H3.200v1.600c0 2.200 1.500 3.700 3.600 4M17.500 4h3.300v1.600c0 2.200-1.500 3.700-3.600 4" fill="none" strokeWidth="1.700" stroke="#ffd04a" />
      <path d="M10.500 14h3v3.200h-3z" /><path d="M7.500 17.200h9l1 3.800h-11z" />
    </g>
  </svg>
)

const Swords = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeLinecap="round" aria-hidden>
    <path d="M5 4.500l14 14M19 4.500l-14 14" strokeWidth="3.200" />
    <path d="M3 15.500l5.500 5.500M21 15.500L15.500 21" strokeWidth="2.600" />
  </svg>
)

const Refresh = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 4v6h-6" /><path d="M3 20v-6h6" />
    <path d="M3.600 9.500A8.500 8.500 0 0 1 18.400 6.200L21 10" /><path d="M3 14l2.600 3.800A8.500 8.500 0 0 0 20.400 14.500" />
  </svg>
)

const Dbl = ({ dir = 'r', size = 17 }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 30 26" fill="none" stroke="currentColor" strokeWidth="4.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    style={dir === 'l' ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M4 3l10 10L4 23M16 3l10 10-10 10" />
  </svg>
)

/* Khung vát vẽ bằng SVG để viền phát sáng đúng như ảnh mẫu */
function Frame({ w, h, pts, id, c1, c2, fill, className = '', strokeW = 1.6 }) {
  const d = pts.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg className={`jr-frame ${className}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={fill[0]} /><stop offset="1" stopColor={fill[1]} /></linearGradient>
      </defs>
      <polygon points={d} fill={`url(#${id}f)`} stroke={`url(#${id})`} strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  )
}

const HEAD_PTS = [[20, 7], [264, 7], [280, 40], [264, 74], [20, 74], [4, 40]]
const BODY_PTS = [[1, 1], [282, 1], [282, 331], [271, 342], [12, 342], [1, 331]]
const BODY_IN = [[7, 80], [276, 80], [276, 326], [267, 336], [16, 336], [7, 326]]
const LIST_PTS = [[10, 0], [347, 0], [357, 10], [357, 309], [347, 319], [10, 319], [0, 309], [0, 10]]

export default function JoinRoom() {
  const nav = useNavigate()
  const { user, logout } = useApp()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [code, setCode] = useState('')
  const [page, setPage] = useState(1)
  const [rooms, setRooms] = useState(ROOMS)

  const pages = Math.max(1, Math.ceil(rooms.length / PER_PAGE))
  const view = useMemo(() => rooms.slice((page - 1) * PER_PAGE, page * PER_PAGE), [rooms, page])

  if (!user) return null
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }

  const join = async () => {
    const c = code.trim().toUpperCase()
    if (c.length < 4) return setToast('Mã phòng không hợp lệ')
    const res = await call('room:join', { code: c, user: { name: user.name, level: user.level, avatar: user.avatar } })
    if (!res.ok) return setToast(res.error)
    nav(`/game/${res.code}`)
  }
  const refresh = () => {
    setRooms([...ROOMS].sort(() => Math.random() - 0.5))
    setPage(1)
    setToast('Đã làm mới danh sách')
  }
  const go = (p) => setPage(Math.min(pages, Math.max(1, p)))

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="jr-bg" />
        {PETALS.slice(0, 10).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="jr-s">
          {/* ===== nhân vật + banner ===== */}
          <img className="jr-girl" src="/img/join-girl.webp" alt="" draggable={false} />
          <div className="jr-banner">
            <span className="jr-banner-crown"><Crown w={26} h={21} /></span>
            <div><b>Tham gia phòng ngay</b><i>Cùng bạn bè chiến đấu!</i></div>
          </div>

          {/* ===== bảng nhập mã ===== */}
          <section className="jr-join">
            <Frame w={283} h={343} pts={BODY_PTS} id="jrb" c1="#58c0ff" c2="#3a60ff" fill={['rgba(14,30,168,.94)', 'rgba(18,44,196,.92)']} className="jr-fb" strokeW={2} />
            <Frame w={283} h={343} pts={BODY_IN} id="jrbi" c1="#5aa8ff" c2="#4a6cff" fill={['rgba(0,0,0,0)', 'rgba(0,0,0,0)']} className="jr-fbi" strokeW={0.8} />
            <Frame w={283} h={343} pts={HEAD_PTS} id="jrh" c1="#6cc2ff" c2="#4a6cff" fill={['rgba(10,18,104,.97)', 'rgba(8,14,88,.98)']} className="jr-fh" strokeW={1.8} />

            <svg className="jr-corners" width="283" height="343" viewBox="0 0 283 343" fill="none" stroke="#cfeaff" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 316v14l10 10h20" /><path d="M280 316v14l-10 10h-20" />
              <path d="M3 84v14M280 84v14" strokeWidth="1.800" />
            </svg>
            <div className="jr-hico"><Crowd /></div>
            <h1 className="jr-htitle">Tham gia phòng</h1>
            <p className="jr-hsub">Nhập mã phòng để tham gia trận đấu</p>

            <label className="jr-field">
              <span className="jr-kb"><Keyboard /></span>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Nhập mã phòng..." maxLength={8}
                spellCheck={false} autoComplete="off" onKeyDown={(e) => e.key === 'Enter' && join()} />
              <button type="button" className="jr-x" onClick={(e) => { e.preventDefault(); setCode('') }} aria-label="Xoá mã">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M2.500 2.500l11 11M13.500 2.500l-11 11" /></svg>
              </button>
            </label>

            <div className="jr-go-wrap">
              <button type="button" className="jr-go" onClick={join}>
                <span className="jr-go-in"><Dbl size={25} /><b>Tham gia</b></span>
              </button>
            </div>

            <div className="jr-or"><i /><span>hoặc</span><i /></div>

            <button type="button" className="jr-refresh" onClick={refresh}><Refresh /><b>Làm mới danh sách</b></button>
          </section>

          {/* ===== danh sách phòng ===== */}
          <section className="jr-list">
            <Frame w={357} h={319} pts={LIST_PTS} id="jrl" c1="#7ec0ff" c2="#ff5fd0" fill={['rgba(14,24,132,.95)', 'rgba(10,18,110,.96)']} className="jr-fl" strokeW={1.5} />
            <div className="jr-lh"><Trophy /><b>Danh sách phòng</b></div>
            <div className="jr-on"><i /><span>Trực tuyến: <em>{ONLINE}</em></span></div>
            <div className="jr-lline" />

            <div className="jr-cols">
              <span className="c0">#</span><span className="c1">Tên phòng</span><span className="c2">Chế độ</span><span className="c3">Số người</span><span className="c4">Trạng thái</span>
            </div>

            <div className="jr-rows">
              {view.map((r, i) => (
                <button type="button" key={r.id + r.code} className={`jr-row ${code === r.code ? 'sel' : ''}`} style={{ top: i * 26.1 }}
                  onClick={() => setCode(r.code)}>
                  <span className="c0"><u>{r.id}</u></span>
                  <span className="c1">{r.name}</span>
                  <span className="c2"><Swords />{r.mode}</span>
                  <span className="c3">{r.players}/2</span>
                  <span className="c4"><em className={r.status === 'Bắt đầu' ? 'play' : 'wait'}>{r.status}</em></span>
                </button>
              ))}
            </div>

            <div className="jr-pager">
              <button type="button" className="pv" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước"><Dbl dir="l" size={17} /></button>
              <span className="pn">{page} / {pages}</span>
              <button type="button" className="nx" onClick={() => go(page + 1)} disabled={page >= pages} aria-label="Trang sau"><Dbl size={17} /></button>
            </div>
          </section>

          {/* ===== thanh dưới ===== */}
          <button type="button" className="jr-back" onClick={() => nav('/home')}>
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" stroke="currentColor" strokeWidth="3.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 2L4 8l6 6" /></svg>
            <b>Quay lại</b>
          </button>
          <button type="button" className="jr-notice" onClick={soon('Thông báo')}>
            <Ico n="megaphone" size={19} fill="#ffc83a" sw={1.5} />
            <span><b>Thông báo:</b> Chào mừng đến với X-O Arena!</span>
          </button>

          <svg className="jr-swoosh" viewBox="0 0 200 40" aria-hidden>
            <defs>
              <linearGradient id="jrsw" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#b04bff" stopOpacity="0" /><stop offset=".35" stopColor="#c26bff" /><stop offset=".75" stopColor="#ff9cf0" /><stop offset="1" stopColor="#ffe3fb" /></linearGradient>
            </defs>
            <path d="M4 36C60 16 130 8 196 12C140 14 80 24 4 36z" fill="url(#jrsw)" />
          </svg>
          <div className="jr-tag">Kết nối - Tham gia - Chiến thắng!</div>
        </div>

        {/* ===== thanh trên (dữ liệu người chơi thật) + logo ===== */}
        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="jr-logo" src="/img/join-logo.png" alt="X-O Arena" />
      </div>
      {toast}
    </div>
  )
}
