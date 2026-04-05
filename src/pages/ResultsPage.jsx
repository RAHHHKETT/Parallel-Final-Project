// src/pages/ResultsPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { subscribeRoom } from '../lib/gameLogic'
import { ref, remove } from 'firebase/database'
import { db } from '../lib/firebase'

export default function ResultsPage() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)

  useEffect(() => {
    const unsub = subscribeRoom(code, (data) => {
      if (!data) { navigate('/'); return }
      setRoom(data)
    })
    return unsub
  }, [code, navigate])

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blast-muted animate-pulse text-xl font-display">Loading results…</div>
      </div>
    )
  }

  const players  = Object.values(room.players ?? {})
  const winnerId = room.game?.winnerId
  const winner   = room.players?.[winnerId]
  const isWinner = winnerId === user?.uid

  const sorted = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  async function handlePlayAgain() {
    await remove(ref(db, `rooms/${code}/game/winnerId`))
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Winner announcement */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">{isWinner ? '🏆' : '💀'}</div>
          <h1 className="text-5xl font-display font-extrabold text-blast-text neon-text mb-2">
            {isWinner ? 'You Won!' : 'Game Over'}
          </h1>
          {winner && (
            <p className="text-blast-muted text-xl">
              <span className="text-blast-accent font-bold">{winner.name}</span> wins the round!
            </p>
          )}
        </motion.div>

        {/* Scoreboard */}
        <div className="card p-5 mb-6">
          <p className="text-blast-muted text-xs font-display font-semibold uppercase tracking-widest mb-4">Final Scores</p>
          <div className="space-y-3">
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border
                  ${p.id === winnerId
                    ? 'bg-blast-accent/15 border-blast-accent/50'
                    : 'bg-blast-surface border-blast-border'
                  }`}
              >
                <span className="font-display font-bold text-xl w-8 text-center shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-lg shrink-0
                  ${p.id === winnerId ? 'bg-blast-accent text-white' : 'bg-blast-card border border-blast-border text-blast-muted'}`}>
                  {p.alive ? p.name?.[0]?.toUpperCase() : '💀'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-display font-bold text-blast-text truncate">{p.name}</span>
                    {p.id === user?.uid && (
                      <span className="text-[10px] text-blast-cool bg-blast-cool/10 border border-blast-cool/30 rounded px-1 font-mono shrink-0">you</span>
                    )}
                  </div>
                  <p className="text-blast-muted text-xs font-mono">{p.usedLetters?.length ?? 0}/26 letters used</p>
                </div>

                <span className="font-mono font-bold text-blast-text text-lg shrink-0">
                  {p.score ?? 0}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={handlePlayAgain} className="btn-primary w-full text-lg py-4">
            🎮 Play Again
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary w-full">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}