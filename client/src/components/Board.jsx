import { Sym } from './Layout.jsx'

export function Board({ board, onCell, line, last, disabled }) {
  const lineSet = new Set((line || []).map(([x, y]) => `${x},${y}`))
  return (
    <div className="board">
      {board.map((row, y) =>
        row.map((v, x) => {
          const cls = ['cell', v || '', v ? 'filled' : '']
          if (last && last.x === x && last.y === y) cls.push('last')
          if (lineSet.has(`${x},${y}`)) cls.push('line')
          return (
            <button
              key={`${x}-${y}`}
              className={cls.join(' ')}
              disabled={disabled || !!v}
              onClick={() => onCell?.(x, y)}
              aria-label={`Ô ${x + 1},${y + 1}`}
            >
              <Sym s={v} />
            </button>
          )
        }),
      )}
    </div>
  )
}

// Bàn cờ thu nhỏ, tự cắt theo vùng có quân
export function MiniBoard({ moves }) {
  if (!moves?.length) return null
  const xs = moves.map((m) => m.x)
  const ys = moves.map((m) => m.y)
  const x0 = Math.max(0, Math.min(...xs) - 1)
  const x1 = Math.min(14, Math.max(...xs) + 1)
  const y0 = Math.max(0, Math.min(...ys) - 1)
  const y1 = Math.min(14, Math.max(...ys) + 1)
  const map = new Map(moves.map((m) => [`${m.x},${m.y}`, m.s]))
  const cells = []
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const s = map.get(`${x},${y}`)
      cells.push(<i key={`${x},${y}`} className={s || ''}>{s === 'X' ? '✕' : s === 'O' ? '◯' : ''}</i>)
    }
  }
  return <div className="mini" style={{ gridTemplateColumns: `repeat(${x1 - x0 + 1}, 9px)` }}>{cells}</div>
}
