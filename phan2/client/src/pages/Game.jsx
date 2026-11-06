import { photoOf } from '../lib/avatar.js'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { useToast } from '../components/Layout.jsx'
import { Crown, PETALS, TopHud, useFit } from '../components/hud.jsx'
import { Backdrop, BigCrown, ChatBubble, Chev, NeonFrame, ReadyPill, Silhouette } from './WaitingRoom.jsx'
import { SIZE, TURN_TIME, aiMove, boardFromMoves, checkWin, createBoard } from '../lib/game.js'
import { call, connect, socket } from '../lib/socket.js'
import '../components/home.css'
import '../components/join-fonts.css'
import '../components/join.css'
import '../components/waiting.css'
import '../components/game.css'

/* Màn hình 10 – Phòng chơi / Bàn cờ Caro
   Stage 1280x720 tự thu phóng; nội dung (.gm-s) dựng theo toạ độ ảnh thiết kế 967x544 rồi phóng 1.3236 lần.
   Ba chế độ: code = 'AI' → đánh với máy (bạn là X, máy là O); code = 'LOCAL' → 2 người chung một máy.
   Còn lại → online qua Socket.IO (server/index.js): click gửi 'game:move', nước đi nhận lại qua 'game:moved'. */
const init = () => ({ board: createBoard(), moves: [], turn: 'X', time: TURN_TIME, over: null })

function reducer(s, a) {
  if (a.type === 'sync') return { ...s, ...a.state }
  if (s.over) return s
  switch (a.type) {
    case 'move': {
      const { x, y } = a
      const sym = a.s || s.turn
      if (s.board[y][x]) return s
      const board = s.board.map((r) => r.slice())
      board[y][x] = sym
      const moves = [...s.moves, { x, y, s: sym }]
      const line = checkWin(board, x, y, sym)
      if (line) return { ...s, board, moves, over: { winner: sym, line, reason: 'five' } }
      if (moves.length === SIZE * SIZE) return { ...s, board, moves, over: { winner: null, reason: 'full' } }
      return { ...s, board, moves, turn: sym === 'X' ? 'O' : 'X', time: TURN_TIME }
    }
    case 'tick': // online: server quyết định hết giờ, client chỉ đếm hiển thị
      if (s.time <= 1) return a.local ? { ...s, time: 0, over: { winner: s.turn === 'X' ? 'O' : 'X', reason: 'timeout' } } : { ...s, time: 0 }
      return { ...s, time: s.time - 1 }
    case 'resign': { // a.side: bên đầu hàng (mặc định là bên đang tới lượt)
      const loser = a.side || s.turn
      return { ...s, over: { winner: loser === 'X' ? 'O' : 'X', reason: 'resign' } }
    }
    case 'draw': return { ...s, over: { winner: null, reason: 'agreed' } }
    case 'over': return { ...s, over: a.over }
    default: return s
  }
}

const resultOf = (over, my) => (!over.winner ? 'draw' : over.winner === my ? 'win' : 'lose')

const REASON = {
  five: 'Đạt 5 quân liên tiếp', full: 'Bàn cờ đã đầy', timeout: 'Hết thời gian lượt',
  resign: 'Đầu hàng', agreed: 'Hai bên đồng ý hòa',
}

/* ---------- icon ---------- */
const Grid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="3.500" /><path d="M8.700 2v20M15.300 2v20M2 8.700h20M2 15.300h20" strokeWidth="1.800" />
  </svg>
)
const Clock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="13.500" r="8.500" /><path d="M12 8.500v5l3 2M9.500 2h5M12 2v3M19 5l1.500 1.500" />
  </svg>
)
const Flag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
    <path d="M4 2v20" stroke="#fff" strokeWidth="2.400" strokeLinecap="round" />
    <path d="M6 4h14l-4 5 4 5H6z" fill="#fff" />
  </svg>
)
const Cycle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 12a8 8 0 0 0-14-5.300M4 4v4h4M4 12a8 8 0 0 0 14 5.300M20 20v-4h-4" />
  </svg>
)
const Door = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6M11 12h10M17.500 8.500L21 12l-3.500 3.500" />
  </svg>
)
const Swords = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
    {[false, true].map((m) => (
      <g key={String(m)} transform={m ? 'translate(26 0) scale(-1 1)' : undefined}>
        <path d="M2.500 2.500l5 .8 9.500 9.500-3.800 3.800L3.300 7.500z" fill="#d6c8ff" stroke="#9a78ff" strokeWidth=".7" strokeLinejoin="round" />
        <path d="M11 19.500l8.500-8.500" stroke="#f0e8ff" strokeWidth="2.400" strokeLinecap="round" />
        <path d="M15 16l6 6" stroke="#cdb8ff" strokeWidth="2.600" strokeLinecap="round" />
      </g>
    ))}
  </svg>
)
const Smile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <circle cx="8.500" cy="9.500" r="1.800" fill="#3a2bb0" /><circle cx="15.500" cy="9.500" r="1.800" fill="#3a2bb0" />
    <path d="M6.500 14c1 3.500 4 4.500 5.500 4.500s4.500-1 5.500-4.500z" fill="#3a2bb0" />
  </svg>
)
const Send = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
    <path d="M2 3l20 9-20 9 3-9z" fill="#fff" /><path d="M5 12h9" stroke="#6b3df0" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/* ---------- quân cờ ---------- */
