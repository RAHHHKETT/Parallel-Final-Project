// src/components/BombTimer.jsx
// Animated SVG bomb with a countdown ring

import { useEffect, useRef, useState } from 'react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function BombTimer({ turnDuration, turnStartTime, isMyTurn, onExplode }) {
  const [progress, setProgress] = useState(1)
  const [exploded, setExploded] = useState(false)
  const rafRef    = useRef(null)
  const firedRef  = useRef(false)

  useEffect(() => {
    firedRef.current = false
    setExploded(false)

    function tick() {
      const elapsed  = Date.now() - turnStartTime
      const ratio    = Math.max(0, 1 - elapsed / turnDuration)
      setProgress(ratio)

      if (ratio <= 0 && !firedRef.current) {
        firedRef.current = true
        setExploded(true)
        onExplode?.()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [turnDuration, turnStartTime])

  // Color: green → yellow → orange → red
  const r = Math.round(255 * (1 - progress) * 2)
  const g = Math.round(255 * progress * 2)
  const ringColor = progress > 0.5
    ? `rgb(${Math.min(255, r)}, 220, 50)`
    : `rgb(255, ${Math.max(0, g)}, 50)`

  const offset = CIRCUMFERENCE * (1 - progress)
  const isUrgent = progress < 0.3

  if (exploded) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-7xl explosion">💥</div>
        <p className="text-blast-hot font-display font-bold text-lg mt-2">BOOM!</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center ${isUrgent && isMyTurn ? 'animate-bomb-tick' : ''}`}>
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="bomb-ring"
            style={{
              filter: isUrgent ? `drop-shadow(0 0 8px ${ringColor})` : 'none',
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease'
            }}
          />
          {/* Bomb emoji */}
          <text x="70" y="78" textAnchor="middle" fontSize="42" dominantBaseline="middle">
            💣
          </text>
        </svg>
      </div>
      <p className="text-blast-muted text-sm font-mono mt-1">
        {Math.ceil((turnDuration * progress) / 1000)}s
      </p>
    </div>
  )
}