import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAppStore } from '@/store'

export function DashboardPage() {
  const workouts = useAppStore((state) => state.workouts)
  const workoutSets = useAppStore((state) => state.workoutSets)
  const bodyWeightEntries = useAppStore((state) => state.bodyWeightEntries)

  const completedSets = workoutSets.filter((set) => set.completed)
  const totalVolume = completedSets.reduce(
    (sum, set) => sum + set.weight * set.reps,
    0,
  )

  const volumeByWeek = workouts.slice(0, 4).map((workout, index) => {
    const sets = workoutSets.filter(
      (set) => set.workoutId === workout.id && set.completed,
    )
    const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0)

    return {
      week: `W${index + 1}`,
      volume: volume || 0,
    }
  })

  const chartData =
    volumeByWeek.some((point) => point.volume > 0)
      ? volumeByWeek
      : [
          { week: 'W1', volume: 12000 },
          { week: 'W2', volume: 14500 },
          { week: 'W3', volume: 13200 },
          { week: 'W4', volume: 15800 },
        ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your training activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Workouts logged</p>
          <p className="text-2xl font-semibold">{workouts.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed sets</p>
          <p className="text-2xl font-semibold">{completedSets.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Body weight entries</p>
          <p className="text-2xl font-semibold">{bodyWeightEntries.length}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-1 text-sm text-muted-foreground">Total logged volume</p>
        <p className="mb-4 text-lg font-semibold">
          {totalVolume.toLocaleString()} kg
        </p>
        <h2 className="mb-4 text-lg font-semibold">Weekly training volume</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="hsl(var(--chart-1))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
