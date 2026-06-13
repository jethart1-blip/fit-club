import { useState, useMemo } from 'react';
import type { WorkoutLog, Program, ProgressPhoto, WeightEntry, BodyMeasurement } from '../types';
import {
  getWorkoutLogs,
  getProgram,
  getProgressPhotos,
  saveProgressPhoto,
  deleteProgressPhoto,
  getWeightEntries,
  saveWeightEntry,
  deleteWeightEntry,
  getBodyMeasurements,
  saveBodyMeasurement,
  deleteBodyMeasurement,
} from '../lib/storage';
import { compressImage } from '../lib/imageCompression';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { getMaxEstimated1RM } from '../lib/getEstimated1RM';
import { getAllTimePR } from '../lib/getPRs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const logs: WorkoutLog[] = getWorkoutLogs();
const program: Program | null = getProgram();

// Oldest-first for the session browser and chart
const logsSortedAsc = logs
  .slice()
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateLong(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const MEASUREMENT_FIELDS: { key: keyof Omit<BodyMeasurement, 'id' | 'date'>; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
  { key: 'calves', label: 'Calves' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'neck', label: 'Neck' },
];

export function Progress() {
  const loggedExercises = useMemo(() => {
    const ids = new Set<string>();
    for (const log of logs) {
      for (const exLog of log.exercises) {
        ids.add(exLog.exerciseId);
      }
    }
    return EXERCISE_LIBRARY.filter((e) => ids.has(e.id));
  }, []);

  const [selectedId, setSelectedId] = useState<string>(
    loggedExercises.length > 0 ? loggedExercises[0].id : ''
  );

  const [sessionIndex, setSessionIndex] = useState<number>(
    logsSortedAsc.length > 0 ? logsSortedAsc.length - 1 : 0
  );

  const [photos, setPhotos] = useState<ProgressPhoto[]>(getProgressPhotos);
  const [photoWeight, setPhotoWeight] = useState('');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(getWeightEntries);
  const [newWeight, setNewWeight] = useState('');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(getBodyMeasurements);
  const [measurementInputs, setMeasurementInputs] = useState<Record<string, string>>({});
  const [selectedMeasurementField, setSelectedMeasurementField] = useState<string>('waist');

  const chartData = useMemo(() => {
    if (!selectedId) return [];
    return logsSortedAsc.flatMap((log) => {
      const exLog = log.exercises.find((e) => e.exerciseId === selectedId);
      if (!exLog || exLog.sets.length === 0) return [];
      const maxWeight = Math.max(...exLog.sets.map((s) => s.weight));
      const estimated1RM = getMaxEstimated1RM(exLog.sets);
      return [{ date: formatDate(log.date), weight: maxWeight, estimated1RM }];
    });
  }, [selectedId]);

  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].estimated1RM : null;
  const previous1RM = chartData.length > 1 ? chartData[chartData.length - 2].estimated1RM : null;
  const isNewRecord = current1RM !== null && previous1RM !== null && current1RM > previous1RM;

  const allTimePR = useMemo(() => getAllTimePR(selectedId, logs), [selectedId]);

  const sessionLog = logsSortedAsc[sessionIndex] ?? null;
  const sessionDayName = sessionLog
    ? (program?.days.find((d) => d.id === sessionLog.programDayId)?.name ?? sessionLog.programDayId)
    : null;

  const sessionMaxWeight = useMemo(() => {
    if (!sessionLog || !selectedId) return null;
    const exLog = sessionLog.exercises.find((e) => e.exerciseId === selectedId);
    if (!exLog || exLog.sets.length === 0) return null;
    return Math.max(...exLog.sets.map((s) => s.weight));
  }, [sessionLog, selectedId]);

  const sessionIsPR =
    allTimePR !== null && sessionMaxWeight !== null && sessionMaxWeight === allTimePR.weight;

  if (loggedExercises.length === 0) {
    return (
      <div className="min-h-screen bg-pageBg p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-surface rounded-2xl p-6">
            <h1 className="text-2xl font-display text-textPrimary">📈 Progress</h1>
          </div>
          <div className="bg-surface rounded-2xl p-8 text-center">
            <p className="text-textMuted text-base">No progress data yet — log a workout first.</p>
          </div>

          {/* Progress Photos */}
          <div className="bg-surface rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display text-textPrimary">Progress Photos</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">Add a photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-textMuted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface2 file:text-textPrimary hover:file:bg-surface2/80 transition-colors cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await compressImage(file);
                      saveProgressPhoto({
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        dataUrl,
                        ...(photoWeight !== '' && !isNaN(Number(photoWeight)) && {
                          weightLbs: Number(photoWeight),
                        }),
                      });
                      setPhotos(getProgressPhotos());
                      setPhotoWeight('');
                    } catch {
                      // silently ignore compression errors
                    }
                    e.target.value = '';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">
                  Bodyweight at this photo (lbs) — optional
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 185"
                  value={photoWeight}
                  onChange={(e) => setPhotoWeight(e.target.value)}
                  className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <p className="text-xs text-textMuted">Photos are stored on this device only.</p>
            </div>

            {photos.length === 0 ? (
              <p className="text-textMuted text-sm text-center py-4">
                No progress photos yet — upload your first one above.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((photo) => (
                    <div key={photo.id} className="space-y-1">
                      <img
                        src={photo.dataUrl}
                        alt={`Progress photo ${formatDate(photo.date)}`}
                        className="rounded-xl aspect-square object-cover w-full"
                      />
                      <div className="flex items-start justify-between gap-1 px-0.5">
                        <div>
                          <p className="text-xs text-textMuted leading-tight">{formatDate(photo.date)}</p>
                          {photo.weightLbs !== undefined && (
                            <p className="text-xs font-medium text-textPrimary leading-tight">
                              {photo.weightLbs} lbs
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            deleteProgressPhoto(photo.id);
                            setPhotos(getProgressPhotos());
                          }}
                          className="text-xs text-danger hover:opacity-70 transition-opacity shrink-0 mt-0.5"
                          aria-label="Delete photo"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Bodyweight */}
          <div className="bg-surface rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display text-textPrimary">Bodyweight</h2>

            <div className="flex gap-2">
              <input
                type="number"
                min={50}
                max={600}
                placeholder="lbs"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={() => {
                  const val = Number(newWeight);
                  if (!newWeight || isNaN(val) || val < 50 || val > 600) return;
                  saveWeightEntry({ id: crypto.randomUUID(), date: new Date().toISOString(), weightLbs: val });
                  setWeightEntries(getWeightEntries());
                  setNewWeight('');
                }}
                disabled={!newWeight || isNaN(Number(newWeight)) || Number(newWeight) < 50 || Number(newWeight) > 600}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-black disabled:opacity-40 hover:bg-accent/90 transition-colors whitespace-nowrap"
              >
                Log Weight
              </button>
            </div>

            {weightEntries.length >= 2 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={weightEntries
                    .slice()
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((e) => ({ date: formatDate(e.date), weightLbs: e.weightLbs }))}
                  margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    unit=" lb"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #363b46',
                      background: '#2a2e37',
                      fontSize: '0.875rem',
                      color: '#f1f1ef',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={(value) => [`${Number(value)} lb`, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightLbs"
                    stroke="#d4ff4f"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-textMuted text-sm text-center py-4">
                Log at least 2 entries to see a trend chart.
              </p>
            )}

            {weightEntries.length > 0 && (
              <ul className="space-y-2">
                {weightEntries
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-textMuted">{formatDateLong(entry.date)}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-textPrimary">{entry.weightLbs} lbs</span>
                        <button
                          onClick={() => {
                            deleteWeightEntry(entry.id);
                            setWeightEntries(getWeightEntries());
                          }}
                          className="text-xs text-danger hover:opacity-70 transition-opacity"
                          aria-label="Delete entry"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Body Measurements */}
          <div className="bg-surface rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display text-textPrimary">Body Measurements (in)</h2>

            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-textMuted mb-1">{field.label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="in"
                    value={measurementInputs[field.key] ?? ''}
                    onChange={(e) =>
                      setMeasurementInputs((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-surface2 bg-surface2 px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const hasAny = MEASUREMENT_FIELDS.some(
                  (f) => measurementInputs[f.key] !== undefined && measurementInputs[f.key] !== '' && !isNaN(Number(measurementInputs[f.key]))
                );
                if (!hasAny) return;
                const entry: BodyMeasurement = { id: crypto.randomUUID(), date: new Date().toISOString() };
                for (const field of MEASUREMENT_FIELDS) {
                  const val = measurementInputs[field.key];
                  if (val !== undefined && val !== '' && !isNaN(Number(val))) {
                    entry[field.key] = Number(val);
                  }
                }
                saveBodyMeasurement(entry);
                setMeasurements(getBodyMeasurements());
                setMeasurementInputs({});
              }}
              disabled={!MEASUREMENT_FIELDS.some(
                (f) => measurementInputs[f.key] !== undefined && measurementInputs[f.key] !== '' && !isNaN(Number(measurementInputs[f.key]))
              )}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-black disabled:opacity-40 hover:bg-accent/90 transition-colors"
            >
              Log Measurements
            </button>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">Trend chart for</label>
              <select
                value={selectedMeasurementField}
                onChange={(e) => setSelectedMeasurementField(e.target.value)}
                className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
              >
                {MEASUREMENT_FIELDS.map((f) => (
                  <option key={f.key} value={f.key} className="bg-surface2 text-textPrimary">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const filtered = measurements
                .filter((m) => m[selectedMeasurementField as keyof BodyMeasurement] !== undefined)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              if (filtered.length >= 2) {
                return (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                      data={filtered.map((m) => ({
                        date: formatDate(m.date),
                        value: m[selectedMeasurementField as keyof BodyMeasurement] as number,
                      }))}
                      margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} unit=" in" />
                      <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #363b46', background: '#2a2e37', fontSize: '0.875rem', color: '#f1f1ef' }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value) => [`${Number(value)} in`, MEASUREMENT_FIELDS.find((f) => f.key === selectedMeasurementField)?.label ?? selectedMeasurementField]}
                      />
                      <Line type="monotone" dataKey="value" stroke="#d4ff4f" strokeWidth={2} dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                );
              }
              return (
                <p className="text-textMuted text-sm text-center py-4">
                  Log at least 2 entries with this measurement to see a trend chart.
                </p>
              );
            })()}

            {measurements.length > 0 && (
              <ul className="space-y-2">
                {measurements
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((entry) => {
                    const summary = MEASUREMENT_FIELDS
                      .filter((f) => entry[f.key] !== undefined)
                      .map((f) => `${f.label}: ${entry[f.key]}in`)
                      .join(', ');
                    return (
                      <li key={entry.id} className="flex items-start justify-between text-sm gap-2">
                        <div>
                          <span className="text-textMuted block">{formatDateLong(entry.date)}</span>
                          <span className="text-textPrimary text-xs">{summary}</span>
                        </div>
                        <button
                          onClick={() => {
                            deleteBodyMeasurement(entry.id);
                            setMeasurements(getBodyMeasurements());
                          }}
                          className="text-xs text-danger hover:opacity-70 transition-opacity shrink-0 mt-0.5"
                          aria-label="Delete measurement"
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-surface rounded-2xl p-6">
          <h1 className="text-2xl font-display text-textPrimary">📈 Progress</h1>
          <p className="text-sm text-textMuted mt-1">Track your max weight and estimated 1RM over time</p>
        </div>

        {/* Chart section */}
        <div className="bg-surface rounded-2xl p-6 space-y-5">
          <div>
            <label
              htmlFor="exercise-select"
              className="block text-sm font-medium text-textMuted mb-2"
            >
              Exercise
            </label>
            <select
              id="exercise-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
            >
              {loggedExercises.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-surface2 text-textPrimary">
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {chartData.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-6">No data for this exercise.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit=" lb"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #363b46',
                    background: '#2a2e37',
                    fontSize: '0.875rem',
                    color: '#f1f1ef',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value, name) => [
                    `${Number(value)} lb`,
                    name === 'weight' ? 'Max Weight' : 'Est. 1RM',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'weight' ? 'Max Weight' : 'Est. 1RM')}
                  wrapperStyle={{ fontSize: '0.8rem', color: '#9ca3af' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#d4ff4f"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Estimated 1RM summary */}
          {current1RM !== null && (
            <div className="rounded-xl bg-surface2 px-4 py-3 space-y-1">
              <p className="text-sm text-textMuted">
                Current estimated 1RM:{' '}
                <span className="font-semibold text-textPrimary">{current1RM} lbs</span>
              </p>
              {isNewRecord && (
                <p className="text-sm font-medium text-accent2">
                  🎉 New estimated 1RM: {current1RM} lbs — up from {previous1RM}!
                </p>
              )}
            </div>
          )}

          {/* All-time PR */}
          {allTimePR !== null && (
            <div className="rounded-xl bg-surface2 px-4 py-3">
              <p className="text-sm text-textMuted">
                All-time PR:{' '}
                <span className="font-semibold text-textPrimary">
                  {allTimePR.weight} lbs &times; {allTimePR.reps} reps
                </span>
                <span className="text-textMuted">
                  {' '}({new Date(allTimePR.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Session browser */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Workout Sessions</h2>

          {logsSortedAsc.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-4">No workout sessions yet.</p>
          ) : (
            <>
              {/* Nav controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSessionIndex((i) => Math.max(0, i - 1))}
                  disabled={sessionIndex === 0}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-surface2 text-textPrimary disabled:opacity-40 hover:bg-surface2/80 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-textMuted">
                  {sessionIndex + 1} / {logsSortedAsc.length}
                </span>
                <button
                  onClick={() => setSessionIndex((i) => Math.min(logsSortedAsc.length - 1, i + 1))}
                  disabled={sessionIndex === logsSortedAsc.length - 1}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-surface2 text-textPrimary disabled:opacity-40 hover:bg-surface2/80 transition-colors"
                >
                  Next →
                </button>
              </div>

              {/* Session detail */}
              {sessionLog && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-textPrimary">{sessionDayName}</p>
                      {sessionIsPR && (
                        <span className="text-xs font-semibold text-accent2 bg-accent2/10 px-2 py-0.5 rounded-full leading-tight">
                          🏆 PR!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-textMuted mt-0.5">{formatDateLong(sessionLog.date)}</p>
                  </div>

                  <div className="space-y-4">
                    {sessionLog.exercises.map((exLog) => {
                      const exerciseName =
                        EXERCISE_LIBRARY.find((e) => e.id === exLog.exerciseId)?.name ??
                        exLog.exerciseId;
                      const isThisExercisePR =
                        exLog.exerciseId === selectedId && sessionIsPR;

                      return (
                        <div key={exLog.exerciseId}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-display text-textPrimary">{exerciseName}</p>
                            {isThisExercisePR && (
                              <span className="text-xs font-semibold text-accent2 bg-accent2/10 px-2 py-0.5 rounded-full leading-tight">
                                🏆 PR!
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {exLog.sets.map((set) => (
                              <p key={set.setNumber} className="text-sm text-textMuted">
                                <span className="font-medium text-textPrimary">Set {set.setNumber}:</span>{' '}
                                {set.weight} lbs &times; {set.reps} reps
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress Photos */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Progress Photos</h2>

          {/* Upload controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">
                Add a photo
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-textMuted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface2 file:text-textPrimary hover:file:bg-surface2/80 transition-colors cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await compressImage(file);
                    saveProgressPhoto({
                      id: crypto.randomUUID(),
                      date: new Date().toISOString(),
                      dataUrl,
                      ...(photoWeight !== '' && !isNaN(Number(photoWeight)) && {
                        weightLbs: Number(photoWeight),
                      }),
                    });
                    setPhotos(getProgressPhotos());
                    setPhotoWeight('');
                  } catch {
                    // silently ignore compression errors
                  }
                  e.target.value = '';
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">
                Bodyweight at this photo (lbs) — optional
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 185"
                value={photoWeight}
                onChange={(e) => setPhotoWeight(e.target.value)}
                className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <p className="text-xs text-textMuted">Photos are stored on this device only.</p>
          </div>

          {/* Photo grid */}
          {photos.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-4">
              No progress photos yet — upload your first one above.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((photo) => (
                  <div key={photo.id} className="space-y-1">
                    <div className="relative">
                      <img
                        src={photo.dataUrl}
                        alt={`Progress photo ${formatDate(photo.date)}`}
                        className="rounded-xl aspect-square object-cover w-full"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-1 px-0.5">
                      <div>
                        <p className="text-xs text-textMuted leading-tight">{formatDate(photo.date)}</p>
                        {photo.weightLbs !== undefined && (
                          <p className="text-xs font-medium text-textPrimary leading-tight">
                            {photo.weightLbs} lbs
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          deleteProgressPhoto(photo.id);
                          setPhotos(getProgressPhotos());
                        }}
                        className="text-xs text-danger hover:opacity-70 transition-opacity shrink-0 mt-0.5"
                        aria-label="Delete photo"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Bodyweight */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Bodyweight</h2>

          <div className="flex gap-2">
            <input
              type="number"
              min={50}
              max={600}
              placeholder="lbs"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="flex-1 rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => {
                const val = Number(newWeight);
                if (!newWeight || isNaN(val) || val < 50 || val > 600) return;
                saveWeightEntry({ id: crypto.randomUUID(), date: new Date().toISOString(), weightLbs: val });
                setWeightEntries(getWeightEntries());
                setNewWeight('');
              }}
              disabled={!newWeight || isNaN(Number(newWeight)) || Number(newWeight) < 50 || Number(newWeight) > 600}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-black disabled:opacity-40 hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              Log Weight
            </button>
          </div>

          {weightEntries.length >= 2 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={weightEntries
                  .slice()
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((e) => ({ date: formatDate(e.date), weightLbs: e.weightLbs }))}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  unit=" lb"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #363b46',
                    background: '#2a2e37',
                    fontSize: '0.875rem',
                    color: '#f1f1ef',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value) => [`${Number(value)} lb`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weightLbs"
                  stroke="#d4ff4f"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-textMuted text-sm text-center py-4">
              Log at least 2 entries to see a trend chart.
            </p>
          )}

          {weightEntries.length > 0 && (
            <ul className="space-y-2">
              {weightEntries
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-textMuted">{formatDateLong(entry.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-textPrimary">{entry.weightLbs} lbs</span>
                      <button
                        onClick={() => {
                          deleteWeightEntry(entry.id);
                          setWeightEntries(getWeightEntries());
                        }}
                        className="text-xs text-danger hover:opacity-70 transition-opacity"
                        aria-label="Delete entry"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Body Measurements */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Body Measurements (in)</h2>

          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-textMuted mb-1">{field.label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="in"
                  value={measurementInputs[field.key] ?? ''}
                  onChange={(e) =>
                    setMeasurementInputs((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface2 bg-surface2 px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const hasAny = MEASUREMENT_FIELDS.some(
                (f) => measurementInputs[f.key] !== undefined && measurementInputs[f.key] !== '' && !isNaN(Number(measurementInputs[f.key]))
              );
              if (!hasAny) return;
              const entry: BodyMeasurement = { id: crypto.randomUUID(), date: new Date().toISOString() };
              for (const field of MEASUREMENT_FIELDS) {
                const val = measurementInputs[field.key];
                if (val !== undefined && val !== '' && !isNaN(Number(val))) {
                  entry[field.key] = Number(val);
                }
              }
              saveBodyMeasurement(entry);
              setMeasurements(getBodyMeasurements());
              setMeasurementInputs({});
            }}
            disabled={!MEASUREMENT_FIELDS.some(
              (f) => measurementInputs[f.key] !== undefined && measurementInputs[f.key] !== '' && !isNaN(Number(measurementInputs[f.key]))
            )}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-black disabled:opacity-40 hover:bg-accent/90 transition-colors"
          >
            Log Measurements
          </button>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Trend chart for</label>
            <select
              value={selectedMeasurementField}
              onChange={(e) => setSelectedMeasurementField(e.target.value)}
              className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
            >
              {MEASUREMENT_FIELDS.map((f) => (
                <option key={f.key} value={f.key} className="bg-surface2 text-textPrimary">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const filtered = measurements
              .filter((m) => m[selectedMeasurementField as keyof BodyMeasurement] !== undefined)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (filtered.length >= 2) {
              return (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={filtered.map((m) => ({
                      date: formatDate(m.date),
                      value: m[selectedMeasurementField as keyof BodyMeasurement] as number,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} unit=" in" />
                    <Tooltip
                      contentStyle={{ borderRadius: '0.75rem', border: '1px solid #363b46', background: '#2a2e37', fontSize: '0.875rem', color: '#f1f1ef' }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value) => [`${Number(value)} in`, MEASUREMENT_FIELDS.find((f) => f.key === selectedMeasurementField)?.label ?? selectedMeasurementField]}
                    />
                    <Line type="monotone" dataKey="value" stroke="#d4ff4f" strokeWidth={2} dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              );
            }
            return (
              <p className="text-textMuted text-sm text-center py-4">
                Log at least 2 entries with this measurement to see a trend chart.
              </p>
            );
          })()}

          {measurements.length > 0 && (
            <ul className="space-y-2">
              {measurements
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((entry) => {
                  const summary = MEASUREMENT_FIELDS
                    .filter((f) => entry[f.key] !== undefined)
                    .map((f) => `${f.label}: ${entry[f.key]}in`)
                    .join(', ');
                  return (
                    <li key={entry.id} className="flex items-start justify-between text-sm gap-2">
                      <div>
                        <span className="text-textMuted block">{formatDateLong(entry.date)}</span>
                        <span className="text-textPrimary text-xs">{summary}</span>
                      </div>
                      <button
                        onClick={() => {
                          deleteBodyMeasurement(entry.id);
                          setMeasurements(getBodyMeasurements());
                        }}
                        className="text-xs text-danger hover:opacity-70 transition-opacity shrink-0 mt-0.5"
                        aria-label="Delete measurement"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
