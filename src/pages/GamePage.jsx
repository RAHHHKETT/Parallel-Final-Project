// src/pages/GamePage.jsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { subscribeRoom, submitWord, bombExploded, isValidWord } from '../lib/gameLogic'
import BombTimer   from '../components/BombTimer'
import PlayerCard  from '../components/PlayerCard'

export default function GamePage() {
  const { code }  = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [room,    setRoom]    = useState(null)
  const [input,   setInput]   = useState('')
  const [shake,   setShake]   = useState(false)
  const [flash,   setFlash]   = useState(null) // 'good' | 'bad' | 'bonus'
  const [message, setMessage] = useState('')

  const inputRef    = useRef(null)
  const bombFiredRef = useRef(false)

  // Subscribe to room
  useEffect(() => {
    const unsub = subscribeRoom(code, (data) => {
      if (!data) { navigate('/'); return }
      setRoom(data)

      if (data.status === 'finished') {
        navigate(`/results/${code}`)
      }
    })
    return unsub
  }, [code, navigate])

  // Reset bomb-fired flag when turn changes
  useEffect(() => {
    bombFiredRef.current = false
    setInput('')
    setFlash(null)
    setMessage('')
    inputRef.current?.focus()
  }, [room?.game?.currentPlayerId, room?.game?.currentPrompt])

  const game     = room?.game     ?? {}
  const players  = room?.players  ?? {}
  const settings = room?.settings ?? {}

  const isMyTurn    = game.currentPlayerId === user?.uid
  const currentPlayer = players[game.currentPlayerId] ?? {}
  const sortedPlayers = Object.values(players).sort((a, b) => {
    if (a.alive !== b.alive) return b.alive - a.alive
    return (b.score ?? 0) - (a.score ?? 0)
  })

  // Highlight the prompt in the typed word
  function renderHighlightedInput(word, prompt) {
    if (!prompt || !word) return word
    const idx = word.toLowerCase().indexOf(prompt.toLowerCase())
    if (idx === -1) return word
    return (
      <>
        {word.slice(0, idx)}
        <span className="text-blast-accent font-bold underline underline-offset-4">
          {word.slice(idx, idx + prompt.length)}
        </span>
        {word.slice(idx + prompt.length)}
      </>
    )
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!isMyTurn || !input.trim()) return

    const word = input.trim().toLowerCase()
    if (!isValidWord(word, game.currentPrompt)) {
      setShake(true)
      setFlash('bad')
      setMessage(' Word must contain "' + game.currentPrompt + '"')
      setTimeout(() => { setShake(false); setFlash(null); setMessage('') }, 1500)
      return
    }

    try {
      const result = await submitWord(code, user.uid, word, game.currentPrompt, settings)
      if (result.success) {
        setFlash('good')
        if (result.bonusLife) {
          setFlash('bonus')
          setMessage(' All letters used! +1 Life!')
          setTimeout(() => { setFlash(null); setMessage('') }, 2000)
        }
      } else {
        setShake(true)
        setFlash('bad')
        setMessage(' ' + (result.reason === 'invalid' ? 'Invalid word' : 'Error'))
        setTimeout(() => { setShake(false); setFlash(null); setMessage('') }, 1500)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleBombExplode = useCallback(async () => {
    if (bombFiredRef.current) return
    bombFiredRef.current = true
    if (game.currentPlayerId) {
      await bombExploded(code, game.currentPlayerId, settings)
    }
  }, [code, game.currentPlayerId, settings])

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blast-muted animate-pulse text-xl font-display">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blast-border bg-blast-surface/50 backdrop-blur-sm">
        <div className="font-display font-bold text-blast-text text-lg">
          💣 <span className="neon-text">OGABOGABO</span>
        </div>
        <div className="font-mono text-blast-muted text-sm">
          Room: <span className="text-blast-text tracking-widest">{code}</span>
        </div>
        <div className="font-display text-blast-muted text-sm">
          Round {game.roundNumber ?? 1}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Players sidebar */}
        <aside className="w-56 shrink-0 border-r border-blast-border bg-blast-surface/30 p-3 overflow-y-auto space-y-2 hidden md:block">
          <p className="text-blast-muted text-xs font-display font-semibold uppercase tracking-widest px-1 mb-3">Players</p>
          {sortedPlayers.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              isActive={p.id === game.currentPlayerId}
              isMe={p.id === user?.uid}
              isEliminated={!p.alive}
            />
          ))}
        </aside>

        {/* Main arena */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">

          {/* Who's turn */}
          <motion.div
            key={game.currentPlayerId}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            {isMyTurn ? (
              <p className="text-2xl font-display font-bold text-blast-accent animate-glow-pulse">
                ⚡ Your turn!
              </p>
            ) : (
              <p className="text-xl font-display text-blast-muted">
                <span className="text-blast-text font-bold">{currentPlayer.name}</span>'s turn
              </p>
            )}
          </motion.div>

          {/* Bomb */}
          <motion.div
            key={`${game.currentPlayerId}-${game.currentPrompt}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {game.turnStartTime && game.turnDuration && (
              <BombTimer
                turnDuration={game.turnDuration}
                turnStartTime={game.turnStartTime}
                isMyTurn={isMyTurn}
                onExplode={handleBombExplode}
              />
            )}
          </motion.div>

          {/* Prompt */}
          <motion.div
            key={game.currentPrompt}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="prompt-highlight px-8 py-4 rounded-2xl"
          >
            <p className="text-blast-muted text-xs font-display font-semibold uppercase tracking-widest text-center mb-1">Contains</p>
            <p className="font-mono font-bold text-4xl text-blast-accent text-center tracking-widest">
              {game.currentPrompt?.toUpperCase()}
            </p>
          </motion.div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className={`
              relative rounded-2xl border-2 transition-all duration-200
              ${isMyTurn
                ? flash === 'good'  ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]'
                : flash === 'bad'   ? 'border-blast-hot shadow-[0_0_20px_rgba(255,77,109,0.4)]'
                : flash === 'bonus' ? 'border-blast-cool shadow-[0_0_20px_rgba(61,217,235,0.5)]'
                : 'border-blast-accent shadow-[0_0_15px_rgba(124,92,252,0.3)]'
                : 'border-blast-border'
              }
              ${shake ? 'animate-shake' : ''}
            `}>
              <div className="bg-transparent text-center px-4 py-4 font-mono text-2xl font-semibold text-blast-text min-h-[68px] flex items-center justify-center">
                {input ? renderHighlightedInput(input, game.currentPrompt) : (
                  <span className="text-blast-muted text-lg">
                    {isMyTurn ? 'Type a word…' : 'Waiting…'}
                  </span>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={!isMyTurn}
                className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            {/* Feedback message */}
            <AnimatePresence>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center text-sm font-display mt-2
                    ${flash === 'bonus' ? 'text-blast-cool' : flash === 'bad' ? 'text-blast-hot' : 'text-green-400'}`}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>

            {isMyTurn && (
              <button type="submit" className="btn-primary w-full mt-3 text-lg py-3">
                Submit ↵
              </button>
            )}
          </form>

          {/* Mobile players */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 w-full max-w-sm">
            {sortedPlayers.map(p => (
              <div
                key={p.id}
                className={`shrink-0 card p-3 text-center min-w-[90px] transition-all duration-200
                  ${p.id === game.currentPlayerId ? 'player-active' : ''}
                  ${!p.alive ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="text-xl">{!p.alive ? 'dead' : p.name?.[0]?.toUpperCase()}</div>
                <p className="text-blast-text text-xs font-display font-bold mt-1 truncate">{p.name}</p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {Array.from({ length: Math.max(p.lives ?? 0, 0) }, (_, i) => (
                    <span key={i} className="text-[10px]"></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}