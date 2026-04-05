// src/pages/LobbyPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { subscribeRoom, startGame, leaveRoom } from '../lib/gameLogic'

export default function LobbyPage() {
  const { code }    = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [room, setRoom] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = subscribeRoom(code, (data) => {
      if (!data) { navigate('/'); return }
      setRoom(data)
      if (data.status === 'playing') navigate(`/game/${code}`)
    })
    return unsub
  }, [code, navigate])

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blast-muted animate-pulse text-xl font-display">Loading room…</div>
      </div>
    )
  }

  const players   = Object.values(room.players ?? {})
  const isHost    = room.hostId === user?.uid
  const settings  = room.settings ?? {}
  const canStart  = players.length >= 2

  async function handleStart() {
    await startGame(code, room.players, settings)
  }

  async function handleLeave() {
    await leaveRoom(code, user.uid)
    navigate('/')
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-5xl mb-3">💣</div>
          <h1 className="text-4xl font-display font-extrabold text-blast-text neon-text">
            OGABOGABO
          </h1>
          <p className="text-blast-muted mt-1">Waiting for players…</p>
        </div>

        {/* Room code */}
        <div className="card p-5 mb-4 text-center animate-pop-in">
          <p className="text-blast-muted text-sm font-display font-semibold uppercase tracking-widest mb-2">Room Code</p>
          <button
            onClick={copyCode}
            className="font-mono text-5xl font-bold tracking-[0.3em] text-blast-accent hover:text-blast-glow transition-colors duration-200 cursor-pointer select-all"
          >
            {code}
          </button>
          <p className="text-blast-muted text-sm mt-2">{copied ? ' Copied!' : 'Click to copy · Share with friends'}</p>
        </div>

        {/* Settings summary */}
        <div className="card p-4 mb-4 animate-pop-in" style={{ animationDelay: '0.05s' }}>
          <p className="text-blast-muted text-xs font-display font-semibold uppercase tracking-widest mb-3">Room Settings</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-blast-text font-display font-bold capitalize">{settings.difficulty}</p>
              <p className="text-blast-muted text-xs">Difficulty</p>
            </div>
            <div>
              <p className="text-blast-text font-display font-bold">{settings.startingLives} </p>
              <p className="text-blast-muted text-xs">Starting Lives</p>
            </div>
            <div>
              <p className="text-blast-text font-display font-bold">{settings.minTurnSecs}s</p>
              <p className="text-blast-muted text-xs">Min Turn</p>
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="card p-4 mb-6 animate-pop-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-blast-muted text-xs font-display font-semibold uppercase tracking-widest mb-3">
            Players ({players.length}/{settings.maxPlayers})
          </p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-blast-surface rounded-xl px-4 py-3 border border-blast-border"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-9 h-9 rounded-full bg-blast-accent/20 border border-blast-accent/40 flex items-center justify-center text-blast-accent font-display font-bold text-lg">
                  {p.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-blast-text font-display font-semibold flex-1">{p.name}</span>
                {p.isHost && (
                  <span className="text-xs text-blast-warm bg-blast-warm/10 border border-blast-warm/30 rounded-full px-2 py-0.5 font-mono">
                    host
                  </span>
                )}
                {p.id === user?.uid && (
                  <span className="text-xs text-blast-cool bg-blast-cool/10 border border-blast-cool/30 rounded-full px-2 py-0.5 font-mono">
                    you
                  </span>
                )}
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <p className="text-blast-muted text-center text-sm mt-4">
               Need at least 2 players to start
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`btn-primary w-full text-lg py-4 ${!canStart ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''}`}
            >
               Start Game
            </button>
          ) : (
            <div className="card p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blast-accent animate-pulse" />
                <span className="text-blast-muted font-display">Waiting for host to start…</span>
              </div>
            </div>
          )}

          <button onClick={handleLeave} className="btn-secondary w-full">
            ← Leave Room
          </button>
        </div>
      </div>
    </div>
  )
}