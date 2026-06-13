import { useEffect, useRef, useState } from 'react'

import { EXERCISE_LIBRARY } from '../data/exercises'
import { SPLITS } from '../data/splits'
import { getCustomWorkouts, getCurrentDayIndex, getProfile, getProgram, getWeightEntries, getWorkoutLogs } from '../lib/storage'
import { isDeloadWeek, isTestMaxWeek } from '../lib/getMesocycleWeek'
import { getAllTimePR } from '../lib/getPRs'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function buildContextSummary(): string {
  const profile = getProfile()
  const program = getProgram()
  const logs = getWorkoutLogs()
  const customWorkouts = getCustomWorkouts()

  const lines: string[] = []

  // ## User Profile
  if (profile) {
    const split = SPLITS[profile.splitId]
    lines.push('## User Profile')
    if (profile.name) {
      lines.push(`- Name: ${profile.name} (address them by name when natural)`)
    }
    lines.push(`- Age: ${profile.age}`)
    lines.push(`- Weight: ${profile.weightLbs} lbs`)
    lines.push(`- Height: ${profile.heightInches} inches`)
    lines.push(`- Goal: ${profile.goal.replace('_', ' ')}`)
    lines.push(`- Training split: ${split?.name ?? profile.splitId}`)
    lines.push(`- Available equipment: ${profile.equipment.join(', ')}`)
    lines.push(`- Days per week: ${profile.daysPerWeek}`)
  }

  // ## Status
  if (profile) {
    lines.push('\n## Status')
    if (isDeloadWeek(profile)) {
      lines.push('- This is a DELOAD WEEK (reduced volume/intensity by design).')
    }
    if (isTestMaxWeek(profile)) {
      lines.push('- This is a MAX TESTING WEEK — the user may be retesting their 1RM on a main lift.')
    }

    // Streak
    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let streak = 0
    if (sortedLogs.length > 0) {
      const uniqueDates: Date[] = []
      const seen = new Set<string>()
      for (const log of sortedLogs) {
        const d = new Date(log.date)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (!seen.has(key)) {
          seen.add(key)
          uniqueDates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
        }
      }
      const diffFromToday = (now.getTime() - uniqueDates[0]?.getTime()) / (1000 * 60 * 60 * 24)
      if (diffFromToday <= 2) {
        streak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const gap = (uniqueDates[i - 1].getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24)
          if (gap <= 2) streak++
          else break
        }
      }
    }
    lines.push(`- Current workout streak: ${streak} day${streak !== 1 ? 's' : ''}`)

    if (program) {
      const dayIndex = getCurrentDayIndex()
      const nextDay = program.days[dayIndex % program.days.length]
      lines.push(`- Next scheduled workout: ${nextDay.name}`)
    }
  }

  // ## Recent Workouts
  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  if (recentLogs.length > 0) {
    lines.push('\n## Recent Workouts (last 5)')
    for (const log of recentLogs) {
      const dayName =
        program?.days.find(d => d.id === log.programDayId)?.name ?? log.programDayId
      lines.push(`\n### ${log.date} — ${dayName}`)
      for (const ex of log.exercises) {
        const exerciseDef = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
        const name = exerciseDef?.name ?? ex.exerciseId
        const setsSummary = ex.sets
          .map(s => {
            const rpe = s.rpe != null ? ` @RPE${s.rpe}` : ''
            return `${s.weight}lbs×${s.reps}${rpe}`
          })
          .join(', ')
        lines.push(`- ${name}: ${setsSummary}`)
      }
    }
  }

  // ## Readiness Trend
  const readinessLogs = recentLogs.filter(l => l.readiness !== undefined)
  if (readinessLogs.length > 0) {
    lines.push('\n## Readiness Trend (last 5 sessions, 1-10 scale)')
    for (const log of readinessLogs) {
      lines.push(`- ${log.date}: ${log.readiness}/10`)
    }
  }

  // ## Recent PRs
  const recentPRs: string[] = []
  for (const log of recentLogs) {
    for (const ex of log.exercises) {
      const pr = getAllTimePR(ex.exerciseId, logs)
      if (!pr) continue
      const sessionMax = Math.max(...ex.sets.map(s => s.weight))
      if (sessionMax === pr.weight && pr.date === log.date) {
        const def = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
        recentPRs.push(`${def?.name ?? ex.exerciseId}: ${pr.weight} lbs (new all-time PR on ${log.date})`)
      }
    }
  }
  if (recentPRs.length > 0) {
    lines.push('\n## Recent PRs')
    for (const pr of recentPRs) lines.push(`- ${pr}`)
  }

  // ## Bodyweight Trend
  const weightEntries = [...getWeightEntries()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  if (weightEntries.length > 0) {
    lines.push('\n## Bodyweight Trend (most recent first)')
    for (const w of weightEntries) {
      lines.push(`- ${w.date}: ${w.weightLbs} lbs`)
    }
  }

  // ## Custom Workouts
  if (customWorkouts.length > 0) {
    lines.push('\n## Custom Workouts')
    for (const cw of customWorkouts) {
      const exNames = cw.exercises
        .map(e => {
          const def = EXERCISE_LIBRARY.find(x => x.id === e.exerciseId)
          return def?.name ?? e.exerciseId
        })
        .join(', ')
      lines.push(`- ${cw.name}: ${exNames}`)
    }
  }

  return lines.join('\n')
}

export function Coach() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const contextSummary = buildContextSummary()

      const context =
        `You are a knowledgeable, encouraging fitness coach. Here is the user's profile and recent training data:\n\n${contextSummary}\n\nAnswer their question concisely and practically, referencing their actual data where relevant.`

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      })

      if (!res.ok) {
        throw new Error(`API error ${res.status}`)
      }

      const data = await res.json()
      const assistantText: string =
        data?.content?.[0]?.text ?? "Sorry, I couldn't process that — try again."

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't process that — try again." },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 6.5rem)' }}>
      {/* Header */}
      <div className="border-b border-surface2 px-4 py-3">
        <h1 className="font-display text-lg font-semibold tracking-wide text-textPrimary uppercase">
          🤖 AI Coach
        </h1>
        <p className="text-xs text-textMuted mt-0.5">
          Ask about your training, recovery, nutrition, or progress
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl">💪</div>
            <p className="text-textMuted text-sm max-w-xs">
              Ask your AI coach anything — training advice, exercise swaps, recovery tips, or
              analysis of your recent sessions.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent text-pageBg rounded-br-sm'
                  : 'bg-surface text-textPrimary rounded-bl-sm border border-surface2'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-surface2 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface2 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl bg-surface border border-surface2 px-3.5 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-pageBg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-textMuted mt-1.5 px-0.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
