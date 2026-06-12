import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FitApp</h1>
        <p className="text-muted-foreground mt-2">
          Track workouts, log sets, and monitor your progress.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/workouts">View Workouts</Link>
        </Button>
      </div>
    </div>
  )
}
