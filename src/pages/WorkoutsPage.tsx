import { useAppStore } from '@/store'

const categoryLabels = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
} as const

export function WorkoutsPage() {
  const workouts = useAppStore((state) => state.workouts)
  const exercises = useAppStore((state) => state.exercises)
  const splits = useAppStore((state) => state.splits)
  const splitDays = useAppStore((state) => state.splitDays)

  const exercisesByCategory = exercises.reduce(
    (groups, exercise) => {
      groups[exercise.category].push(exercise)
      return groups
    },
    {
      push: [] as typeof exercises,
      pull: [] as typeof exercises,
      legs: [] as typeof exercises,
      core: [] as typeof exercises,
    },
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
        <p className="text-muted-foreground mt-2">
          Saved routines, training splits, and the exercise library.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your workouts</h2>
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workouts logged yet. Start a session to track your sets.
          </p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((workout) => (
              <li
                key={workout.id}
                className="rounded-lg border bg-card px-4 py-3 text-sm"
              >
                <p className="font-medium">{workout.name}</p>
                <p className="text-muted-foreground">{workout.date}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Training splits</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {splits.map((split) => {
            const days = splitDays
              .filter((day) => day.splitId === split.id)
              .sort((a, b) => a.order - b.order)

            return (
              <li
                key={split.id}
                className="rounded-lg border bg-card px-4 py-3"
              >
                <p className="font-medium">{split.name}</p>
                {split.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {split.description}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {days.map((day) => day.name).join(' · ')}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Exercise library</h2>
        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(
          (category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {categoryLabels[category]} ({exercisesByCategory[category].length})
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {exercisesByCategory[category].map((exercise) => (
                  <li
                    key={exercise.id}
                    className="rounded-lg border bg-card px-4 py-3"
                  >
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {exercise.muscleGroup} · {exercise.equipment}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </section>
    </div>
  )
}
