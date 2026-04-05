// src/components/PlayerCard.jsx
import { motion } from 'framer-motion'

export default function PlayerCard({ player, isActive, isMe, isEliminated }) {
  const hearts = Array.from({ length: 3 }, (_, i) => i < player.lives)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isEliminated ? 0.4 : 1, scale: 1 }}
      className={`
        card p-4 flex flex-col gap-2 transition-all duration-300
        ${isActive && !isEliminated ? 'player-active' : ''}
        ${isEliminated ? 'grayscale' : ''}
      `}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          font-display font-bold text-xl shrink-0
          ${isActive ? 'bg-blast-accent text-white' : 'bg-blast-surface border border-blast-border text-blast-muted'}
        `}>
          {isEliminated ? '💀' : player.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`font-display font-bold text-sm truncate ${isEliminated ? 'line-through text-blast-muted' : 'text-blast-text'}`}>
              {player.name}
            </span>
            {isMe && (
              <span className="text-[10px] text-blast-cool bg-blast-cool/10 border border-blast-cool/30 rounded px-1 font-mono shrink-0">
                you
              </span>
            )}
          </div>
          <p className="text-blast-muted text-xs font-mono">{player.score ?? 0} pts</p>
        </div>
      </div>

      {/* Lives */}
      <div className="flex items-center gap-1.5">
        {hearts.map((alive, i) => (
          <motion.div
            key={i}
            animate={alive ? { scale: [1, 1.2, 1] } : { scale: 0.8, opacity: 0.3 }}
            transition={{ duration: 0.3 }}
            className={`text-base ${alive ? '' : 'grayscale'}`}
          >
            {alive ? '❤️' : '🖤'}
          </motion.div>
        ))}
      </div>

      {/* Used letters progress */}
      {!isEliminated && (
        <div className="flex flex-wrap gap-0.5">
          {'abcdefghijklmnopqrstuvwxyz'.split('').map(ch => {
            const used = player.usedLetters?.includes(ch)
            return (
              <span
                key={ch}
                className={`text-[9px] font-mono font-bold px-0.5 rounded
                  ${used ? 'text-blast-cool' : 'text-blast-border'}`}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}