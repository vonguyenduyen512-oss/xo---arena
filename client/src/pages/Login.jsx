import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { useToast } from '../components/Layout.jsx'
import AuthScene, { GoogleG, PATH, Svg } from '../components/AuthScene.jsx'

// Màn hình 02 – Đăng nhập
export default function Login() {
  const { login, guestLogin } = useApp()
  const nav = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useToast()

  const submit = async (e) => {
    e.preventDefault()
    if (!id.trim() || !pw) return setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.')
    setError('')
      const err = await login(id.trim(), pw)
    if (err) return setError(err)
    nav('/home', { replace: true })
  }

  return (
    <AuthScene title="Đăng Nhập" icon={PATH.user}>
      <form onSubmit={submit} noValidate>
        <label className="xa-field">
          <Svg d={PATH.user} />
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Tên đăng nhập hoặc Email"
            autoComplete="username" aria-label="Tên đăng nhập hoặc Email" />
        </label>
        <label className="xa-field">
          <Svg d={PATH.lock} />
          <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mật khẩu"
            autoComplete="current-password" aria-label="Mật khẩu" />
          <button type="button" className="xa-eye" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            <Svg d={PATH.eye}>{!show && <path d="M4 4l16 16" strokeWidth="2.2" />}</Svg>
          </button>
        </label>
        {error && <div className="xa-err" role="alert">{error}</div>}

        <div className="xa-row">
          <label className="xa-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Ghi nhớ đăng nhập</label>
          <button type="button" className="xa-link" onClick={() => setToast('Tính năng quên mật khẩu sẽ làm ở bước backend')}>Quên mật khẩu?</button>
        </div>

        <button className="xa-btn" type="submit"><Svg d={PATH.enter} />Đăng Nhập</button>

        <div className="xa-or">Hoặc</div>
        <div className="xa-two">
          <button type="button" className="xa-btn alt" onClick={() => setToast('Đăng nhập Google: làm sau')}><GoogleG />Đăng nhập với Google</button>
          <button type="button" className="xa-btn alt" onClick={() => { guestLogin(); nav('/home', { replace: true }) }}><Svg d={PATH.pad} />Đăng nhập nhanh</button>
        </div>

        <p className="xa-foot">Chưa có tài khoản? <Link className="xa-link" to="/register">Đăng ký ngay →</Link></p>
        <p className="xa-admin"><Link to="/admin/login">Khu vực quản trị</Link></p>
      </form>
      {toast}
    </AuthScene>
  )
}
