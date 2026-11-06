import { createContext, useContext, useEffect, useRef, useState } from 'react'

// Store tạm bằng localStorage. Khi có backend: thay login/register/addMatch bằng gọi API.
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const load = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d }
}
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export const DEFAULT_SETTINGS = {
  sfx: 70, music: 60, fx: 100, mode: 'classic',
  res: '1920 x 1080', quality: 'Cao', fullscreen: false, blur: true,
  publicInfo: true, notify: true,
}

// ===== Tài khoản chính (được lưu cố định) =====
// Chỉ tài khoản này giữ dữ liệu (level, xu, lịch sử trận). Các tài khoản khác chỉ là tạm.
const MAIN_NAME = 'Nguyễn Duyên'
const MAIN_PASS = import.meta.env.VITE_MAIN_PASS || '' // đặt trong client/.env (không để trong code)
const normName = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')
const MAIN_KEY = normName(MAIN_NAME)
const MAIN_ID = '#62005' // ID cố định của tài khoản Nguyễn Duyên

// EXP cần để lên cấp: Lv1 = 300, mỗi cấp tăng thêm 100 (Lv2 = 400, Lv5 = 700, Lv10 = 1200...)
const expForLevel = (level) => 300 + (level - 1) * 100

// Áp lại mốc EXP hiện tại cho tài khoản đã lưu từ trước, giữ nguyên level
const fixExp = (u) => {
  let { level, exp } = u
  let expMax = expForLevel(level)
  while (exp >= expMax) { exp -= expMax; level++; expMax = expForLevel(level) }
  return { ...u, level, exp, expMax, id: u.main ? MAIN_ID : u.id }
}

// Đồng bộ tài khoản chính với server (qua proxy /api của Vite)
const postMain = (path, body = {}) =>
  fetch('/api/main' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pass: MAIN_PASS, ...body }),
  }).then((r) => r.json())

const newUser = ({ name, email = '', birthday = '', guest = false, main = false }) => ({
  id: main ? MAIN_ID : '#' + (10000 + Math.floor(Math.random() * 89999)),
  name, email, birthday, guest, main,
  avatar: main ? '👧' : 'duo', level: 1, exp: 0, expMax: expForLevel(1),
  coins: 999999, gems: 999999,
})

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = load('xo_user', null)
    if (!u) return u
    // Tài khoản Nguyễn Duyên đã có sẵn từ trước -> đánh dấu là tài khoản chính, giữ nguyên dữ liệu
    const isMain = u.main || (!u.guest && normName(u.name || '') === MAIN_KEY)
    // Chỉ tài khoản chính được dùng ảnh '👧'; tài khoản khác dùng ảnh mặc định
    return fixExp({ ...u, main: !!isMain, avatar: !isMain && (u.avatar === '👧' || !u.avatar) ? 'duo' : u.avatar })
  })
  const [matches, setMatches] = useState(() => load('xo_matches', []))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('xo_settings', {}) }))
  const [admin, setAdmin] = useState(() => load('xo_admin', false))

  const pulled = useRef(false)
  const [syncTick, setSyncTick] = useState(0)

  // Kéo dữ liệu tài khoản chính từ server; chỉ dùng nếu mới hơn bản đang có
  const pullMain = (localUser) => {
    pulled.current = false
    const done = (data) => {
      if (data?.user && (data.user.updatedAt || 0) > (localUser?.updatedAt || 0)) {
        setUser(fixExp({ ...data.user, main: true }))
        setMatches(data.matches || [])
      }
      pulled.current = true
      setSyncTick((t) => t + 1)
    }
    postMain('/load').then((r) => done(r.data)).catch(() => done(null))
  }
  useEffect(() => { if (user?.main) pullMain(user) }, []) // mở lại app khi đang đăng nhập
  // Đẩy dữ liệu lên server mỗi khi thay đổi (sau khi đã kéo xong)
  useEffect(() => {
    if (user?.main && pulled.current) postMain('/save', { user, matches }).catch(() => {})
  }, [user, matches, syncTick])

  useEffect(() => save('xo_user', user), [user])
  useEffect(() => save('xo_matches', matches), [matches])
  useEffect(() => save('xo_settings', settings), [settings])
  useEffect(() => save('xo_admin', admin), [admin])
  // Tài khoản chính: lưu riêng, không bị ghi đè khi đăng nhập tài khoản khác
  useEffect(() => { if (user?.main) save('xo_main', { user, matches }) }, [user, matches])

  // Trả về chuỗi lỗi nếu đăng nhập thất bại, null nếu thành công
  const login = (identity, pw) => {
    if (normName(identity) === MAIN_KEY) {
      if (!MAIN_PASS || pw !== MAIN_PASS) return 'Sai mật khẩu.'
      const saved = load('xo_main', null)
      let u
      if (saved?.user) {
        u = fixExp({ ...saved.user, main: true })
        setUser(u)
        setMatches(saved.matches || [])
      } else {
        u = { ...newUser({ name: MAIN_NAME, main: true }), updatedAt: 0 }
        setUser(u)
        setMatches([])
      }
      pullMain(u) // lấy dữ liệu mới nhất từ server (nếu có)
      return null
    }
    const name = identity.includes('@') ? identity.split('@')[0] : identity
    setUser(newUser({ name, email: identity.includes('@') ? identity : '' }))
    setMatches([])
    return null
  }
  const register = (data) => { setUser(newUser({ name: data.name, email: data.email, birthday: data.birthday })); setMatches([]) }
  const guestLogin = () => { setUser(newUser({ name: 'Khach' + Math.floor(Math.random() * 9000 + 1000), guest: true })); setMatches([]) }
  // Đăng xuất: dữ liệu tài khoản chính đã nằm trong xo_main nên không mất
  const logout = () => { setUser(null); setMatches([]) }

  const addMatch = (m) => {
    setMatches((list) => [m, ...list])
    setUser((u) => {
      if (!u) return u
      const reward = { win: [500, 20, 100], draw: [100, 5, 30], lose: [50, 0, 20] }[m.result]
      let exp = u.exp + reward[2]
      let level = u.level
      let expMax = u.expMax
      while (exp >= expMax) { exp -= expMax; level++; expMax = expForLevel(level) }
      return { ...u, coins: u.coins + reward[0], gems: u.gems + reward[1], exp, level, expMax, updatedAt: Date.now() }
    })
  }

  const updateProfile = (patch) => setUser((u) => {
    const p = { ...patch }
    if (!u.main && p.avatar === '👧') p.avatar = 'duo' // ảnh '👧' chỉ dành cho Nguyễn Duyên
    return { ...u, ...p, updatedAt: Date.now() }
  })

  return (
    <Ctx.Provider value={{
      user, matches, settings, setSettings, admin, setAdmin,
      login, register, guestLogin, logout, addMatch, updateProfile,
    }}>
      {children}
    </Ctx.Provider>
  )
}