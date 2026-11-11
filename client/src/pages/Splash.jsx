import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import "../splash.css";

const TIPS = [
  'Tạo phòng và mời bạn bè để cùng thi đấu nhé!',
  'Giữ thế trận ở trung tâm bàn cờ.',
  'Chặn ngay nước đi tạo 4 quân của đối thủ.',
  'Mỗi lượt đi chỉ có 30 giây – hãy nhanh tay!',
]

const PATH = {
  pad: 'M7 8h10a5 5 0 0 1 4.8 6.4l-.6 2a2.5 2.5 0 0 1-4.1 1.1L15 16H9l-2.1 1.5a2.5 2.5 0 0 1-4.1-1.1l-.6-2A5 5 0 0 1 7 8Zm1 2.5v1.2H6.8v1.6H8v1.2h1.6v-1.2h1.2v-1.6H9.6v-1.2Zm7.6.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  gear: 'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.9h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13ZM12.9 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 16h-2v-2h2v2Zm2.1-7.8-.9.9c-.7.7-1.2 1.2-1.2 2.6h-2v-.5c0-1.1.5-2 1.2-2.7l1.2-1.3c.4-.3.6-.8.6-1.3a2 2 0 0 0-4 0H8a4 4 0 0 1 8 0c0 .9-.4 1.7-.9 2.2Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-3.4 0-8 1.7-8 5V21h16v-1.8c0-3.3-4.6-5-8-5Z',
}
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
)

export default function Splash({ duration = 3200 }) {
  const nav = useNavigate()
  const { user } = useApp()
  const [pct, setPct] = useState(0)
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], [])

  useEffect(() => {
    const start = performance.now()
    const ease = (x) => 1 - Math.pow(1 - x, 2.2)
    let raf, timer
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration)
      setPct(Math.round(ease(k) * 100))
      if (k < 1) raf = requestAnimationFrame(tick)
      else timer = setTimeout(() => nav(user ? '/home' : '/login', { replace: true }), 350)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [duration, nav, user])

  const hide = (e) => { e.currentTarget.style.display = 'none' }

  return (
    <main className="xs">
      <header className="xs-brand">
        <Icon d={PATH.pad} /><i />
        <div><b>X-O ARENA</b><small>Play • Connect • Win</small></div>
      </header>

      <nav className="xs-tools" aria-label="Công cụ">
        <button aria-label="Cài đặt" onClick={() => nav('/settings')}><Icon d={PATH.gear} /></button>
        <button aria-label="Hướng dẫn" onClick={() => nav('/how-to-play')}><Icon d={PATH.help} /></button>
        <button aria-label="Tài khoản" onClick={() => nav(user ? '/profile' : '/login')}><Icon d={PATH.user} /></button>
      </nav>

      <img className="xs-art xs-boy" src="/img/boy.png" alt="" onError={hide} />
      <img className="xs-art xs-girl" src="/img/girl.png" alt="" onError={hide} />
      <img className="xs-art xs-logo" src="/img/logo.png" alt="X-O Arena – Caro Trực Tuyến" onError={hide} />

      <section className="xs-loader" role="status" aria-live="polite">
        <p>Đang tải game…</p>
        <div className="xs-row">
          <div className="xs-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <i style={{ width: pct + '%' }} />
          </div>
          <b className="xs-pct">{pct}%</b>
        </div>
        <p className="xs-tip">💡 <b>Mẹo nhỏ:</b> {tip}</p>
      </section>
    </main>
  )
}
