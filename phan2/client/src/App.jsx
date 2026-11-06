import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './store.jsx'

import Splash from './pages/Splash.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Home from './pages/Home.jsx'
import ModeSelect from './pages/ModeSelect.jsx'
import Lobby from './pages/Lobby.jsx'
import { CreateRoom, WaitingRoom } from './pages/Rooms.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import Game from './pages/Game.jsx'
import Result from './pages/Result.jsx'
import { Profile, History, Leaderboard } from './pages/Profile.jsx'
import { Settings, HowToPlay } from './pages/Settings.jsx'
import { AdminLogin, AdminDashboard, AdminPlayers, AdminRooms } from './pages/Admin.jsx'

function Private({ children }) {
  const { user } = useApp()
  return user ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const { admin } = useApp()
  return admin ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  const p = (el) => <Private>{el}</Private>
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/home" element={p(<Home />)} />
      <Route path="/mode" element={p(<ModeSelect />)} />
      <Route path="/lobby" element={p(<Lobby />)} />
      <Route path="/create-room" element={p(<CreateRoom />)} />
      <Route path="/join-room" element={p(<JoinRoom />)} />
      <Route path="/waiting/:code" element={p(<WaitingRoom />)} />
      <Route path="/game/:code" element={p(<Game />)} />
      <Route path="/result" element={p(<Result />)} />
      <Route path="/profile" element={p(<Profile />)} />
      <Route path="/history" element={p(<History />)} />
      <Route path="/leaderboard" element={p(<Leaderboard />)} />
      <Route path="/settings" element={p(<Settings />)} />
      <Route path="/how-to-play" element={p(<HowToPlay />)} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
      <Route path="/admin/players" element={<AdminOnly><AdminPlayers /></AdminOnly>} />
      <Route path="/admin/rooms" element={<AdminOnly><AdminRooms /></AdminOnly>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}