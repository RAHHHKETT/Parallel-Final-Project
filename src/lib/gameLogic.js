// src/lib/gameLogic.js
// Core game utilities: prompts, validation, room helpers

import { db } from './firebase'
import {
  ref, set, get, push, update, remove,
  onValue, off, serverTimestamp, increment
} from 'firebase/database'

// ─── Prompt syllables by difficulty ──────────────────────────────────────────
// Beginner: common 2-letter combos  |  Medium: 3-letter  |  Hard: rarer combos
const PROMPTS = {
  easy: [
    'ab','ac','ad','ae','af','ag','ah','ai','al','ak','am','an','ap','ar','as','at','aw','ax','ay','aq','au','av','az',
    'be','bi','bl','br','by','ba','bb','bc','bd','be','bf','bg','bh','bm','bn','bp','bs','bt','bl','bo','bu','bv','bw','by','bz',
    'ca','cb','cc','cd','ce','cf','ch','ci','ck','cl','cm','cn','co','cr','cs','ct','cu','cv','cw','cy','cz',
    'da','db','dc','dd','de','df','dg','di','dj','dk','dl','dm','dn','do','dp','dr','ds','dt','du','dv','dw','dy','dz',
    'ea','eb','ec','ed','ee','ef','eg','eh','ei','el','em','en','eo','ep','er','es','et','eu','ev','ew','ex','ey','ez',
    'fa','fb','fc','fd','fe','ff','fg','fi','fj','fk','fl','fm','fn','fo','fp','fr','fs','ft','fu','fv','fw','fy','fz',
    'ga','gb','gc','gd','ge','gf','gg','gi','gj','gk','gl','gm','gn','go','gp','gr','gs','gt','gu','gv','gw','gy','gz',
    'ha','hb','hc','hd','he','hf','hg','hi','hj','hk','hl','hm','hn','ho','hp','hr','hs','ht','hu','hv','hw','hy','hz',
    'ia','ib','ic','id','ie','if','ig','ih','ii','il','im','in','io','ip','ir','is','it','iu','iv','iw','ix','iy','iz',
    'ja','jb','jc','jd','je','jf','jg','ji','jj','jk','jl','jm','jn','jo','jp','jr','js','jt','ju','jv','jw','jy','jz',
    'ka','kb','kc','kd','ke','kf','kg','ki','kj','kk','kl','km','kn','ko','kp','kr','ks','kt','ku','kv','kw','ky','kz',
    'la','lb','lc','ld','le','lf','lg','li','lj','lk','ll','lm','ln','lo','lp','lr','ls','lt','lu','lv','lw','ly','lz',
    'ma','mb','mc','md','me','mf','mg','mi','mj','mk','ml','mm','mn','mo','mp','mr','ms','mt','mu','mv','mw','my','mz',
    'na','nb','nc','nd','ne','nf','ng','ni','nj','nk','nl','nm','nn','no','np','nr','ns','nt','nu','nv','nw','ny','nz',
    'oa','ob','oc','od','oe','of','og','oh','oi','oj','ok','ol','om','on','oo','op','or','os','ot','ou','ov','ow','ox','oy','oz',
    'pa','pb','pc','pd','pe','pf','pg','pi','pj','pk','pl','pm','pn','po','pp','pr','ps','pt','pu','pv','pw','py','pz',
    'qa','qb','qc','qd','qe','qf','qg','qi','qj','qk','ql','qm','qn','qo','qp','qr','qs','qt','qu','qv','qw','qy','qz',
    'ra','rb','rc','rd','re','rf','rg','ri','rj','rk','rl','rm','rn','ro','rp','rr','rs','rt','ru','rv','rw','ry','rz',
    'sa','sb','sc','sd','se','sf','sg','si','sj','sk','sl','sm','sn','so','sp','sq','sr','ss','st','su','sv','sw','sy','sz',
    'ta','tb','tc','td','te','tf','tg','ti','tj','tk','tl','tm','tn','to','tp','tr','ts','tt','tu','tv','tw','ty','tz',
    'ua','ub','uc','ud','ue','uf','ug','uh','ui','uj','uk','ul','um','un','uo','up','ur','us','ut','uv','uw','ux','uy','uz',
    'va','vb','vc','vd','ve','vf','vg','vi','vj','vk','vl','vm','vn','vo','vp','vr','vs','vt','vu','vv','vw','vy','vz',
    'wa','wb','wc','wd','we','wf','wg','wi','wj','wk','wl','wm','wn','wo','wp','wr','ws','wt','wu','wv','ww','wy','wz',
    'xa','xb','xc','xd','xe','xf','xg','xi','xj','xk','xl','xm','xn','xo','xp','xr','xs','xt','xu','xv','xw','xy','xz',
    'ya','yb','yc','yd','ye','yf','yg','yi','yj','yk','yl','ym','yn','yo','yp','yr','ys','yt','yu','yv','yw','yy','yz',
    'za','zb','zc','zd','ze','zf','zg','zi','zj','zk','zl','zm','zn','zo','zp','zr','zs','zt','zu','zv','zw','zy','zz'

    
  ],
  hard: [
    'ack','age','aid','aim','air','all','amp','and','ant','any','arc','are',
    'cat','car','can','cap','cal',
    'cer','cen','ces','cet','cel',
    'chi','cho','cha','che','chu',
    'cla','cle','cli','clo','clu',
    'com','con','cor','col','cou',
    'cra','cre','cri','cro','cru',
    'dra','dre','dri','dro','due',
    'ear','eat','ell','end','ent',
    'era','ere','ers','est','eve',
    'for','fro','fur','far','fit',
    'da','db','dc','dd','de','df','dg','di','dj','dk','dl','dm','dn','do','dp','dr','ds','dt','du','dv','dw','dy','dz',
    'ea','eb','ec','ed','ee','ef','eg','eh','ei','el','em','en','eo','ep','er','es','et','eu','ev','ew','ex','ey','ez',
    'fa','fb','fc','fd','fe','ff','fg','fi','fj','fk','fl','fm','fn','fo','fp','fr','fs','ft','fu','fv','fw','fy','fz',
    'ga','gb','gc','gd','ge','gf','gg','gi','gj','gk','gl','gm','gn','go','gp','gr','gs','gt','gu','gv','gw','gy','gz',
    'ha','hb','hc','hd','he','hf','hg','hi','hj','hk','hl','hm','hn','ho','hp','hr','hs','ht','hu','hv','hw','hy','hz',
    'ia','ib','ic','id','ie','if','ig','ih','ii','il','im','in','io','ip','ir','is','it','iu','iv','iw','ix','iy','iz',
    'ja','jb','jc','jd','je','jf','jg','ji','jj','jk','jl','jm','jn','jo','jp','jr','js','jt','ju','jv','jw','jy','jz',
    'ka','kb','kc','kd','ke','kf','kg','ki','kj','kk','kl','km','kn','ko','kp','kr','ks','kt','ku','kv','kw','ky','kz',
    'la','lb','lc','ld','le','lf','lg','li','lj','lk','ll','lm','ln','lo','lp','lr','ls','lt','lu','lv','lw','ly','lz',
    'ma','mb','mc','md','me','mf','mg','mi','mj','mk','ml','mm','mn','mo','mp','mr','ms','mt','mu','mv','mw','my','mz',
    'na','nb','nc','nd','ne','nf','ng','ni','nj','nk','nl','nm','nn','no','np','nr','ns','nt','nu','nv','nw','ny','nz'
  ],

}

