import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StartPage from './components/StartPage'
import TrainerDashboard from './components/TrainerDashboard'
import StudentSessionInput from './components/StudentSessionInput'
import StudentInterface from './components/StudentInterface'
import ResultsPage from './components/ResultsPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/trainer" element={<TrainerDashboard />} />
        <Route path="/student" element={<StudentSessionInput />} />
        <Route path="/student/:sessionId" element={<StudentInterface />} />
        <Route path="/results/:sessionId" element={<ResultsPage />} />
      </Routes>
    </div>
  )
}

export default App