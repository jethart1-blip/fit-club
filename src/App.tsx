import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { History } from '@/pages/History'
import { Onboarding } from '@/pages/Onboarding'
import { Progress } from '@/pages/Progress'
import { Settings } from '@/pages/Settings'
import { TodaysWorkout } from '@/pages/TodaysWorkout'

function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/today"
        element={
          <Layout>
            <TodaysWorkout />
          </Layout>
        }
      />
      <Route
        path="/history"
        element={
          <Layout>
            <History />
          </Layout>
        }
      />
      <Route
        path="/progress"
        element={
          <Layout>
            <Progress />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  )
}

export default App
