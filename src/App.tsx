import { Navigate, Route, Routes } from 'react-router-dom'

import { History } from '@/pages/History'
import { Onboarding } from '@/pages/Onboarding'
import { Progress } from '@/pages/Progress'
import { Settings } from '@/pages/Settings'
import { TodaysWorkout } from '@/pages/TodaysWorkout'

function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/today" element={<TodaysWorkout />} />
      <Route path="/history" element={<History />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  )
}

export default App
