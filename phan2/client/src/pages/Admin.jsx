import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo, Modal, Pager, useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'
import { ADMIN_ACTIVITY, ADMIN_CHART, ADMIN_MATCHES, ADMIN_PLAYERS, ADMIN_ROOMS, LEADERBOARD } from '../mock.js'

// Tài khoản admin mẫu. Khi có backend: POST /api/admin/login và kiểm tra role = ADMIN.
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin123'

export function AdminLogin() {
  const { setAdmin } = useApp()
  const nav = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()

  const submit = (e) => {
    e.preventDefault()
    if (u.trim() === ADMIN_USER && p === ADMIN_PASS) {
      setAdmin(true)
      nav('/admin')
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu admin.')
    }
  }

  return (
    <div className="bg stage">
      <div className="admin-login">
        <form className="panel" style={{ width: 'min(430px, 100%)' }} onSubmit={submit}>
          <div className="center" style={{ marginBottom: 12 }}>
            <Logo size="md" sub={false} />
            <div className="panel-title" style={{ marginTop: 10 }}>🛡 Đăng nhập Admin</div>
            <div className="muted">Quản trị hệ thống X-O Arena</div>
          </div>
          <div className="field"><span>👤</span><input value={u} onChange={(e) => setU(e.target.value)} placeholder="Tên đăng nhập admin" /></div>
          <div className="field">
            <span>🔒</span>
            <input type={show ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} placeholder="Mật khẩu" />
            <button type="button" onClick={() => setShow(!show)}>{show ? '🙈' : '👁'}</button>
          </div>
          {error && <div className="err">{error}</div>}
          <button className="btn primary block lg" type="submit">➜ Đăng nhập</button>
          <div className="divider">Hoặc</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn sm" onClick={() => nav('/login')}>‹ Quay lại</button>
            <button type="button" className="link" onClick={() => setToast('Gợi ý demo: admin / admin123')}>? Quên mật khẩu?</button>
          </div>
        </form>
      </div>
      {toast}
    </div>
  )
}

const ADMIN_NAV = [
  ['/admin', '🏠', 'Dashboard', true],
  ['/admin/players', '👥', 'Quản lý người chơi'],
  ['/admin/rooms', '🎮', 'Quản lý phòng & trận đấu'],
]

function AdminShell({ title, children }) {
  const { setAdmin } = useApp()
  const nav = useNavigate()
  const now = new Date().toLocaleString('vi-VN')
  return (
    <div className="bg stage">
      <div className="admin-wrap">
        <aside className="admin-side">
          <div className="panel me-box">
            <div className="avatar sm">🧑‍💼</div>
            <div><b>AdminXOArena 👑</b><div className="muted">Quản trị viên · <span style={{ color: 'var(--green)' }}>● Online</span></div></div>
          </div>
          <nav className="sidenav" style={{ width: '100%' }}>
            {ADMIN_NAV.map(([to, e, label, end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}><span>{e}</span>{label}</NavLink>
            ))}
            <button onClick={() => { setAdmin(false); nav('/admin/login') }}><span>🚪</span>Đăng xuất</button>
          </nav>
        </aside>
        <main className="admin-main">
          <div className="row">
            <div className="title-pill" style={{ margin: 0 }}><h1>🛡 {title}</h1></div>
            <div className="grow" />
            <span className="chip">📅 {now}</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

function LineChart({ data }) {
  const W = 640
  const H = 220
  const pad = 36
  const all = [...data.players, ...data.matches]
  const max = Math.max(...all) * 1.1
  const n = data.players.length
  const x = (i) => pad + (i * (W - pad * 2)) / (n - 1)
  const y = (v) => H - pad - (v / max) * (H - pad * 2)
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((max * t) / 1000) * 1000)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Thống kê người chơi và trận đấu">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad} x2={W - pad} y1={y(t)} y2={y(t)} stroke="rgba(120,140,255,.25)" />
          <text x={pad - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#9aa6d6">{t / 1000}k</text>
        </g>
      ))}
      <path d={path(data.players)} fill="none" stroke="#35b8ff" strokeWidth="2.5" />
      <path d={path(data.matches)} fill="none" stroke="#c04bff" strokeWidth="2.5" />
      {data.players.map((v, i) => <circle key={'p' + i} cx={x(i)} cy={y(v)} r="3.5" fill="#35b8ff" />)}
      {data.matches.map((v, i) => <circle key={'m' + i} cx={x(i)} cy={y(v)} r="3.5" fill="#c04bff" />)}
    </svg>
  )
}

