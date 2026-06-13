import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, EquipmentType, Goal, SplitId } from '../types';
import { getProfile, saveProfile, saveProgram, setCurrentDayIndex, clearAllData } from '../lib/storage';
import { generateProgram } from '../lib/generateProgram';
import { SPLITS } from '../data/splits';

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  machines: 'Machines',
  cables: 'Cables',
  bodyweight: 'Bodyweight',
};

const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  general_fitness: 'General Fitness',
  fat_loss: 'Fat Loss',
};

function isValidProfile(p: UserProfile): boolean {
  return (
    typeof p.age === 'number' && !isNaN(p.age) && p.age >= 13 && p.age <= 100 &&
    typeof p.weightLbs === 'number' && !isNaN(p.weightLbs) && p.weightLbs >= 50 && p.weightLbs <= 600 &&
    typeof p.heightInches === 'number' && !isNaN(p.heightInches) && p.heightInches >= 36 && p.heightInches <= 96 &&
    typeof p.daysPerWeek === 'number' && !isNaN(p.daysPerWeek) && p.daysPerWeek >= 1 && p.daysPerWeek <= 7
  );
}

const splitCardClass = (selected: boolean) =>
  `flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
    selected
      ? 'border-accent bg-surface2 text-textPrimary'
      : 'border-surface2 text-textMuted hover:border-accent/50'
  }`;

export function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedSplitId, setSelectedSplitId] = useState<SplitId | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const p = getProfile();
    if (!p || !isValidProfile(p)) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    setSelectedSplitId(p.splitId);
  }, [navigate]);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setWarningMessage('');
    setTimeout(() => setSuccessMessage(''), 4000);
  }

  function handleSaveSplit() {
    if (!profile || !selectedSplitId || selectedSplitId === profile.splitId) return;
    const updated: UserProfile = { ...profile, splitId: selectedSplitId };
    saveProfile(updated);
    const result = generateProgram(updated);
    saveProgram(result);
    setCurrentDayIndex(0);
    setProfile(updated);
    showSuccess('Split updated! Your program has been regenerated.');
  }

  function handleRegenerate() {
    if (!profile) return;
    const result = generateProgram(profile);
    saveProgram(result);
    setCurrentDayIndex(0);
    const hasEmptyDay = result.days.some((d) => d.exercises.length === 0);
    if (hasEmptyDay) {
      setWarningMessage(
        'Warning: with your current equipment, some days have no exercises. Consider selecting more equipment types.'
      );
      setSuccessMessage('Program regenerated!');
      setTimeout(() => {
        setSuccessMessage('');
        setWarningMessage('');
      }, 6000);
    } else {
      showSuccess('Program regenerated!');
    }
  }

  function handleResetAll() {
    const confirmed = window.confirm('Are you sure? This will delete all your data.');
    if (!confirmed) return;
    clearAllData();
    navigate('/onboarding');
  }

  if (!profile) return null;

  const splitChanged = selectedSplitId !== null && selectedSplitId !== profile.splitId;

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-sm mx-auto pt-8 pb-12">
        <h1 className="text-2xl font-display text-textPrimary mb-1">Settings</h1>
        <p className="text-textMuted text-sm mb-8">Manage your profile and program.</p>

        {/* Current Profile */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-4">Current Profile</h2>
          <div className="space-y-3">
            {[
              { label: 'Age', value: `${profile.age} yrs` },
              { label: 'Weight', value: `${profile.weightLbs} lbs` },
              { label: 'Height', value: `${profile.heightInches} in` },
              { label: 'Days per week', value: String(profile.daysPerWeek) },
              { label: 'Goal', value: GOAL_LABELS[profile.goal] },
              {
                label: 'Equipment',
                value: profile.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', '),
              },
              { label: 'Current Split', value: SPLITS[profile.splitId].name },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between text-sm gap-4">
                <span className="text-textMuted flex-shrink-0">{label}</span>
                <span className="font-medium text-textPrimary text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Split */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-1">Change Split</h2>
          <p className="text-xs text-textMuted mb-4">Select a new training structure.</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.values(SPLITS).map((split) => (
              <label key={split.id} className={splitCardClass(selectedSplitId === split.id)}>
                <input
                  type="radio"
                  name="splitId"
                  value={split.id}
                  checked={selectedSplitId === split.id}
                  onChange={() => setSelectedSplitId(split.id)}
                  className="sr-only"
                />
                <div>
                  <div>{split.name}</div>
                  <div
                    className={`text-xs font-normal mt-0.5 ${
                      selectedSplitId === split.id ? 'text-accent' : 'text-textMuted'
                    }`}
                  >
                    {split.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleSaveSplit}
            disabled={!splitChanged}
            className="mt-4 w-full bg-accent hover:bg-accent/90 active:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Save Split
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRegenerate}
            className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Regenerate Program
          </button>

          {successMessage && (
            <p className="text-center text-sm text-accent font-medium">{successMessage}</p>
          )}
          {warningMessage && (
            <p className="text-center text-sm text-amber-400 font-medium">{warningMessage}</p>
          )}

          <button
            onClick={handleResetAll}
            className="w-full bg-danger hover:bg-danger/90 active:bg-danger/80 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
