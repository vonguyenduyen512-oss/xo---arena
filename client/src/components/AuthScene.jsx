import { useNavigate } from 'react-router-dom'
import { useToast } from './Layout.jsx'
import './auth.css'

export const PATH = {
  pad: 'M7 8h10a5 5 0 0 1 4.8 6.4l-.6 2a2.5 2.5 0 0 1-4.1 1.1L15 16H9l-2.1 1.5a2.5 2.5 0 0 1-4.1-1.1l-.6-2A5 5 0 0 1 7 8Zm1 2.5v1.2H6.8v1.6H8v1.2h1.6v-1.2h1.2v-1.6H9.6v-1.2Zm7.6.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  gear: 'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.9h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13ZM12.9 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 16h-2v-2h2v2Zm2.1-7.8-.9.9c-.7.7-1.2 1.2-1.2 2.6h-2v-.5c0-1.1.5-2 1.2-2.7l1.2-1.3c.4-.3.6-.8.6-1.3a2 2 0 0 0-4 0H8a4 4 0 0 1 8 0c0 .9-.4 1.7-.9 2.2Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-3.4 0-8 1.7-8 5V21h16v-1.8c0-3.3-4.6-5-8-5Z',
  userPlus: 'M10 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-3.4 0-8 1.7-8 5V21h16v-1.8c0-3.3-4.6-5-8-5ZM20 8V5h-2v3h-3v2h3v3h2v-3h3V8h-3Z',
  lock: 'M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z',
  eye: 'M12 5C6.5 5 2.2 8.6 1 12c1.2 3.4 5.5 7 11 7s9.8-3.6 11-7c-1.2-3.4-5.5-7-11-7Zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  enter: 'M10 17l5-5-5-5v3H3v4h7v3Zm9-14h-7v2h7v14h-7v2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z',
  back: 'M15.5 5.5 9 12l6.5 6.5-1.5 1.5L6 12l8-8 1.5 1.5Z',
}
export const Svg = ({ d, children, className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{d && <path d={d} />}{children}</svg>
)
export const GoogleG = () => (
  <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
)

// Khung chung: nền, nhân vật, logo, thanh trên, nút Quay lại, câu khẩu hiệu
export default function AuthScene({ title, icon = PATH.user, children }) {
  const nav = useNavigate()
  const [toast, setToast] = useToast()
  const hide = (e) => { e.currentTarget.style.display = 'none' }
  const needLogin = () => setToast('Hãy đăng nhập để dùng tính năng này')
  return (
    <main className="xa">
      <img className="xa-art xa-boy" src="/img/boy.png" alt="" onError={hide} />
      <img className="xa-art xa-girl" src="/img/girl.png" alt="" onError={hide} />

      <header className="xa-brand">
        <Svg d={PATH.pad} /><i /><div><b>X-O ARENA</b><small>Caro Trực Tuyến</small></div>
      </header>
      <nav className="xa-tools" aria-label="Công cụ">
        <button className="lang" onClick={() => setToast('Hiện chỉ hỗ trợ Tiếng Việt')}>🌐 Tiếng Việt ⌄</button>
        <button className="r" aria-label="Trợ giúp" onClick={needLogin}><Svg d={PATH.help} /></button>
        <button className="r" aria-label="Cài đặt" onClick={needLogin}><Svg d={PATH.gear} /></button>
      </nav>

      <img className="xa-logo" src="/img/logo.png" alt="X-O Arena – Caro Trực Tuyến" onError={hide} />

      <section className="xa-panel" aria-labelledby="xa-title">
        <h1 className="xa-tab" id="xa-title" style={{ margin: 0 }}><Svg d={icon} />{title}</h1>
        {children}
      </section>
<button className="xa-back" onClick={() => nav('/')}><Svg d={PATH.back} />Quay lại</button>
      <div className="xa-tag" aria-hidden="true">Kết nối bạn bè<br />Thách thức đỉnh cao!</div>
      {toast}
    </main>
  )
}
