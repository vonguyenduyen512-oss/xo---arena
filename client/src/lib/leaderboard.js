// Bảng xếp hạng dùng chung cho Home (top 3) và màn Bảng xếp hạng.
// Cùng một nguồn dữ liệu (/api/leaderboard) + cùng cách ghép "tôi" + cùng cách xếp hạng
// => hai chỗ luôn khớp nhau.
import { useCallback, useEffect, useState } from 'react'

export const norm = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ')

// Trả về danh sách đã có rank, y hệt tab "Toàn cầu" ở màn Bảng xếp hạng
export function rankGlobal(players, user) {
  if (!user) return []
  const myKey = norm(user.name)
  const all = players.map((p) => (norm(p.name) === myKey ? { ...p, me: true, level: user.level, avatar: user.avatar } : p))
  const inList = all.some((p) => p.me)
  const list = inList || user.guest ? all : [...all, { me: true, name: user.name, level: user.level, avatar: user.avatar, wins: 0, score: 0 }]
  return list.map((p, i) => ({ ...p, rank: i + 1 }))
}

export function useLeaderboard() {
  const [players, setPlayers] = useState([])
  const [err, setErr] = useState(false)
  const load = useCallback(() => fetch('/api/leaderboard').then((r) => r.json())
    .then((d) => { setPlayers(d.players || []); setErr(false) })
    .catch(() => setErr(true)), [])
  useEffect(() => { load() }, [load])
  return { players, err, reload: load }
}