const PieceX = () => (
  <svg className="gm-x" viewBox="0 0 20 20" aria-hidden><path d="M4.500 4.500l11 11M15.500 4.500l-11 11" /></svg>
)
const PieceO = () => (
  <svg className="gm-o" viewBox="0 0 20 20" aria-hidden><circle cx="10" cy="10" r="6" /></svg>
)

function GameBoard({ board, onCell, line, last, disabled }) {
  const lineSet = new Set((line || []).map(([x, y]) => `${x},${y}`))
  return (
    <div className="gm-board">
      <NeonFrame w={400} h={357} c={14} id="gmbf" c1="#cfe6ff" c2="#4f6dff" fill={['rgba(8,16,110,.9)', 'rgba(6,10,86,.94)']} inset={5} sw={2.400} />
      <div className="gm-cols">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
      <div className="gm-rows">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
      <div className="gm-grid">
        {board.map((row, y) => row.map((v, x) => {
          const cls = ['gm-cell', v || '', v ? 'filled' : '']
          if (last && last.x === x && last.y === y) cls.push('last')
          if (lineSet.has(`${x},${y}`)) cls.push('line')
          return (
            <button key={`${x}-${y}`} type="button" className={cls.join(' ')} disabled={disabled || !!v}
              onClick={() => onCell?.(x, y)} aria-label={`Hàng ${y + 1}, cột ${x + 1}${v ? ', quân ' + v : ''}`}>
              {v === 'X' ? <PieceX /> : v === 'O' ? <PieceO /> : null}
            </button>
          )
        }))}
      </div>
    </div>
  )
}

