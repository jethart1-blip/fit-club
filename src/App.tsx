import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { Coach } from '@/pages/Coach'
import { History } from '@/pages/History'
import { Home } from '@/pages/Home'
import { Onboarding } from '@/pages/Onboarding'
import { Settings } from '@/pages/Settings'
import { TodaysWorkout } from '@/pages/TodaysWorkout'
import { WorkoutBuilder } from '@/pages/WorkoutBuilder'
import { getProfile } from '@/lib/storage'

const Progress = lazy(() =>
  import('@/pages/Progress').then(m => ({ default: m.Progress }))
)

const Achievements = lazy(() =>
  import('@/pages/Achievements').then(m => ({ default: m.Achievements }))
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
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
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
        <Route
          path="/builder"
          element={
            <Layout>
              <WorkoutBuilder />
            </Layout>
          }
        />
        <Route
          path="/coach"
          element={
            <Layout>
              <Coach />
            </Layout>
          }
        />
        <Route
          path="/achievements"
          element={
            <Layout>
              <Achievements />
            </Layout>
          }
        />
        <Route
          path="*"
          element={<Navigate to={getProfile() ? '/' : '/onboarding'} replace />}
        />
      </Routes>
    </Suspense>
  )
}

export default App