// ─── Room helpers ─────────────────────────────────────────────────────────────

/** Generate a random 4-char room code like "XKZQ" */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Pick a random prompt syllable based on difficulty */
export function getRandomPrompt(difficulty = 'easy') {
  const list = PROMPTS[difficulty] ?? PROMPTS.easy
  return list[Math.floor(Math.random() * list.length)]
}

/** Create a new room in Realtime DB */
export async function createRoom(hostId, hostName, settings = {}) {
  const code = generateRoomCode()
  const roomRef = ref(db, `rooms/${code}`)

  const roomData = {
    code,
    hostId,
    status: 'waiting',       // waiting | playing | finished
    createdAt: serverTimestamp(),
    settings: {
      difficulty:    settings.difficulty    ?? 'easy',
      minTurnSecs:   settings.minTurnSecs   ?? 5,
      startingLives: settings.startingLives ?? 2,
      maxLives:      settings.maxLives      ?? 3,
      maxPlayers:    settings.maxPlayers    ?? 8,
    },
    game: {
      currentPrompt:    null,
      currentPlayerId:  null,
      turnStartTime:    null,
      turnDuration:     null,
      roundNumber:      0,
    },
    players: {
      [hostId]: {
        id:     hostId,
        name:   hostName,
        lives:  settings.startingLives ?? 2,
        alive:  true,
        score:  0,
        usedLetters: '',
        joinedAt: serverTimestamp(),
        isHost: true,
      }
    }
  }

  await set(roomRef, roomData)
  return code
}

