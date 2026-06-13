import { useMemo } from 'react';
import { getWorkoutLogs, getProfile } from '@/lib/storage';
import { getAchievements } from '@/lib/getAchievements';
import { getStrengthTiers } from '@/lib/getStrengthTiers';
import type { Tier } from '@/lib/getStrengthTiers';

const TIER_BADGE: Record<Tier, string> = {
  Untrained: 'bg-gray-500/20 text-gray-400',
  Bronze: 'bg-amber-700/20 text-amber-600',
  Silver: 'bg-slate-400/20 text-slate-300',
  Gold: 'bg-yellow-400/20 text-yellow-400',
  Platinum: 'bg-accentCool/20 text-accentCool',
  Diamond: 'bg-accentViolet/20 text-accentViolet',
};

export function Achievements() {
  const logs = useMemo(() => getWorkoutLogs(), []);
  const profile = useMemo(() => getProfile(), []);

  const bodyweightLbs = profile?.weightLbs ?? 0;
  const tiers = useMemo(() => getStrengthTiers(logs, bodyweightLbs), [logs, bodyweightLbs]);
  const achievements = useMemo(() => getAchievements(logs), [logs]);

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="bg-surface rounded-2xl p-6">
          <h1 className="text-2xl font-display text-textPrimary">Achievements</h1>
          <p className="text-sm text-textMuted mt-1">Milestones and strength tiers</p>
        </div>

        {/* Strength Tiers */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Strength Tiers</h2>
          {!profile || bodyweightLbs <= 0 ? (
            <p className="text-textMuted text-sm text-center py-4">
              Set your bodyweight in Settings to see strength tiers.
            </p>
          ) : (
            <div className="space-y-4">
              {tiers.map((result) => (
                <div key={result.lift} className="rounded-xl bg-surface2 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-textPrimary">{result.lift}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TIER_BADGE[result.tier]}`}
                    >
                      {result.tier}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted">
                    Est. 1RM:{' '}
                    <span className="font-medium text-textPrimary">
                      {result.estimated1RM > 0 ? `${result.estimated1RM} lbs` : '—'}
                    </span>
                  </p>
                  {result.nextTier && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${Math.round(result.progressToNext * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-textMuted">
                        {result.nextTierWeight !== null
                          ? `${result.nextTierWeight} lbs`
                          : '—'}{' '}
                        to{' '}
                        <span className={`font-semibold ${TIER_BADGE[result.nextTier].split(' ')[1]}`}>
                          {result.nextTier}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Milestones</h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border px-4 py-3 space-y-1 transition-all ${
                  a.unlocked
                    ? 'border-accent bg-accent/5 opacity-100'
                    : 'border-surface2 bg-surface2 opacity-40 grayscale'
                }`}
              >
                <p className="text-sm font-semibold text-textPrimary leading-tight">{a.label}</p>
                <p className="text-xs text-textMuted leading-snug">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
