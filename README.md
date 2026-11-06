# X-O Arena

Game **Caro (X-O) trực tuyến** nhiều người chơi, thời gian thực.

- **Client:** React 18 + Vite + React Router
- **Server:** Node.js + Socket.IO (đăng nhập bằng JWT, mật khẩu băm bằng bcrypt)
- Tính năng: tạo/tham gia phòng bằng mã, bảng xếp hạng, bạn bè, lịch sử ván đấu & xem lại, hồ sơ, cài đặt, hướng dẫn chơi, chơi khách.

## Yêu cầu

- [Node.js](https://nodejs.org) bản LTS (>= 18)

## Chạy thử (cần 2 terminal)

**Terminal 1 - server**

```bash
cd server
npm install
npm start
```

Thấy dòng `X-O Arena server chạy ở cổng 3001` là được.

**Terminal 2 - giao diện**

```bash
cd client
npm install
npm run dev
```

Mở trình duyệt: <http://localhost:5173/home>

Vite tự proxy `/api` và `/socket.io` sang server (cổng 3001), xem `client/vite.config.js`.

## Chơi 2 người trên 1 máy

Mở <http://localhost:5173/duo.html> (hai khung cạnh nhau), hoặc dùng 1 cửa sổ thường + 1 cửa sổ ẩn danh. Một bên **Tạo phòng**, bên kia **Tham gia** và nhập mã phòng.

## Chơi với máy khác cùng Wi-Fi

1. Chạy `ipconfig` (Windows) hoặc `ifconfig` / `ip a` (macOS/Linux) để lấy IPv4, ví dụ `192.168.1.5`.
2. Máy kia mở `http://<IPv4>:5173`.

Nếu không vào được: cho phép Node.js qua Firewall, hai máy cùng mạng và mạng đặt là Private.

## Biến môi trường (server)

| Biến         | Mặc định                           | Ý nghĩa                          |
| ------------ | ---------------------------------- | -------------------------------- |
| `PORT`       | `3001`                             | Cổng server                      |
| `JWT_SECRET` | `doi-chuoi-nay-truoc-khi-deploy`   | Khóa ký JWT - **đổi khi deploy** |

Ví dụ: `JWT_SECRET=chuoi-bi-mat-cua-ban npm start`

## Dữ liệu

Server tự tạo và lưu dữ liệu vào các file JSON trong `server/` (`users.json`, `leaderboard.json`, `friends.json`, `main-account.json`). Các file này đã được `.gitignore`, nên mỗi lần chạy mới sẽ bắt đầu với dữ liệu trống.

## Cấu trúc thư mục

```
xo-arena/
├── client/          # React + Vite
│   ├── public/      # ảnh, font, duo.html
│   └── src/
│       ├── pages/       # các màn hình
│       ├── components/  # component + CSS
│       └── lib/         # logic bàn cờ, socket, avatar
└── server/
    └── index.js     # HTTP API + Socket.IO
```
