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
    'at','be','do','go','he','in','it','me','my','no','of','on','or','so','to',
    'up','us','we','an','by','if','is','oh','as','am','en','er','al','le','re',
    'ab','ac','ad','ag','ai','aj','ak','am','ap','aq','ar','au','av','aw','ax',
    'ay','az','ba','bi','bo','bu','ca','ce','ci','co','cu','cy','da','de','di',
  ],
  medium: [
    'ack','age','aid','aim','air','all','amp','and','ant','any','arc','are',
    'ark','arm','art','ash','ask','ate','ear','eat','eel','egg','ego','elf',
    'elm','end','era','eve','eye','fat','few','fig','fit','fly','fog','for',
    'fox','fun','fur','gel','gem','get','god','got','gun','gut','gym','had',
    'ham','has','hat','hay','her','him','his','hit','hot','how','hub','hug',
    'ice','ill','imp','ink','inn','ion','ire','ivy','jab','jam','jar','jaw',
    'lay','led','leg','let','lid','lip','lit','log','lot','low','map','mat',
    'max','may','mob','mod','mop','mud','mug','nap','net','new','nip','nod',
    'nun','nut','oak','oar','odd','ode','oil','old','opt','orb','our','out',
    'owl','own','pad','pan','pat','paw','pay','pea','peg','pen','pet','pie',
  ],
  hard: [
    'acht','acqu','aest','agni','aign','ailt','aint','aird','airm','aith',
    'ckle','ckly','cque','ctly','ddle','dged','dger','dges','dght','dgle',
    'ffly','ggle','ghly','ggle','gnly','gued','gues','ical','ical','ight',
    'ique','isme','itch','ized','izer','izes','ject','jtle','kdge','kght',
    'knit','know','ldom','ldly','ldst','lest','lfth','lgth','lkly','llth',
    'phth','psyc','ptly','quel','queu','quip','quiz','rack','rdly','rful',
    'rght','rrho','rthy','sque','stly','stle','tchy','tght','tion','tled',
    'tlng','tmph','tnes','tney','tphs','tque','tsch','ttph','tual','twit',
  ]
}

// ─── Room helpers ─────────────────────────────────────────────────────────────

/** Generate a random 4-char room code like "XKZQ" */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Pick a random prompt syllable based on difficulty */
export function getRandomPrompt(difficulty = 'medium') {
  const list = PROMPTS[difficulty] ?? PROMPTS.medium
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
      difficulty:    settings.difficulty    ?? 'medium',
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