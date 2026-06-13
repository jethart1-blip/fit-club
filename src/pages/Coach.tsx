import { CoachChat } from '../components/CoachChat'

export function Coach() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 6.5rem)' }}>
      <div className="border-b border-surface2 px-4 py-3">
        <h1 className="font-display text-lg font-semibold tracking-wide text-textPrimary uppercase">
          🤖 AI Coach
        </h1>
        <p className="text-xs text-textMuted mt-0.5">
          Ask about your training, recovery, nutrition, or progress
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CoachChat />
      </div>
    </div>
  )
}
