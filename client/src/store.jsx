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
const normName = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')
// Danh sách tài khoản cố định: khóa (tên không dấu) -> thông tin. Thêm tài khoản mới chỉ cần thêm 1 dòng ở đây
// (và 1 dòng tương ứng trong MAIN_ACCOUNTS ở server/index.js).
export const MAIN_ACCOUNTS = {
  'nguyen duyen': { name: 'Nguyễn Duyên', id: '#62005', avatar: '👧' },
  'quynh': { name: 'Quỳnh', id: '#62001', avatar: 'a1' },
  'an':    { name: 'Ân',    id: '#62002', avatar: 'a2' },
  'vy':    { name: 'Vy',    id: '#62003', avatar: 'a3' },
  'quan':  { name: 'Quân',  id: '#62004', avatar: 'a4' },
  'luat':  { name: 'Luật',  id: '#62006', avatar: 'a5' },
  'huy':   { name: 'Huy',   id: '#62007', avatar: 'a6' },
}
const mainKeyOf = (u) => (u && !u.guest && u.main ? normName(u.name || '') : null)

// EXP cần để lên cấp: Lv1 = 300, mỗi cấp tăng thêm 100 (Lv2 = 400, Lv5 = 700, Lv10 = 1200...)
const expForLevel = (level) => 300 + (level - 1) * 100

// Áp lại mốc EXP hiện tại cho tài khoản đã lưu từ trước, giữ nguyên level
const fixExp = (u) => {
  let { level, exp } = u
  let expMax = expForLevel(level)
  while (exp >= expMax) { exp -= expMax; level++; expMax = expForLevel(level) }
  return { ...u, level, exp, expMax, id: u.main && MAIN_ACCOUNTS[normName(u.name || '')] ? MAIN_ACCOUNTS[normName(u.name)].id : u.id }
}

// Đồng bộ tài khoản chính với server (qua proxy /api của Vite)
const postMain = (path, key, body = {}) =>
  fetch('/api/main' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sessionStorage.getItem('xo_player_token') || '') },
    body: JSON.stringify(body),
  }).then((r) => r.json())
// Mỗi tài khoản cố định lưu riêng 1 ô localStorage (Nguyễn Duyên giữ ô cũ 'xo_main' để không mất dữ liệu)
const mainStoreKey = (key) => (key === 'nguyen duyen' ? 'xo_main' : 'xo_main_' + key)

