import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, EquipmentType, Goal, SplitId, CustomSplit } from '../types';
import { getProfile, saveProfile, saveProgram, setCurrentDayIndex, clearAllData, getCustomSplits, exportAllData, importAllData } from '../lib/storage';
import { generateProgram } from '../lib/generateProgram';
import { SPLITS } from '../data/splits';
import { getTheme, setTheme } from '../lib/theme';
import type { Theme } from '../lib/theme';

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
  sports_performance: 'Sports Performance',
};

const SPORT_SPLIT_IDS: SplitId[] = ['basketball', 'football', 'baseball', 'soccer'];

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
  const [selectedCustomSplitId, setSelectedCustomSplitId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([]);
  const [importError, setImportError] = useState('');
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editAge, setEditAge] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editDaysPerWeek, setEditDaysPerWeek] = useState('');
  const [editEquipment, setEditEquipment] = useState<EquipmentType[]>([]);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');

  useEffect(() => {
    const p = getProfile();
    if (!p || !isValidProfile(p)) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    setSelectedSplitId(p.splitId);
    setSelectedCustomSplitId(p.customSplitId ?? null);
    setCustomSplits(getCustomSplits());
    setEditAge(String(p.age));
    setEditWeight(String(p.weightLbs));
    setEditHeight(String(p.heightInches));
    setEditDaysPerWeek(String(p.daysPerWeek));
    setEditEquipment(p.equipment);
  }, [navigate]);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setWarningMessage('');
    setTimeout(() => setSuccessMessage(''), 4000);
  }

  function toggleEditEquipment(value: EquipmentType) {
    setEditEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  function getProfileEditErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    const a = Number(editAge);
    const w = Number(editWeight);
    const h = Number(editHeight);
    const d = Number(editDaysPerWeek);
    if (isNaN(a) || a < 13 || a > 100) errors.age = 'Enter a value between 13 and 100.';
    if (isNaN(w) || w < 50 || w > 600) errors.weight = 'Enter a value between 50 and 600.';
    if (isNaN(h) || h < 36 || h > 96) errors.height = 'Enter a value between 36 and 96.';
    if (isNaN(d) || d < 1 || d > 7) errors.days = 'Enter a value between 1 and 7.';
    if (editEquipment.length === 0) errors.equipment = 'Select at least one equipment type.';
    return errors;
  }

  function handleSaveProfileEdits() {
    if (!profile) return;
    const errors = getProfileEditErrors();
    if (Object.keys(errors).length > 0) {
      setProfileSaveError('Please fix the highlighted fields.');
      setProfileSaveMessage('');
      return;
    }
    const updated: UserProfile = {
      ...profile,
      age: Number(editAge),
      weightLbs: Number(editWeight),
      heightInches: Number(editHeight),
      daysPerWeek: Number(editDaysPerWeek),
      equipment: editEquipment,
    };
    try {
      const result = generateProgram(updated);
      saveProfile(updated);
      saveProgram(result);
      setCurrentDayIndex(0);
      setProfile(updated);
      setProfileSaveError('');
      setProfileSaveMessage('Profile updated! Your program has been regenerated.');
      setTimeout(() => setProfileSaveMessage(''), 4000);
    } catch (err) {
      setProfileSaveError(err instanceof Error ? err.message : 'Failed to update profile.');
      setProfileSaveMessage('');
    }
  }

  function handleSaveSplit() {
    if (!profile || !selectedSplitId || !splitChanged) return;
    const updated: UserProfile = {
      ...profile,
      splitId: selectedSplitId,
      ...(selectedSplitId === 'custom' ? { customSplitId: selectedCustomSplitId ?? undefined } : {}),
    };
    try {
      const result = generateProgram(updated);
      saveProfile(updated);
      saveProgram(result);
      setCurrentDayIndex(0);
      setProfile(updated);
      showSuccess('Split updated! Your program has been regenerated.');
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : 'Failed to generate program.');
    }
  }

  function handleRegenerate() {
    if (!profile) return;
    try {
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
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : 'Failed to generate program.');
    }
  }

  function handleExport() {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitclub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = window.confirm('This will replace ALL current data with the contents of this backup file. Continue?');
    if (!confirmed) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAllData(reader.result as string);
        window.alert('Data imported successfully! The app will now reload.');
        window.location.reload();
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import data.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleResetAll() {
    const confirmed = window.confirm('Are you sure? This will delete all your data.');
    if (!confirmed) return;
    clearAllData();
    navigate('/onboarding');
  }

  if (!profile) return null;

  const splitChanged =
    selectedSplitId !== null &&
    (selectedSplitId !== profile.splitId ||
      (selectedSplitId === 'custom' && selectedCustomSplitId !== (profile.customSplitId ?? null)));

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-sm mx-auto pt-8 pb-12">
        <h1 className="text-2xl font-display text-textPrimary mb-1">⚙️ Settings</h1>
        <p className="text-textMuted text-sm mb-8">Manage your profile and program.</p>

        {/* Appearance */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-1">🎨 Appearance</h2>
          <p className="text-xs text-textMuted mb-4">Choose your preferred color theme.</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setTheme('dark'); setThemeState('dark'); }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                theme === 'dark' ? 'bg-accent text-pageBg' : 'bg-surface2 text-textPrimary hover:bg-surface2/80'
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => { setTheme('light'); setThemeState('light'); }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                theme === 'light' ? 'bg-accent text-pageBg' : 'bg-surface2 text-textPrimary hover:bg-surface2/80'
              }`}
            >
              ☀️ Light
            </button>
          </div>
        </div>

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

        {/* Edit Profile */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-1">✏️ Edit Profile</h2>
          <p className="text-xs text-textMuted mb-4">Update your stats. Changing days/equipment will regenerate your program.</p>
          {(() => {
            const errors = getProfileEditErrors();
            const fields = [
              { label: 'Age', value: editAge, setter: setEditAge, errorKey: 'age' },
              { label: 'Weight (lbs)', value: editWeight, setter: setEditWeight, errorKey: 'weight' },
              { label: 'Height (in)', value: editHeight, setter: setEditHeight, errorKey: 'height' },
              { label: 'Days/week', value: editDaysPerWeek, setter: setEditDaysPerWeek, errorKey: 'days' },
            ];
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {fields.map(({ label, value, setter, errorKey }) => {
                    const err = errors[errorKey];
                    return (
                      <div key={label}>
                        <label className="block text-xs font-medium text-textMuted mb-1">{label}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          className={`w-full rounded-xl border-2 px-3 py-2 text-sm bg-surface2 text-textPrimary focus:outline-none transition-colors ${
                            err ? 'border-danger focus:border-danger' : 'border-surface2 focus:border-accent'
                          }`}
                        />
                        {err && <p className="text-xs text-danger mt-1">{err}</p>}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-2">Equipment</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEditEquipment(eq)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          editEquipment.includes(eq)
                            ? 'bg-accent text-pageBg'
                            : 'bg-surface2 text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        {EQUIPMENT_LABELS[eq]}
                      </button>
                    ))}
                  </div>
                  {errors.equipment && <p className="text-xs text-danger mt-1">{errors.equipment}</p>}
                </div>
                <button
                  onClick={handleSaveProfileEdits}
                  className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 active:scale-95 transition-transform text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
                >
                  Save Changes
                </button>
                {profileSaveMessage && (
                  <p className="text-center text-sm text-accent font-medium">{profileSaveMessage}</p>
                )}
                {profileSaveError && (
                  <p className="text-center text-sm text-danger font-medium">{profileSaveError}</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Change Split */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-1">Change Split</h2>
          <p className="text-xs text-textMuted mb-4">Select a new training structure.</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.values(SPLITS)
              .filter((split) => split.id !== 'custom' || customSplits.length > 0)
              .filter((split) => !SPORT_SPLIT_IDS.includes(split.id) || split.id === profile.splitId)
              .map((split) => (
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
            {customSplits.map((cs) => {
              const isSelected = selectedSplitId === 'custom' && selectedCustomSplitId === cs.id;
              return (
                <label key={cs.id} className={splitCardClass(isSelected)}>
                  <input
                    type="radio"
                    name="splitId"
                    value={cs.id}
                    checked={isSelected}
                    onChange={() => {
                      setSelectedSplitId('custom');
                      setSelectedCustomSplitId(cs.id);
                    }}
                    className="sr-only"
                  />
                  <div>
                    <div>{cs.name}</div>
                    <div
                      className={`text-xs font-normal mt-0.5 ${
                        isSelected ? 'text-accent' : 'text-textMuted'
                      }`}
                    >
                      {cs.workoutIds.length} day{cs.workoutIds.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          {customSplits.length === 0 && (
            <p className="mt-3 text-xs text-textMuted">
              Build a workout and assemble it into a split in the Workout Builder to unlock custom splits.
            </p>
          )}
          <button
            onClick={handleSaveSplit}
            disabled={!splitChanged}
            className="mt-4 w-full bg-accent hover:bg-accent/90 active:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Save Split
          </button>
        </div>

        {/* Data Backup */}
        <div className="bg-surface rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-textMuted mb-1">💾 Data Backup</h2>
          <p className="text-xs text-textMuted mb-4">Export your data as a backup file, or restore from a previous backup.</p>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full bg-surface2 hover:bg-surface2/80 text-textPrimary font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={handleImportClick}
              className="w-full bg-surface2 hover:bg-surface2/80 text-textPrimary font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Import Data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            {importError && (
              <p className="text-xs text-danger text-center">{importError}</p>
            )}
          </div>
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
