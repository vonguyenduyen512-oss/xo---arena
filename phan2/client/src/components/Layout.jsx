import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export function Logo({ size = 'md', sub = true }) {
  return (
    <div>
      <div className={`logo ${size}`}>X-<span className="o">O</span><br />ARENA</div>
      {sub && <div className="logo-sub">✦ Caro Trực Tuyến ✦</div>}
    </div>
  )
}

export function Mascots() {
  return (
    <div className="mascots">
      <span className="l">🧑‍🎤</span>
      <span className="r">👩‍🎤</span>
    </div>
  )
}

export function TopBar() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  if (!user) return null
  const pct = Math.round((user.exp / user.expMax) * 100)
  return (
    <header className="topbar">
      <Link to="/profile" className="me">
        <div className="avatar sm">{user.avatar}</div>
        <div>
          <b>{user.name}</b> 👑
          <div className="muted">Lv.{user.level} · {user.exp}/{user.expMax}</div>
          <div className="xp"><i style={{ width: pct + '%' }} /></div>
        </div>
      </Link>
      <div className="currency">
        <span className="chip">🪙 {user.coins.toLocaleString('vi-VN')}</span>
        <span className="chip">💎 {user.gems}</span>
      </div>
      <div className="icons">
        <Link to="/settings" className="icon-btn" title="Cài đặt">⚙</Link>
        <button className="icon-btn" title="Đăng xuất" onClick={() => { logout(); nav('/login') }}>⏻</button>
      </div>
    </header>
  )
}

const NAV = [
  ['/home', '🏠', 'Trang chủ'],
  ['/profile', '👤', 'Hồ sơ'],
  ['/history', '🏆', 'Lịch sử đấu'],
  ['/leaderboard', '📊', 'Bảng xếp hạng'],
  ['/settings', '⚙️', 'Cài đặt'],
  ['/how-to-play', '📖', 'Hướng dẫn'],
]

export function SideNav({ items = NAV }) {
  return (
    <nav className="sidenav">
      {items.map(([to, e, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span>{e}</span>{label}
        </NavLink>
      ))}
    </nav>
  )
}

// Khung chuẩn cho các màn hình đã đăng nhập
export function Screen({ title, subtitle, side = true, back, children }) {
  const nav = useNavigate()
  return (
    <div className="bg stage">
      <TopBar />
      {(title || back) && (
        <div className="row" style={{ padding: '0 20px 10px' }}>
          {back !== false && <button className="btn sm" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>‹ Quay lại</button>}
          <div className="grow" />
          {title && <div className="title-pill"><h1>{title}</h1>{subtitle && <small>{subtitle}</small>}</div>}
          <div className="grow" />
          <div style={{ width: 90 }} />
        </div>
      )}
      <div className="body">
        {side && <SideNav />}
        <div className="main">{children}</div>
      </div>
    </div>
  )
}

export function Pager({ page, pages, onChange }) {
  const nums = []
  const start = Math.max(1, Math.min(page - 1, pages - 2))
  for (let i = start; i <= Math.min(pages, start + 2); i++) nums.push(i)
  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>
      {nums.map((n) => <button key={n} className={n === page ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>)}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  )
}

export function useToast() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!msg) return undefined
    const t = setTimeout(() => setMsg(''), 2200)
    return () => clearTimeout(t)
  }, [msg])
  return [msg ? <div className="toast">{msg}</div> : null, setMsg]
}

export function Modal({ children, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="panel modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export function ChatBox({ messages, onSend, me }) {
  const [text, setText] = useState('')
  return (
    <div className="panel chat">
      <b>💬 Chat phòng</b>
      <div className="chat-list">
        {messages.map((m, i) => (
          <div key={i}><b>{m.from === me ? m.from : m.from}:</b> {m.text}</div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText('') } }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn..." maxLength={120} />
        <button className="btn sm primary" type="submit">➤</button>
      </form>
    </div>
  )
}

export function PlayerCard({ name, level, avatar, status, sym, ghost, crown }) {
  return (
    <div className="panel pcard">
      <div className={`avatar xl ${ghost ? 'ghost' : ''}`}>{ghost ? '?' : avatar}</div>
      <b>{name} {crown && '👑'}</b>
      {level != null && <span className="muted">Lv.{level}</span>}
      {sym && <span className={`sym ${sym}`}>{sym === 'X' ? '✕' : '◯'}</span>}
      {status && <span className={`tag ${ghost ? 'gray' : 'green'}`}>{status}</span>}
    </div>
  )
}

export const Sym = ({ s }) => (s === 'X' ? '✕' : s === 'O' ? '◯' : '')