const newUser = ({ name, email = '', birthday = '', guest = false, main = false }) => {
  const acc = main ? MAIN_ACCOUNTS[normName(name)] : null
  // Tài khoản cố định khởi tạo giống Nguyễn Duyên: level 6, ~1 triệu xu & gem
  const lv = acc ? 6 : 1
  return {
    id: acc ? acc.id : '#' + (10000 + Math.floor(Math.random() * 89999)),
    name: acc ? acc.name : name, email, birthday, guest, main: !!acc,
    avatar: acc ? acc.avatar : 'duo', level: lv, exp: acc ? 540 : 0, expMax: expForLevel(lv),
    coins: acc ? 1015099 : 999999, gems: acc ? 1000559 : 999999,
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = load('xo_user', null)
    if (!u) return u
    // Tài khoản Nguyễn Duyên đã có sẵn từ trước -> đánh dấu là tài khoản chính, giữ nguyên dữ liệu
    const isMain = !!mainKeyOf(u)
    // Chỉ Nguyễn Duyên được dùng ảnh '👧'; tài khoản khác dùng ảnh mặc định
    const onlyDuyen = isMain && mainKeyOf(u) === 'nguyen duyen'
    return fixExp({ ...u, main: isMain, avatar: !onlyDuyen && (u.avatar === '👧' || !u.avatar) ? 'duo' : u.avatar })
  })
  const [matches, setMatches] = useState(() => load('xo_matches', []))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('xo_settings', {}) }))
  const [admin, setAdmin] = useState(() => load('xo_admin', false))

  const pulled = useRef(false)
  const [syncTick, setSyncTick] = useState(0)

  // Kéo dữ liệu tài khoản chính từ server; chỉ dùng nếu mới hơn bản đang có
  const pullMain = (localUser) => {
    const key = mainKeyOf(localUser)
    if (!key || !sessionStorage.getItem('xo_player_token')) return
    pulled.current = false
    const done = (data) => {
      if (data?.user && ((data.user.rev || 0) > (localUser?.rev || 0) || ((data.user.rev || 0) === (localUser?.rev || 0) && (data.user.updatedAt || 0) > (localUser?.updatedAt || 0)))) {
        setUser(fixExp({ ...data.user, main: true, loginDays: [...new Set([...(data.user.loginDays || []), ...(localUser.loginDays || [])])] }))
        setMatches(data.matches || [])
      }
      pulled.current = true
      setSyncTick((t) => t + 1)
    }
    postMain('/load', key).then((r) => done(r.data)).catch(() => done(null))
  }
  useEffect(() => { if (user?.main && sessionStorage.getItem('xo_player_token')) pullMain(user) }, []) // mở lại app khi đang đăng nhập
  // Đẩy dữ liệu lên server mỗi khi thay đổi (sau khi đã kéo xong)
  useEffect(() => {
    if (user?.main && mainKeyOf(user) && pulled.current && sessionStorage.getItem('xo_player_token')) postMain('/save', mainKeyOf(user), { user, matches }).catch(() => {})
  }, [user, matches, syncTick])

  useEffect(() => save('xo_user', user), [user])
  useEffect(() => save('xo_matches', matches), [matches])
  useEffect(() => save('xo_settings', settings), [settings])
  useEffect(() => save('xo_admin', admin), [admin])
  // Tài khoản chính: lưu riêng, không bị ghi đè khi đăng nhập tài khoản khác
  useEffect(() => { if (user?.main && mainKeyOf(user)) save(mainStoreKey(mainKeyOf(user)), { user, matches }) }, [user, matches])

  // Trả về chuỗi lỗi nếu đăng nhập thất bại, null nếu thành công
  const login = async (identity, pw) => {
    const mk = normName(identity)
    if (MAIN_ACCOUNTS[mk]) {
      try {
        const res = await fetch('/api/main/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: mk, password: pw }) })
        const data = await res.json()
        if (!res.ok) return data.error || 'Đăng nhập thất bại.'
        sessionStorage.setItem('xo_player_token', data.token)
        const saved = data.data || load(mainStoreKey(mk), null)
        const u = fixExp({ ...(saved?.user || newUser({ name: MAIN_ACCOUNTS[mk].name, main: true })), main: true })
        setUser(u); setMatches(saved?.matches || []); pulled.current = true
        return null
      } catch { return 'Không kết nối được backend.' }
    }
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: identity, password: pw }) })
      const data = await res.json()
      if (!res.ok) return data.error || 'Đăng nhập thất bại.'
      sessionStorage.setItem('xo_player_token', data.token)
      setUser({ ...data.user, main: false }); setMatches([])
      return null
    } catch { return 'Không kết nối được backend.' }
  }
  const register = async (data) => {
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name, email: data.email, birthday: data.birthday, password: data.password }) })
      const result = await res.json()
      if (!res.ok) return result.error || 'Đăng ký thất bại.'
      sessionStorage.setItem('xo_player_token', result.token)
      setUser({ ...result.user, main: false }); setMatches([])
      return null
    } catch { return 'Không kết nối được backend.' }
  }
  const guestLogin = () => { sessionStorage.removeItem('xo_player_token'); setUser(newUser({ name: 'Khach' + Math.floor(Math.random() * 9000 + 1000), guest: true })); setMatches([]) }
  // Đăng xuất: dữ liệu tài khoản chính đã nằm trong xo_main nên không mất
  const logout = () => { sessionStorage.removeItem('xo_player_token'); setUser(null); setMatches([]) }

  const addMatch = (m) => {
    setMatches((list) => [m, ...list])
    setUser((u) => {
      if (!u) return u
      if (m.onlineVerified) return u // trận online được server tính thưởng
      const reward = { win: [500, 20, 100], draw: [100, 5, 30], lose: [50, 0, 20] }[m.result]
      let exp = u.exp + reward[2]
      let level = u.level
      let expMax = u.expMax
      while (exp >= expMax) { exp -= expMax; level++; expMax = expForLevel(level) }
      return { ...u, coins: u.coins + reward[0], gems: u.gems + reward[1], exp, level, expMax, updatedAt: Date.now() }
    })
  }

  // Nhận thưởng qua server, không tự cộng số dư ở trình duyệt.
  const claimEventReward = async (id, reward, eligible) => {
    if (!user?.main || !mainKeyOf(user)) return { ok: false, error: 'Chưa đủ điều kiện hoặc chưa đăng nhập tài khoản cố định.' }
    try {
      // Đẩy lịch sử trận mới nhất trước khi kiểm tra mốc.
      const saved = await postMain('/save', mainKeyOf(user), { user, matches })
      if (saved.stale) return { ok: false, error: 'Dữ liệu cũ, hãy tải lại trang.' }
      const r = await postMain('/claim', mainKeyOf(user), { id })
      if (r.data?.user) {
        setUser(fixExp({ ...r.data.user, main: true }))
        setMatches(r.data.matches || [])
      }
      return { ok: !!r.ok, error: r.error }
    } catch {
      return { ok: false, error: 'Không kết nối được server. Vui lòng thử lại.' }
    }
  }
  const checkInToday = async () => {
    if (!user?.main || !mainKeyOf(user)) return { ok: false, error: 'Hãy đăng nhập tài khoản cố định.' }
    try {
      const r = await postMain('/checkin', mainKeyOf(user))
      if (r.data?.user) {
        setUser(fixExp({ ...r.data.user, main: true }))
        setMatches(r.data.matches || [])
      }
      return { ok: !!r.ok, already: !!r.already, error: r.error }
    } catch { return { ok: false, error: 'Không kết nối được server.' } }
  }
  const updateProfile = (patch) => setUser((u) => {
    const p = { ...patch }
    if (mainKeyOf(u) !== 'nguyen duyen' && p.avatar === '👧') p.avatar = 'duo' // ảnh '👧' chỉ dành cho Nguyễn Duyên
    return { ...u, ...p, updatedAt: Date.now() }
  })

  return (
    <Ctx.Provider value={{
      user, matches, settings, setSettings, admin, setAdmin,
      login, register, guestLogin, logout, addMatch, updateProfile, claimEventReward, checkInToday,
    }}>
      {children}
    </Ctx.Provider>
  )
}