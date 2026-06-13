import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { EXERCISE_LIBRARY } from '../data/exercises'
import {
  getCustomExercises,
  saveCustomExercise,
  saveCustomWorkout,
} from '../lib/storage'
import type {
  CustomExercise,
  CustomWorkout,
  CustomWorkoutExercise,
  MuscleGroupSlot,
  EquipmentType,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS: MuscleGroupSlot[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms',
]

const MUSCLE_LABELS: Record<MuscleGroupSlot, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  forearms: 'Forearms',
}

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'barbell', 'dumbbells', 'machines', 'cables', 'bodyweight',
]

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  machines: 'Machines',
  cables: 'Cables',
  bodyweight: 'Bodyweight',
}

// ─── Local type: workout item with stable uid for drag keys ───────────────────

type WorkoutItem = CustomWorkoutExercise & { uid: string }

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutBuilder() {
  const [workoutName, setWorkoutName] = useState('')
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([])
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<MuscleGroupSlot>>(new Set())
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState<{
    name: string
    slot: MuscleGroupSlot
    equipment: EquipmentType
  }>({ name: '', slot: 'chest', equipment: 'barbell' })
  const [successMsg, setSuccessMsg] = useState('')
  const [workoutId] = useState<string>(() => crypto.randomUUID())

  useEffect(() => {
    setCustomExercises(getCustomExercises())
  }, [])

  // Merge library + custom, group by slot
  const allExercises = [...EXERCISE_LIBRARY, ...customExercises]

  const searchLower = search.toLowerCase().trim()

  function getGroupExercises(slot: MuscleGroupSlot) {
    const all = allExercises.filter(e => e.slot === slot)
    return searchLower ? all.filter(e => e.name.toLowerCase().includes(searchLower)) : all
  }

  function getExerciseName(exerciseId: string) {
    return allExercises.find(e => e.id === exerciseId)?.name ?? exerciseId
  }

  function toggleCollapse(slot: MuscleGroupSlot) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  // ─── Drag & Drop ────────────────────────────────────────────────────────────

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return

    if (destination.droppableId === 'workout') {
      if (source.droppableId === 'workout') {
        // Reorder within the workout list
        const next = Array.from(workoutItems)
        const [moved] = next.splice(source.index, 1)
        next.splice(destination.index, 0, moved)
        setWorkoutItems(next)
      } else if (source.droppableId.startsWith('library-')) {
        // Add from library — draggableId is "lib-{exerciseId}"
        const exerciseId = draggableId.slice('lib-'.length)
        const newItem: WorkoutItem = {
          uid: crypto.randomUUID(),
          exerciseId,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 10,
        }
        const next = Array.from(workoutItems)
        next.splice(destination.index, 0, newItem)
        setWorkoutItems(next)
      }
    }
    // Drops back into the library or to null → no-op
  }

  // ─── Workout item helpers ────────────────────────────────────────────────────

  function updateItem(uid: string, field: keyof CustomWorkoutExercise, value: number) {
    setWorkoutItems(prev =>
      prev.map(item => (item.uid === uid ? { ...item, [field]: value } : item))
    )
  }

  function removeItem(uid: string) {
    setWorkoutItems(prev => prev.filter(item => item.uid !== uid))
  }

  // ─── Custom exercise form ────────────────────────────────────────────────────

  function handleAddCustomExercise() {
    const trimmed = customForm.name.trim()
    if (!trimmed) return
    const ex: CustomExercise = {
      id: crypto.randomUUID(),
      name: trimmed,
      slot: customForm.slot,
      equipment: customForm.equipment,
      custom: true,
    }
    saveCustomExercise(ex)
    setCustomExercises(prev => [...prev, ex])
    setCustomForm({ name: '', slot: 'chest', equipment: 'barbell' })
    setShowCustomForm(false)
  }

  // ─── Save workout ────────────────────────────────────────────────────────────

  function handleSaveWorkout() {
    const name = workoutName.trim()
    if (!name || workoutItems.length === 0) return

    const workout: CustomWorkout = {
      id: workoutId,
      name,
      exercises: workoutItems.map(({ uid: _uid, ...rest }) => rest),
      createdAt: new Date().toISOString(),
    }
    saveCustomWorkout(workout)
    setSuccessMsg('Workout saved!')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Top bar: name + save ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Name your workout…"
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            className="flex-1 bg-surface border border-surface2 rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSaveWorkout}
            disabled={!workoutName.trim() || workoutItems.length === 0}
            className="bg-accent hover:bg-accent/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-display font-bold rounded-xl px-5 py-2.5 text-sm tracking-wide uppercase transition-all"
          >
            Save
          </button>
        </div>
        {successMsg && (
          <p className="text-green-400 text-xs text-center font-medium">{successMsg}</p>
        )}
      </div>

      {/* ── Two-panel drag-and-drop area ─────────────────────────────────────── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* ── LEFT: Exercise Library ──────────────────────────────────────── */}
          <div className="bg-surface rounded-2xl p-4 space-y-3">

            {/* Library header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-textPrimary uppercase tracking-wide">
                Exercise Library
              </h2>
              <button
                onClick={() => setShowCustomForm(v => !v)}
                className="text-xs font-semibold text-accent hover:text-accent/70 transition-colors uppercase tracking-wide"
              >
                {showCustomForm ? '✕ Cancel' : '+ Custom'}
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search exercises…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-pageBg border border-surface2 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
            />

            {/* Custom exercise inline form */}
            {showCustomForm && (
              <div className="bg-pageBg border border-surface2 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">
                  New Custom Exercise
                </p>
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={customForm.name}
                  onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomExercise()}
                  className="w-full bg-surface border border-surface2 rounded-lg px-3 py-1.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={customForm.slot}
                    onChange={e =>
                      setCustomForm(prev => ({ ...prev, slot: e.target.value as MuscleGroupSlot }))
                    }
                    className="bg-surface border border-surface2 rounded-lg px-2 py-1.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
                  >
                    {MUSCLE_GROUPS.map(slot => (
                      <option key={slot} value={slot}>{MUSCLE_LABELS[slot]}</option>
                    ))}
                  </select>
                  <select
                    value={customForm.equipment}
                    onChange={e =>
                      setCustomForm(prev => ({ ...prev, equipment: e.target.value as EquipmentType }))
                    }
                    className="bg-surface border border-surface2 rounded-lg px-2 py-1.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
                  >
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <option key={eq} value={eq}>{EQUIPMENT_LABELS[eq]}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddCustomExercise}
                  disabled={!customForm.name.trim()}
                  className="w-full bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-semibold rounded-lg py-1.5 text-sm transition-colors"
                >
                  Add to Library
                </button>
              </div>
            )}

            {/* Muscle group sections */}
            <div className="space-y-1 max-h-[58vh] overflow-y-auto pr-0.5">
              {MUSCLE_GROUPS.map(slot => {
                const exercises = getGroupExercises(slot)
                // Hide empty groups when searching
                if (searchLower && exercises.length === 0) return null

                const isCollapsed = collapsed.has(slot) && !searchLower

                return (
                  <div key={slot}>
                    {/* Group header (collapse toggle) */}
                    <button
                      onClick={() => toggleCollapse(slot)}
                      className="w-full flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-pageBg transition-colors group"
                    >
                      <span className="text-xs font-semibold text-textMuted uppercase tracking-wider group-hover:text-textPrimary transition-colors">
                        {MUSCLE_LABELS[slot]}
                        <span className="ml-2 text-accent/50 font-normal">{exercises.length}</span>
                      </span>
                      <span className="text-textMuted text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                        {isCollapsed ? '▶' : '▼'}
                      </span>
                    </button>

                    {/* Draggable exercise items */}
                    {!isCollapsed && (
                      <Droppable droppableId={`library-${slot}`} isDropDisabled>
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-0.5 mb-1"
                          >
                            {exercises.map((exercise, index) => (
                              <Draggable
                                key={`lib-${exercise.id}`}
                                draggableId={`lib-${exercise.id}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm select-none transition-colors ${
                                      snapshot.isDragging
                                        ? 'bg-accent/20 text-accent shadow-lg ring-1 ring-accent/30'
                                        : 'bg-pageBg text-textPrimary hover:bg-surface2 cursor-grab active:cursor-grabbing'
                                    }`}
                                  >
                                    <span className="text-textMuted opacity-40 text-xs shrink-0">
                                      ⠿
                                    </span>
                                    <span className="flex-1 leading-tight">{exercise.name}</span>
                                    {'custom' in exercise && exercise.custom && (
                                      <span className="text-[10px] font-semibold text-accent/50 uppercase tracking-wide shrink-0">
                                        custom
                                      </span>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: Workout Builder ──────────────────────────────────────── */}
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-textPrimary uppercase tracking-wide">
                Your Workout
              </h2>
              {workoutItems.length > 0 && (
                <span className="text-xs text-textMuted">
                  {workoutItems.length} exercise{workoutItems.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <Droppable droppableId="workout">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] rounded-xl p-2 space-y-2 border border-dashed transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-accent/5 border-accent/40'
                      : 'bg-pageBg border-surface2'
                  }`}
                >
                  {workoutItems.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex flex-col items-center justify-center min-h-[180px] gap-2">
                      <span className="text-2xl opacity-20">⊕</span>
                      <p className="text-textMuted text-sm text-center leading-relaxed">
                        Drag exercises here
                        <br />
                        <span className="text-xs opacity-60">to build your workout</span>
                      </p>
                    </div>
                  )}

                  {workoutItems.map((item, index) => (
                    <Draggable key={item.uid} draggableId={item.uid} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-surface2 rounded-xl p-3 space-y-2.5 transition-shadow ${
                            snapshot.isDragging ? 'shadow-xl ring-1 ring-accent/30' : ''
                          }`}
                        >
                          {/* Exercise name row */}
                          <div className="flex items-center gap-2">
                            <span
                              {...provided.dragHandleProps}
                              className="text-textMuted opacity-40 text-sm cursor-grab active:cursor-grabbing shrink-0"
                            >
                              ⠿
                            </span>
                            <span className="flex-1 text-sm font-medium text-textPrimary leading-tight">
                              {getExerciseName(item.exerciseId)}
                            </span>
                            <button
                              onClick={() => removeItem(item.uid)}
                              aria-label="Remove exercise"
                              className="text-textMuted hover:text-red-400 shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs font-bold transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Sets / Reps row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Sets */}
                            <label className="flex items-center gap-1.5 text-xs text-textMuted">
                              <span>Sets</span>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={item.targetSets}
                                onChange={e =>
                                  updateItem(item.uid, 'targetSets', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-12 bg-pageBg border border-surface2 rounded-lg px-1.5 py-1 text-textPrimary text-xs text-center focus:outline-none focus:border-accent transition-colors"
                              />
                            </label>

                            {/* Rep range */}
                            <label className="flex items-center gap-1.5 text-xs text-textMuted">
                              <span>Reps</span>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={item.targetRepsMin}
                                onChange={e =>
                                  updateItem(item.uid, 'targetRepsMin', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-12 bg-pageBg border border-surface2 rounded-lg px-1.5 py-1 text-textPrimary text-xs text-center focus:outline-none focus:border-accent transition-colors"
                              />
                              <span className="text-textMuted opacity-50">–</span>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={item.targetRepsMax}
                                onChange={e =>
                                  updateItem(item.uid, 'targetRepsMax', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-12 bg-pageBg border border-surface2 rounded-lg px-1.5 py-1 text-textPrimary text-xs text-center focus:outline-none focus:border-accent transition-colors"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Tip text */}
            {workoutItems.length > 0 && (
              <p className="text-xs text-textMuted text-center opacity-50">
                Drag to reorder · ✕ to remove
              </p>
            )}
          </div>

        </div>
      </DragDropContext>
    </div>
  )
}