export default function Game() {
  const { code } = useParams()
  const { user, addMatch, logout } = useApp()
  const nav = useNavigate()
  const scale = useFit(1280, 720)
  const [toast, setToast] = useToast()
  const [s, dispatch] = useReducer(reducer, null, init)
  const ai = code === 'AI'
  const local = code === 'LOCAL' || ai // chơi offline (không qua server)
  const [mySym, setMySym] = useState('X')
  const [opp, setOpp] = useState(ai ? { name: 'Máy (AI)', level: 5, avatar: '🤖' } : local ? { name: 'Người chơi 2', level: 1, avatar: '🧑' } : { name: 'Đối thủ', level: 1, avatar: '🧑' })
  const [msgs, setMsgs] = useState([{ from: 'me', text: 'Bắt đầu thôi nào! 🎮' }])
  const [draft, setDraft] = useState('')
  const saved = useRef(false)
  const chatEnd = useRef(null)

  // Đồng hồ lượt
  useEffect(() => {
    if (s.over) return undefined
    const t = setInterval(() => dispatch({ type: 'tick', local }), 1000)
    return () => clearInterval(t)
  }, [s.over, local])

  // Chế độ AI: máy đánh quân O sau một nhịp suy nghĩ
  useEffect(() => {
    if (!ai || s.over || s.turn !== 'O') return undefined
    const t = setTimeout(() => {
      const { x, y } = aiMove(s.board)
      dispatch({ type: 'move', x, y })
    }, 500 + Math.random() * 500)
    return () => clearTimeout(t)
  }, [ai, s.turn, s.over, s.board])

  // Online: đồng bộ trạng thái phòng + nhận nước đi / kết quả / chat từ server
  useEffect(() => {
    if (local) return undefined
    connect()
    const onMoved = ({ x, y, s: sym }) => dispatch({ type: 'move', x, y, s: sym })
    const onOver = (over) => dispatch({ type: 'over', over })
    const onChat = (m) => setMsgs((l) => [...l, m])
    const onOffer = () => socket.emit('draw:answer', { accept: window.confirm('Đối thủ đề nghị hòa trận. Bạn đồng ý?') })
    const onDeclined = () => setToast('Đối thủ từ chối hòa')
    const onDisc = () => setToast('Mất kết nối server')
    socket.on('game:moved', onMoved); socket.on('game:over', onOver); socket.on('chat:message', onChat)
    socket.on('draw:offered', onOffer); socket.on('draw:declined', onDeclined); socket.on('disconnect', onDisc)
    call('game:sync', { code }).then((r) => {
      if (!r.ok) { setToast('Phòng không còn tồn tại'); nav('/home', { replace: true }); return }
      const st = r.state
      setMySym(st.you)
      setOpp(st.players.find((p) => p.sym !== st.you) || { name: 'Đối thủ', level: 1, avatar: '🧑' })
      dispatch({ type: 'sync', state: { board: boardFromMoves(st.moves), moves: st.moves, turn: st.turn, time: st.timeLeft, over: st.over } })
    })
    return () => {
      socket.off('game:moved', onMoved); socket.off('game:over', onOver); socket.off('chat:message', onChat)
      socket.off('draw:offered', onOffer); socket.off('draw:declined', onDeclined); socket.off('disconnect', onDisc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Kết thúc: lưu trận + chuyển sang màn kết quả
  useEffect(() => {
    if (!s.over || saved.current) return undefined
    saved.current = true
    const res = resultOf(s.over, mySym)
    const match = {
      id: 'm' + Date.now(), room: code, opponent: opp, result: res, moves: s.moves,
      score: res === 'win' ? '1 - 0' : res === 'lose' ? '0 - 1' : '0 - 0',
      reason: s.over.reason, at: new Date().toISOString(),
    }
    addMatch(match) // TODO: backend sẽ tự lưu, FE chỉ nhận 'game:over'
    const t = setTimeout(() => nav('/result', { state: { match, line: s.over.line }, replace: true }), 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.over])

  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'end' }) }, [msgs])

  if (!user) return null
  const mine = s.turn === (local ? 'X' : mySym) && !s.over // đang tới lượt của "bạn" (bên trái)
  const playing = !s.over && (ai ? s.turn === 'X' : local || s.turn === mySym) // AI: chỉ khi tới lượt bạn; local: cả hai cùng click; online: khi tới lượt mình
  const last = s.moves[s.moves.length - 1]
  const mm = '00:' + String(s.time).padStart(2, '0')
  const soon = (n) => () => setToast(`${n}: tính năng sẽ bổ sung sau`)
  const doLogout = () => { logout(); nav('/login') }

  const leave = () => {
    if (s.over) return nav('/home')
    if (!window.confirm('Thoát phòng sẽ bị xử thua. Bạn chắc chắn?')) return undefined
    if (local) return dispatch({ type: 'resign', side: 'X' }) // AI/LOCAL: thoát = bên X thua
    socket.emit('room:leave')
    return nav('/home')
  }
  const send = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (!local) socket.emit('chat:send', { text })
    setMsgs((m) => [...m, { from: 'me', text }])
    setDraft('')
  }

  const turnLabel = s.over ? REASON[s.over.reason] : mine ? user.name : opp.name
  const photo = photoOf(user.avatar)
  const oppPhoto = photoOf(opp.avatar)

  return (
    <div className="hm-root">
      <div className="hm-stage jr-stage wr-stage gm-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="wr-bg"><Backdrop /></div>
        {PETALS.slice(0, 10).map((p, i) => (
          <i key={i} className="hm-petal" style={{ left: p.x + '%', animationDuration: p.d + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />
        ))}

        <div className="gm-s">
          <button type="button" className="wr-pill wr-back gm-back" onClick={leave}><Chev /><b>Quay lại</b></button>

          {/* ===== tiêu đề phòng ===== */}
          <div className="gm-title">
            <NeonFrame w={329} h={56} c={22} id="gmt" c1="#e8f4ff" c2="#6aa8ff" fill={['rgba(8,12,96,.9)', 'rgba(4,8,70,.94)']} inset={4} sw={1.600} />
            <span className="ico"><Grid /></span>
            <h1>Phòng #{code}</h1>
            <p><span>Chế độ:</span><span><Swords2 /> Caro 15x15</span><i /><span>2 người chơi</span></p>
          </div>

          {/* ===== đồng hồ lượt ===== */}
          <div className="gm-clock">
            <NeonFrame w={122} h={52} c={13} id="gmc" c1="#d9b8ff" c2="#7a4dff" fill={['rgba(14,8,96,.9)', 'rgba(8,4,70,.94)']} inset={3} sw={1.400} />
            <span className="ico"><Clock /></span>
            <small>Thời gian lượt</small>
            <b className={s.time <= 5 && !s.over ? 'low' : ''}>{mm}</b>
          </div>

          {/* ===== người chơi bên trái ===== */}
          <section className="gm-card me">
            <NeonFrame w={166} h={185} c={11} id="gmfl" c1="#5cd0ff" c2="#2f66ff" fill={['rgba(10,22,128,.55)', 'rgba(8,16,104,.78)']} inset={4} sw={2} />
            <div className="gm-av">
              {photo ? <img src={photo} alt="" draggable={false} /> : <b className="emoji">{user.avatar}</b>}
              <span className="ring" />
            </div>
            <div className="gm-info" />
            <span className="gm-crown"><BigCrown /></span>
            <div className="gm-name"><span>{user.name}</span><Crown w={15} h={12} /></div>
            <div className="gm-lv">Lv.{user.level}</div>
            <div className="gm-pill"><ReadyPill label={`Quân ${local ? 'X' : mySym}`} /></div>
          </section>

          {/* ===== chat phòng ===== */}
          <section className="gm-chat">
            <div className="gm-chat-h"><span className="b"><ChatBubble /></span><b>Chat phòng</b></div>
            <div className="gm-chat-l" role="log" aria-live="polite">
              {msgs.map((m, i) => (
                <p key={i}><em>{m.from === 'me' ? user.name : m.from}:</em> {m.text}</p>
              ))}
              <span ref={chatEnd} />
            </div>
            <form className="gm-chat-f" onSubmit={send}>
              <label>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nhập tin nhắn..." maxLength={200} autoComplete="off" />
                <button type="button" className="emo" onClick={() => setDraft((d) => d + '🙂')} aria-label="Chèn emoji"><Smile /></button>
              </label>
              <button type="submit" className="send" aria-label="Gửi"><Send /></button>
            </form>
          </section>

          {/* ===== bàn cờ ===== */}
          <GameBoard board={s.board} onCell={(x, y) => { if (!playing) return; if (local) dispatch({ type: 'move', x, y }); else socket.emit('game:move', { x, y }) }} line={s.over?.line} last={last} disabled={!playing} />

          {/* ===== đối thủ bên phải ===== */}
          <section className="gm-card opp">
            <NeonFrame w={164} h={184} c={11} id="gmfr" c1="#ff63e6" c2="#8a4dff" fill={['rgba(34,12,120,.58)', 'rgba(26,8,96,.78)']} inset={4} sw={2} />
            <div className="gm-oav">{oppPhoto ? <img src={oppPhoto} alt="" draggable={false} /> : opp.avatar ? <b className="emoji">{opp.avatar}</b> : <Silhouette />}<span className="ring" /></div>
            <div className="gm-info opp" />
            <div className="gm-name"><span>{opp.name}</span></div>
            <div className="gm-lv">Lv.{opp.level}</div>
            <div className="gm-stat"><i />{(() => { const o = local ? 'O' : mySym === 'X' ? 'O' : 'X'; return s.turn === o && !s.over ? `Đang đánh (${o})` : `Quân ${o} · chờ lượt` })()}</div>
          </section>

          {/* ===== nút hành động ===== */}
          <button type="button" className="gm-act" style={{ top: 362 }} disabled={!!s.over}
            onClick={() => {
              if (ai) return window.confirm('Đầu hàng và nhận thua?') && dispatch({ type: 'resign', side: 'X' })
              if (local) return window.confirm(`${s.turn === 'X' ? user.name : opp.name} đầu hàng và nhận thua?`) && dispatch({ type: 'resign' })
              return window.confirm('Đầu hàng và nhận thua?') && socket.emit('game:resign')
            }}><Flag /><b>Đầu hàng</b></button>
          <button type="button" className="gm-act" style={{ top: 404 }} disabled={!!s.over || s.moves.length < 6}
            onClick={() => {
              if (local) return window.confirm(ai ? 'Hòa trận với máy?' : 'Hai người đồng ý hòa trận?') && dispatch({ type: 'draw' })
              socket.emit('draw:offer'); return setToast('Đã gửi đề nghị hòa')
            }}><Cycle /><b>Hòa trận</b></button>
          <button type="button" className="gm-act" style={{ top: 446 }} onClick={leave}><Door /><b>Thoát phòng</b></button>

          {/* ===== lượt hiện tại ===== */}
          <div className={`gm-turn ${mine ? 'mine' : ''}`} aria-live="polite">
            <Swords />
            <span>{s.over ? 'Kết thúc: ' : 'Lượt của: '}<b className={mine ? 'me' : 'foe'}>{turnLabel}</b></span>
          </div>
        </div>

        <TopHud user={user} soon={soon} onProfile={() => nav('/profile')} onSettings={() => nav('/settings')} onLogout={doLogout} />
        <img className="wr-logo" src="/img/join-logo.png" alt="X-O Arena" draggable={false} />
      </div>
      {toast}
    </div>
  )
}

const Swords2 = () => (
  <svg width="11" height="11" viewBox="0 0 26 26" aria-hidden style={{ verticalAlign: '-1px' }}>
    <g stroke="#fff" strokeWidth="3.200" strokeLinecap="round"><path d="M4 4l18 18M22 4L4 22" /></g>
  </svg>
)
