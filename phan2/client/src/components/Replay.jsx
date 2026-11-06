import { useMemo, useState } from 'react'
import { Modal } from './Layout.jsx'
import { Board } from './Board.jsx'
import { boardFromMoves } from '../lib/game.js'

/* Hộp thoại xem lại trận (kéo thanh trượt để chạy lại từng nước đi). Dùng cho màn Lịch sử đấu. */
export default function Replay({ match, onClose }) {
  const [step, setStep] = useState(match.moves.length)
  const board = useMemo(() => boardFromMoves(match.moves, step), [match, step])
  return (
    <Modal onClose={onClose}>
      <div className="panel-title">▶ Xem lại trận với {match.opponent.name}</div>
      <div className="center" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block', '--cell': '20px' }}><Board board={board} disabled last={match.moves[step - 1]} /></div>
      </div>
      <div className="row" style={{ margin: '10px 0' }}>
        <button className="btn sm" onClick={() => setStep(Math.max(0, step - 1))}>‹</button>
        <input type="range" min="0" max={match.moves.length} value={step} onChange={(e) => setStep(+e.target.value)} />
        <button className="btn sm" onClick={() => setStep(Math.min(match.moves.length, step + 1))}>›</button>
        <span className="muted">{step}/{match.moves.length}</span>
      </div>
      <button className="btn block" onClick={onClose}>Đóng</button>
    </Modal>
  )
}
