import { useState } from 'react'
import { CoachChat } from './CoachChat'

export function CoachModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-accent text-pageBg text-2xl shadow-lg shadow-accent/30 flex items-center justify-center active:scale-95 transition-transform hover:scale-105"
        aria-label="Open AI Coach"
      >
        🤖
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-pageBg w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden">
            <div className="border-b border-surface2 px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-wide text-textPrimary uppercase">
                  🤖 AI Coach
                </h2>
                <p className="text-xs text-textMuted mt-0.5">Quick question during your workout</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-textMuted hover:text-textPrimary text-2xl leading-none px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CoachChat />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
