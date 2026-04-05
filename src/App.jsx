// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import HomePage    from './pages/HomePage'
import LobbyPage   from './pages/LobbyPage'
import GamePage    from './pages/GamePage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-blast-bg font-body">
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/lobby/:code"   element={<LobbyPage />} />
        <Route path="/game/:code"    element={<GamePage />} />
        <Route path="/results/:code" element={<ResultsPage />} />
      </Routes>
    </div>
  )
}