/** Join an existing room */
export async function joinRoom(code, playerId, playerName) {
  const roomRef  = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) throw new Error('Room not found')
  const room = snapshot.val()
  if (room.status !== 'waiting') throw new Error('Game already started')

  const players = room.players ?? {}
  const count   = Object.keys(players).length
  if (count >= room.settings.maxPlayers) throw new Error('Room is full')

  const playerRef = ref(db, `rooms/${code}/players/${playerId}`)
  await set(playerRef, {
    id:     playerId,
    name:   playerName,
    lives:  room.settings.startingLives,
    alive:  true,
    score:  0,
    usedLetters: '',
    joinedAt: serverTimestamp(),
    isHost: false,
  })

  return room
}

/** Remove a player from a room */
export async function leaveRoom(code, playerId) {
  await remove(ref(db, `rooms/${code}/players/${playerId}`))
}

// ─── Game flow ────────────────────────────────────────────────────────────────

/** Start the game (host only) */
export async function startGame(code, players, settings) {
  const playerIds   = Object.keys(players)
  const firstPlayer = playerIds[Math.floor(Math.random() * playerIds.length)]
  const prompt      = getRandomPrompt(settings.difficulty)
  const turnDur     = (settings.minTurnSecs + Math.floor(Math.random() * 5)) * 1000

  await update(ref(db, `rooms/${code}`), {
    status: 'playing',
    'game/currentPrompt':   prompt,
    'game/currentPlayerId': firstPlayer,
    'game/turnStartTime':   Date.now(),
    'game/turnDuration':    turnDur,
    'game/roundNumber':     1,
  })
}

/** Submit a word guess */
export async function submitWord(code, playerId, word, prompt, settings) {
  const valid = isValidWord(word, prompt)

  if (!valid) {
    // Shake + do nothing — client handles the animation
    return { success: false, reason: 'invalid' }
  }

  const roomSnap   = await get(ref(db, `rooms/${code}`))
  const room       = roomSnap.val()
  const players    = room.players
  const playerIds  = Object.keys(players).filter(id => players[id].alive)

  if (playerIds.length === 0) return { success: false, reason: 'no_players' }

  // Advance turn
  const currentIdx = playerIds.indexOf(playerId)
  const nextIdx    = (currentIdx + 1) % playerIds.length
  const nextPlayer = playerIds[nextIdx]
  const nextPrompt = getRandomPrompt(settings.difficulty)
  const turnDur    = (settings.minTurnSecs + Math.floor(Math.random() * 5)) * 1000

  // Track used letters for bonus life mechanic
  const player   = players[playerId]
  const usedSoFar = player.usedLetters ?? ''
  const newLetters = updateUsedLetters(usedSoFar, word)
  const bonusLife  = newLetters.length === 26 && usedSoFar.length < 26

  const updates = {
    [`rooms/${code}/players/${playerId}/usedLetters`]: newLetters,
    [`rooms/${code}/players/${playerId}/score`]:       increment(word.length * 10),
    [`rooms/${code}/game/currentPrompt`]:              nextPrompt,
    [`rooms/${code}/game/currentPlayerId`]:            nextPlayer,
    [`rooms/${code}/game/turnStartTime`]:              Date.now(),
    [`rooms/${code}/game/turnDuration`]:               turnDur,
  }

  if (bonusLife) {
    const newLives = Math.min((player.lives ?? 0) + 1, settings.maxLives ?? 3)
    updates[`rooms/${code}/players/${playerId}/lives`]       = newLives
    updates[`rooms/${code}/players/${playerId}/usedLetters`] = ''
  }

  await update(ref(db), updates)
  return { success: true, bonusLife }
}

