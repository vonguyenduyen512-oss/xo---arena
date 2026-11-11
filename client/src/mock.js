import { makeMoves } from './lib/game.js'

export const AVATARS = ['👧', '🧑‍🎤', '🧑', '👦', '👩‍🎤', '🦊', '🐱', '🐼']

const NAMES = ['KingCaro', 'PlayerVN', 'XoArenaPro', 'MinhKhang99', 'ThanhDat7', 'BaoTran2005', 'KhoaCute', 'DuyAnh123',
  'AnhThu98', 'HoangMinh', 'SkyPro', 'KhuongGame', 'LinhNguyen', 'TuanKiet', 'MaiChi', 'QuocBao', 'NganHa', 'PhucLoc',
  'HaMy', 'TriDung', 'YenNhi', 'GiaHuy', 'BichNgoc']
const TOP_SCORES = [12850, 12640, 12520]

export const LEADERBOARD = NAMES.map((name, i) => ({
  rank: i + 1,
  name,
  level: Math.max(5, 20 - Math.floor(i / 2)),
  wins: 412 - i * 17,
  score: TOP_SCORES[i] ?? 12520 - (i - 2) * 310,
  avatar: AVATARS[i % AVATARS.length],
}))

export const ROOMS = Array.from({ length: 200 }, (_, i) => {
  const names = ['Phòng Đấu Vui Vẻ', 'X-O Friends', 'Cùng Chơi X-O', 'Thử Thách IQ', 'Arena Pro', 'Game Night', 'Chiến Binh X-O', 'Bạn và Tôi']
  const full = i % 3 === 2
  return {
    id: String(i + 1).padStart(3, '0'),
    code: ['K7F2QX', 'M3P9ZA', 'T8N4WB', 'R2D6HC', 'L5Y1VE', 'B9G3JS', 'Q4X7UK', 'C6H8NF'][i % 8],
    name: names[i % names.length],
    mode: 'Caro 2 người',
    players: full ? 2 : 1,
    status: full ? 'Bắt đầu' : 'Đang chờ',
  }
})

const opp = (name, level, avatar) => ({ name, level, avatar })
export const HISTORY = [
  { id: 'h1', opponent: opp('GameThu123', 14, '🧑'), result: 'win', score: '3 - 1', at: '2025-11-02T14:32:17' },
  { id: 'h2', opponent: opp('MinhKhang99', 16, '👧'), result: 'lose', score: '1 - 3', at: '2025-11-01T21:18:45' },
  { id: 'h3', opponent: opp('ThanhDat7', 13, '👦'), result: 'draw', score: '2 - 2', at: '2025-10-31T20:50:12' },
  { id: 'h4', opponent: opp('BaoTran2005', 15, '👩‍🎤'), result: 'win', score: '4 - 2', at: '2025-10-30T19:17:33' },
  { id: 'h5', opponent: opp('KhoaCute', 14, '🦊'), result: 'lose', score: '1 - 3', at: '2025-10-29T22:05:27' },
].map((m) => ({ ...m, moves: makeMoves(m.result) }))

export const ADMIN_PLAYERS = Array.from({ length: 36 }, (_, i) => ({
  id: 10001 + i,
  name: ['KhuongGame', 'MinhPhu', 'DuyAnh95', 'GameThu123', 'SkyPro', 'PlayerVN'][i % 6] + (i >= 6 ? i : ''),
  avatar: AVATARS[i % AVATARS.length],
  status: i % 3 === 1 ? 'Offline' : 'Đang chơi',
  joined: `2025-10-${String(29 - (i % 20)).padStart(2, '0')}`,
  total: 120 - i * 2,
  wins: 72 - i,
  losses: 48 - i,
  locked: false,
}))

export const ADMIN_ROOMS = [
  { id: 1, name: 'Phòng VIP #001', mode: 'Caro 1v1', status: 'Đang chơi', players: '2/2', at: '29/10/2025 14:40' },
  { id: 2, name: 'Phòng Thường #002', mode: 'Caro 1v1', status: 'Đang chờ', players: '1/2', at: '29/10/2025 14:48' },
  { id: 3, name: 'Phòng Clan #003', mode: 'Caro 1v1', status: 'Đang chờ', players: '1/2', at: '29/10/2025 14:50' },
  { id: 4, name: 'Phòng Giải Đấu #004', mode: 'Caro 1v1', status: 'Đã kết thúc', players: '2/2', at: '29/10/2025 14:35' },
  { id: 5, name: 'Phòng Thường #005', mode: 'Caro 1v1', status: 'Đang chơi', players: '2/2', at: '29/10/2025 14:42' },
]

export const ADMIN_MATCHES = [
  { room: 'Phòng VIP #001', p1: 'MinhKhang99', p2: 'GameThu123', result: 'Thắng', time: '14:50' },
  { room: 'Phòng Thường #002', p1: 'DuyenVHU', p2: 'KhoaCute', result: 'Thắng', time: '14:48' },
  { room: 'Phòng Clan #003', p1: 'BaoTran2005', p2: 'SkyPro', result: 'Hòa', time: '14:45' },
  { room: 'Phòng Thường #005', p1: 'PlayerVN', p2: 'MinhPhu', result: 'Thua', time: '14:42' },
  { room: 'Phòng VIP #001', p1: 'DuyenVHU', p2: 'KhuongGame', result: 'Thắng', time: '14:40' },
]

const series = (n, base, amp) => Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i / 2.2) * amp + i * (amp / 6)))
export const ADMIN_CHART = {
  7: { players: series(7, 16000, 3000), matches: series(7, 9000, 2500) },
  30: { players: series(10, 17000, 5000), matches: series(10, 9500, 4000) },
  90: { players: series(12, 19000, 6000), matches: series(12, 11000, 5000) },
}

export const ADMIN_ACTIVITY = [
  { t: '14:52', c: '#33d17a', text: 'Người chơi GameThu123 vừa tạo phòng #9321' },
  { t: '14:50', c: '#35b8ff', text: 'Trận đấu giữa MinhKhang99 và KhoaCute kết thúc: Thắng' },
  { t: '14:48', c: '#ff4fa3', text: 'Người chơi BaoTran2005 đăng nhập vào hệ thống' },
  { t: '14:45', c: '#c04bff', text: 'Người chơi DuyenVHU rời phòng #9319' },
]