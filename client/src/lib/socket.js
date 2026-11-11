// Một kết nối Socket.IO dùng chung cho cả app (giữ nguyên khi chuyển trang).
// Vite proxy /socket.io → server (xem vite.config.js), nên máy khác trong LAN cũng vào được.
import { io } from 'socket.io-client'

export const socket = io({ autoConnect: false, transports: ['websocket', 'polling'] })
export const connect = () => { if (!socket.connected && !socket.active) socket.connect(); return socket }

// emit có callback + timeout; báo lỗi rõ khi server chưa chạy
export const call = (event, payload, ms = 4000) => new Promise((resolve) => {
  connect()
  const t = setTimeout(() => resolve({ ok: false, error: 'Không kết nối được server (đã chạy "npm start" trong thư mục server chưa?)' }), ms)
  socket.emit(event, payload, (res) => { clearTimeout(t); resolve(res || { ok: false, error: 'Server không phản hồi' }) })
})