/** Called when a player's bomb explodes (timer runs out) */
export async function bombExploded(code, playerId, settings) {
  const roomSnap = await get(ref(db, `rooms/${code}`))
  if (!roomSnap.exists()) return
  const room    = roomSnap.val()
  const players = room.players

  const player   = players[playerId]
  const newLives = (player.lives ?? 1) - 1
  const stillAlive = newLives > 0

  const playerIds  = Object.keys(players).filter(id => players[id].alive)
  const currentIdx = playerIds.indexOf(playerId)
  const nextPlayer = (() => {
    // If dying, remove from active list first
    const active = stillAlive ? playerIds : playerIds.filter(id => id !== playerId)
    if (active.length === 0) return null
    return active[(currentIdx) % active.length]
  })()

  const alivePlayers = stillAlive
    ? playerIds
    : playerIds.filter(id => id !== playerId)

  const updates = {
    [`rooms/${code}/players/${playerId}/lives`]: newLives,
    [`rooms/${code}/players/${playerId}/alive`]: stillAlive,
  }

  if (alivePlayers.length <= 1) {
    // Game over!
    const winnerId = alivePlayers[0] ?? null
    updates[`rooms/${code}/status`]       = 'finished'
    updates[`rooms/${code}/game/winnerId`] = winnerId
  } else {
    const nextPrompt = getRandomPrompt(settings.difficulty)
    const turnDur    = (settings.minTurnSecs + Math.floor(Math.random() * 5)) * 1000
    updates[`rooms/${code}/game/currentPlayerId`] = nextPlayer
    updates[`rooms/${code}/game/currentPrompt`]   = nextPrompt
    updates[`rooms/${code}/game/turnStartTime`]   = Date.now()
    updates[`rooms/${code}/game/turnDuration`]    = turnDur
  }

  await update(ref(db), updates)
  return { eliminated: !stillAlive, gameOver: alivePlayers.length <= 1 }
}

// ─── Word validation (client-side, fast) ─────────────────────────────────────

/**
 * Basic client-side word check:
 * 1. Must contain the prompt substring (case-insensitive)
 * 2. Must be at least 3 characters long
 * 3. Only letters allowed
 *
 * Note: For production, pair with a server-side dictionary check
 * via Cloud Functions (see /functions/index.js).
 */
export function isValidWord(word, prompt) {
  if (!word || !prompt) return false
  const w = word.toLowerCase().trim()
  const p = prompt.toLowerCase()
  if (w.length < 3) return false
  if (!/^[a-z]+$/.test(w)) return false
  if (!w.includes(p)) return false
  return true
}

/** Track which alphabet letters a player has used */
function updateUsedLetters(current, word) {
  const set = new Set(current.split(''))
  for (const ch of word.toLowerCase()) {
    if (ch >= 'a' && ch <= 'z') set.add(ch)
  }
  return Array.from(set).sort().join('')
}

// ─── Realtime listeners ───────────────────────────────────────────────────────

export function subscribeRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`)
  onValue(roomRef, (snap) => callback(snap.val()))
  return () => off(roomRef)
}

export function subscribePlayers(code, callback) {
  const playersRef = ref(db, `rooms/${code}/players`)
  onValue(playersRef, (snap) => callback(snap.val() ?? {}))
  return () => off(playersRef)
}