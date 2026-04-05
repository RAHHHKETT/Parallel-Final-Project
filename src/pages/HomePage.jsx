// src/pages/HomePage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { createRoom, joinRoom } from '../lib/gameLogic'

export default function HomePage() {
  const { user, setDisplayName } = useAuth()
  const navigate = useNavigate()

  const [name,      setName]      = useState(user?.displayName ?? '')
  const [joinCode,  setJoinCode]  = useState('')
  const [tab,       setTab]       = useState('create') // 'create' | 'join'
  const [settings,  setSettings]  = useState({
    difficulty:    'medium',
    minTurnSecs:   5,
    startingLives: 2,
    maxLives:      3,
    maxPlayers:    8,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name first!'); return }
    setLoading(true); setError('')
    try {
      await setDisplayName(name.trim())
      const code = await createRoom(user.uid, name.trim(), settings)
      navigate(`/lobby/${code}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!name.trim())       { setError('Enter your name first!'); return }
    if (!joinCode.trim())   { setError('Enter a room code!');     return }
    setLoading(true); setError('')
    try {
      await setDisplayName(name.trim())
      await joinRoom(joinCode.toUpperCase(), user.uid, name.trim())
      navigate(`/lobby/${joinCode.toUpperCase()}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="text-8xl mb-4 select-none">💣</div>
        <h1 className="text-6xl font-display font-extrabold neon-text text-blast-text mb-3">
          OGABOGABO
        </h1>
        <p className="text-blast-muted text-lg max-w-sm mx-auto">
          Type a word before the bomb explodes. Last player standing wins.
        </p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md p-6 animate-pop-in" style={{ animationDelay: '0.1s' }}>
        {/* Name */}
        <div className="mb-5">
          <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">Your Name</label>
          <input
            className="input-field"
            placeholder="Enter your name…"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-blast-surface border border-blast-border mb-5 p-1">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-lg font-display font-semibold text-sm transition-all duration-200 capitalize
                ${tab === t
                  ? 'bg-blast-accent text-white shadow-lg'
                  : 'text-blast-muted hover:text-blast-text'
                }`}
            >
              {t === 'create' ? ' Create Room' : ' Join Room'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'create' ? (
          <div className="space-y-4">
            {/* Difficulty */}
            <div>
              <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setSettings(s => ({ ...s, difficulty: d }))}
                    className={`py-2 rounded-lg text-sm font-display font-semibold capitalize transition-all duration-200
                      ${settings.difficulty === d
                        ? d === 'easy' ? 'bg-green-500/20 border border-green-500/60 text-green-400'
                          : d === 'medium' ? 'bg-blast-accent/20 border border-blast-accent/60 text-blast-glow'
                          : 'bg-blast-hot/20 border border-blast-hot/60 text-blast-hot'
                        : 'bg-blast-surface border border-blast-border text-blast-muted hover:border-blast-accent'
                      }`}
                  >
                    {d === 'hans easy' ? '' : d === 'seth = medium' ? 'Oga = very hard' : ''} {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div>
              <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">
                Min Turn Duration: <span className="text-blast-text">{settings.minTurnSecs}s</span>
              </label>
              <input
                type="range" min={3} max={15} value={settings.minTurnSecs}
                onChange={e => setSettings(s => ({ ...s, minTurnSecs: +e.target.value }))}
                className="w-full accent-blast-accent"
              />
            </div>

            {/* Lives */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">
                  Starting Lives
                </label>
                <select
                  value={settings.startingLives}
                  onChange={e => setSettings(s => ({ ...s, startingLives: +e.target.value }))}
                  className="input-field text-base py-2"
                >
                  {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">
                  Max Players
                </label>
                <select
                  value={settings.maxPlayers}
                  onChange={e => setSettings(s => ({ ...s, maxPlayers: +e.target.value }))}
                  className="input-field text-base py-2"
                >
                  {[2,4,6,8,12,16].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-blast-hot text-sm text-center">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating…' : ' Create a Room'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-blast-muted text-sm mb-2 font-display font-semibold uppercase tracking-wider">Room Code</label>
              <input
                className="input-field uppercase tracking-widest text-2xl text-center font-mono"
                placeholder="XXXX"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0,4))}
                maxLength={4}
              />
            </div>

            {error && <p className="text-blast-hot text-sm text-center">{error}</p>}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Joining…' : '🚪 Join Room'}
            </button>
          </div>
        )}
      </div>

      <p className="text-blast-muted text-xxl mt-8 text-center">
        Hans Doncic vs Seth Bol Bol
      </p>
    </div>
  )
}