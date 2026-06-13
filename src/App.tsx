import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { History } from '@/pages/History'
import { Onboarding } from '@/pages/Onboarding'
import { Settings } from '@/pages/Settings'
import { TodaysWorkout } from '@/pages/TodaysWorkout'

const Progress = lazy(() =>
  import('@/pages/Progress').then(m => ({ default: m.Progress }))
)

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
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
    </Suspense>
  )
}

export default App