export function AdminDashboard() {
  const [range, setRange] = useState(30)
  const [tab, setTab] = useState('week')
  const top = LEADERBOARD.slice(0, 5).map((p, i) => ({ ...p, pts: p.score - (tab === 'week' ? 0 : tab === 'month' ? 1500 : -4000) - i * 5 }))
  return (
    <AdminShell title="Dashboard Admin">
      <div className="kpis">
        <div className="panel kpi"><span className="e">👥</span><div><span className="muted">Tổng người chơi</span><b>48.320</b><span className="up">↑ 12.5%</span></div></div>
        <div className="panel pink kpi"><span className="e">⚔</span><div><span className="muted">Tổng trận đấu</span><b>125.680</b><span className="up">↑ 15.3%</span></div></div>
        <div className="panel gold kpi"><span className="e">🏆</span><div><span className="muted">Tỷ lệ thắng</span><b>62.7%</b><span className="up">↑ 2.1%</span></div></div>
        <div className="panel kpi"><span className="e">📶</span><div><span className="muted">Người đang online</span><b>5.248 <span style={{ color: 'var(--green)', fontSize: '1rem' }}>●</span></b></div></div>
      </div>
      <div className="dash-grid">
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <b>📊 Thống kê hoạt động</b>
            <div className="tabs">{[7, 30, 90].map((r) => <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r} ngày</button>)}</div>
          </div>
          <LineChart data={ADMIN_CHART[range]} />
          <div className="row" style={{ justifyContent: 'center', gap: 20 }}>
            <span><span style={{ color: '#35b8ff' }}>●</span> Người chơi</span>
            <span><span style={{ color: '#c04bff' }}>●</span> Trận đấu</span>
          </div>
        </div>
        <div className="panel">
          <b>🏆 Top người chơi</b>
          <div className="tabs" style={{ margin: '8px 0' }}>
            {[['week', 'Tuần này'], ['month', 'Tháng này'], ['all', 'Tất cả']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {top.map((p, i) => (
            <div className="act" key={p.name} style={{ alignItems: 'center' }}>
              <b style={{ width: 22 }}>{i + 1}</b><span className="grow">{p.avatar} {p.name}</span><b style={{ color: 'var(--gold)' }}>⭐ {p.pts.toLocaleString('vi-VN')}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="panel">
          <b>⬆ Trạng thái hệ thống</b>
          <div className="row" style={{ marginTop: 10, gap: 18, flexWrap: 'wrap' }}>
            <div className="panel" style={{ color: 'var(--green)', fontWeight: 800 }}>✔ Hoạt động ổn định</div>
            <div className="muted">⏱ Thời gian hoạt động: 7 ngày 14 giờ 32 phút<br />🖥 Máy chủ: Online 3 / 3</div>
          </div>
        </div>
        <div className="panel">
          <b>📄 Hoạt động gần đây</b>
          {ADMIN_ACTIVITY.map((a) => (
            <div className="act" key={a.t}><span className="dot" style={{ background: a.c }} /><span className="muted">{a.t}</span><span>{a.text}</span></div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}

export function AdminPlayers() {
  const [list, setList] = useState(ADMIN_PLAYERS)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [picked, setPicked] = useState(new Set())
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useToast()
  const per = 6

  const filtered = useMemo(() => list.filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || String(p.id).includes(q)) && (status === 'Tất cả' || p.status === status)), [list, q, status])
  const pages = Math.max(1, Math.ceil(filtered.length / per))
  const cur = Math.min(page, pages)
  const view = filtered.slice((cur - 1) * per, cur * per)

  const toggle = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const lock = (id) => setList((l) => l.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p)))
  const del = () => {
    if (!picked.size) return setToast('Chưa chọn người chơi nào')
    if (!window.confirm(`Xóa ${picked.size} người chơi đã chọn?`)) return
    setList((l) => l.filter((p) => !picked.has(p.id)))
    setPicked(new Set())
  }

  return (
    <AdminShell title="Quản lý người chơi">
      <div className="panel search">
        <div className="field"><span>🔍</span><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Tìm người chơi (tên hoặc ID)..." /></div>
        <span className="muted">Trạng thái:</span>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {['Tất cả', 'Đang chơi', 'Offline'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn primary" onClick={() => { setQ(''); setStatus('Tất cả'); setPage(1); setToast('Đã làm mới') }}>⟳ Làm mới</button>
      </div>
      <div className="panel">
        <table className="table">
          <thead><tr><th></th><th>#</th><th>Avatar</th><th>Tên người chơi</th><th>ID</th><th>Trạng thái</th><th>Tham gia từ</th><th>Tổng trận</th><th>Thắng</th><th>Thua</th><th>Thao tác</th></tr></thead>
          <tbody>
            {view.map((p, i) => (
              <tr key={p.id} style={p.locked ? { opacity: 0.55 } : undefined}>
                <td><input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td>{(cur - 1) * per + i + 1}</td>
                <td>{p.avatar}</td>
                <td className="left"><b>{p.name}</b> {p.locked && <span className="tag red">Đã khóa</span>}</td>
                <td>#{p.id}</td>
                <td><span className={`tag ${p.status === 'Offline' ? 'gray' : 'green'}`}>{p.status}</span></td>
                <td>{p.joined}</td><td>{p.total}</td><td className="win">{p.wins}</td><td className="lose">{p.losses}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
                    <button className="btn sm primary" title="Xem" onClick={() => setDetail(p)}>👁</button>
                    <button className="btn sm danger" title={p.locked ? 'Mở khóa' : 'Khóa'} onClick={() => lock(p.id)}>{p.locked ? '🔓' : '🔒'}</button>
                  </div>
                </td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan="11">Không tìm thấy người chơi.</td></tr>}
          </tbody>
        </table>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span className="chip">👥 Tổng số người chơi: {filtered.length}</span>
          <Pager page={cur} pages={pages} onChange={setPage} />
          <button className="btn danger" onClick={del}>🗑 Xóa người chơi đã chọn ({picked.size})</button>
        </div>
      </div>
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="panel-title">👤 {detail.name}</div>
          <div style={{ lineHeight: 2 }}>
            <div>ID: <b>#{detail.id}</b></div><div>Trạng thái: <b>{detail.status}</b></div><div>Tham gia từ: <b>{detail.joined}</b></div>
            <div>Tổng trận: <b>{detail.total}</b> · Thắng: <b className="win">{detail.wins}</b> · Thua: <b className="lose">{detail.losses}</b></div>
          </div>
          <button className="btn block" style={{ marginTop: 12 }} onClick={() => setDetail(null)}>Đóng</button>
        </Modal>
      )}
      {toast}
    </AdminShell>
  )
}

export function AdminRooms() {
  const [rooms, setRooms] = useState(ADMIN_ROOMS)
  const [filter, setFilter] = useState('Tất cả')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(ADMIN_ROOMS[0])
  const [toast, setToast] = useToast()
  const view = rooms.filter((r) => (filter === 'Tất cả' || r.status === filter) && (!q || r.name.toLowerCase().includes(q.toLowerCase())))

  const close = (r) => {
    if (!window.confirm(`Đóng ${r.name}? Người chơi trong phòng sẽ bị đưa ra.`)) return
    // TODO: socket/REST: admin đóng phòng
    setRooms((l) => l.map((x) => (x.id === r.id ? { ...x, status: 'Đã kết thúc' } : x)))
    setToast('Đã đóng phòng')
  }

  const tagCls = (s) => (s === 'Đang chơi' ? 'green' : s === 'Đang chờ' ? '' : 'purple')

  return (
    <AdminShell title="Quản lý phòng và trận đấu">
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <b>🏠 Danh sách phòng</b>
          <div className="tabs">{['Tất cả', 'Đang chờ', 'Đang chơi', 'Đã kết thúc'].map((f) => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
          <div className="field" style={{ margin: 0, height: 38, maxWidth: 220 }}><span>🔍</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm phòng..." /></div>
        </div>
        <table className="table">
          <thead><tr><th>#</th><th>Tên phòng</th><th>Chế độ</th><th>Trạng thái</th><th>Số người</th><th>Thời gian tạo</th><th>Hành động</th></tr></thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="click" onClick={() => setSel(r)}>
                <td>{r.id}</td><td className="left">{r.name}</td><td>{r.mode}</td>
                <td><span className={`tag ${tagCls(r.status)}`}>{r.status}</span></td>
                <td>{r.players}</td><td>{r.at}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
                    <button className="btn sm primary" onClick={() => setSel(r)}>👁</button>
                    <button className="btn sm danger" disabled={r.status === 'Đã kết thúc'} onClick={() => close(r)}>⛔</button>
                  </div>
                </td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan="7">Không có phòng phù hợp.</td></tr>}
          </tbody>
        </table>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn sm" onClick={() => { setRooms(ADMIN_ROOMS); setToast('Đã làm mới') }}>⟳ Làm mới</button>
          <span className="muted">Tổng: {view.length} phòng</span>
        </div>
      </div>
      <div className="dash-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="panel">
          <b>⚔ Danh sách trận đấu gần đây</b>
          <table className="table">
            <thead><tr><th>#</th><th>Phòng</th><th>Người chơi 1</th><th>Người chơi 2</th><th>Kết quả</th><th>Thời gian</th></tr></thead>
            <tbody>
              {ADMIN_MATCHES.map((m, i) => (
                <tr key={i}><td>{i + 1}</td><td className="left">{m.room}</td><td>{m.p1}</td><td>{m.p2}</td>
                  <td className={m.result === 'Thắng' ? 'win' : m.result === 'Thua' ? 'lose' : 'draw'}>{m.result}</td><td>{m.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel gold">
          <b>ℹ Chi tiết phòng</b>
          {sel ? (
            <div style={{ lineHeight: 2, marginTop: 8 }}>
              <div className="center"><span style={{ fontSize: '2.4rem' }}>🛡</span><div><b>{sel.name}</b></div></div>
              <div>🎮 Chế độ: <b>{sel.mode}</b></div>
              <div>👥 Số người: <b>{sel.players}</b></div>
              <div>🕒 Thời gian tạo: <b>{sel.at}</b></div>
              <div>👑 Trạng thái: <span className={`tag ${tagCls(sel.status)}`}>{sel.status}</span></div>
            </div>
          ) : <div className="muted">Chọn một phòng để xem chi tiết.</div>}
        </div>
      </div>
      {toast}
    </AdminShell>
  )
}
