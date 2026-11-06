import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { useToast } from '../components/Layout.jsx'
import AuthScene, { GoogleG, PATH, Svg } from '../components/AuthScene.jsx'

// Icon & kiểu dáng khai báo ngay tại đây để file chạy độc lập
const ID_CARD = 'M3 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3Zm5 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.5 16c0-1.7 2.2-2.6 4.5-2.6s4.5.9 4.5 2.6v.5h-9V16ZM14 9h6v1.6h-6V9Zm0 3h6v1.6h-6V12Zm0 3h4v1.6h-4V15Z'
const CALENDAR = 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Zm2 2v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2Z'
const USER_PLUS = 'M10 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2.2c-3.4 0-8 1.7-8 5V21h16v-1.8c0-3.3-4.6-5-8-5ZM20 8V5h-2v3h-3v2h3v3h2v-3h3V8h-3Z'
const SEL = { flex: 1, minWidth: 0, height: '100%', background: 'none', border: 0, outline: 0, color: '#fff', font: 'inherit', cursor: 'pointer', padding: '0 4px' }
const OPT = { color: '#111', background: '#fff' }

function Pw({ value, onChange, placeholder, label }) {
  const [show, setShow] = useState(false)
  return (
    <label className="xa-field">
      <Svg d={PATH.lock} />
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} aria-label={label} autoComplete="new-password" />
      <button type="button" className="xa-eye" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        <Svg d={PATH.eye}>{!show && <path d="M4 4l16 16" strokeWidth="2.2" />}</Svg>
      </button>
    </label>
  )
}

// Màn hình 03 – Đăng ký
export default function Register() {
  const { register, guestLogin } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', pw: '', pw2: '', name: '', birthday: '', agree: true })
  const [er, setEr] = useState({})
  const [bd, setBd] = useState({ d: '', m: '', y: '' })
  const setB = (k) => (e) => setBd((s) => ({ ...s, [k]: e.target.value }))
  const thisYear = new Date().getFullYear()
  const [toast, setToast] = useToast()
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const Err = ({ k }) => (er[k] ? <div className="xa-err" role="alert">{er[k]}</div> : null)

  const submit = (e) => {
    e.preventDefault()
    const x = {}
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Email không hợp lệ.'
    if (f.pw.length < 6) x.pw = 'Mật khẩu tối thiểu 6 ký tự.'
    if (f.pw2 !== f.pw) x.pw2 = 'Mật khẩu xác nhận không khớp.'
    if (!f.name.trim()) x.name = 'Vui lòng nhập họ và tên.'
    const dt = new Date(+bd.y, +bd.m - 1, +bd.d)
    const ok = bd.d && bd.m && bd.y && dt.getMonth() === +bd.m - 1 && dt.getDate() === +bd.d
    if (!ok) x.birthday = 'Vui lòng chọn ngày sinh hợp lệ.'
    const iso = ok ? `${bd.y}-${String(bd.m).padStart(2, '0')}-${String(bd.d).padStart(2, '0')}` : ''
    if (!f.agree) x.agree = 'Bạn cần đồng ý điều khoản.'
    setEr(x)
    if (Object.keys(x).length) return
    // TODO: gọi POST /api/register (backend Node)
    register({ name: f.name.trim(), email: f.email, birthday: iso })
    nav('/home', { replace: true })
  }

  return (
    <AuthScene title="Đăng Ký" icon={USER_PLUS} compact>
      <form onSubmit={submit} noValidate>
        <label className="xa-field"><Svg d={PATH.user} />
          <input value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="Tên đăng nhập (Email)" aria-label="Email" autoComplete="email" />
        </label><Err k="email" />
        <Pw value={f.pw} onChange={set('pw')} placeholder="Mật khẩu" label="Mật khẩu" /><Err k="pw" />
        <Pw value={f.pw2} onChange={set('pw2')} placeholder="Xác nhận mật khẩu" label="Xác nhận mật khẩu" /><Err k="pw2" />
        <label className="xa-field"><Svg d={ID_CARD} />
          <input value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="Họ và tên" aria-label="Họ và tên" autoComplete="name" />
        </label><Err k="name" />
        <div className="xa-field"><Svg d={CALENDAR} />
          <select aria-label="Ngày" value={bd.d} onChange={setB('d')} style={SEL}>
            <option style={OPT} value="">Ngày</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option style={OPT} key={n} value={n}>{n}</option>)}
          </select>
          <select aria-label="Tháng" value={bd.m} onChange={setB('m')} style={SEL}>
            <option style={OPT} value="">Tháng</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option style={OPT} key={n} value={n}>Tháng {n}</option>)}
          </select>
          <select aria-label="Năm" value={bd.y} onChange={setB('y')} style={SEL}>
            <option style={OPT} value="">Năm</option>
            {Array.from({ length: 100 }, (_, i) => thisYear - i).map((n) => <option style={OPT} key={n} value={n}>{n}</option>)}
          </select>
        </div><Err k="birthday" />

        <div className="xa-terms">
          <label className="xa-check">
            <input type="checkbox" checked={f.agree} onChange={(e) => set('agree')(e.target.checked)} />
            <span>Tôi đồng ý với <button type="button" className="xa-link" onClick={() => setToast('Điều khoản sử dụng: bổ sung sau')}>Điều khoản sử dụng</button> và <button type="button" className="xa-link" onClick={() => setToast('Chính sách bảo mật: bổ sung sau')}>Chính sách bảo mật</button></span>
          </label>
        </div><Err k="agree" />

        <button className="xa-btn" type="submit"><Svg d={USER_PLUS} />Đăng Ký</button>

        <div className="xa-or">Hoặc đăng ký bằng</div>
        <div className="xa-two">
          <button type="button" className="xa-btn alt" onClick={() => setToast('Đăng ký Google: làm sau')}><GoogleG />Đăng ký với Google</button>
          <button type="button" className="xa-btn alt" onClick={() => { guestLogin(); nav('/home', { replace: true }) }}><Svg d={PATH.pad} />Đăng ký với tài khoản Game</button>
        </div>
        <p className="xa-foot">Đã có tài khoản? <Link className="xa-link" to="/login">Đăng nhập ngay →</Link></p>
      </form>
      {toast}
    </AuthScene>
  )
}