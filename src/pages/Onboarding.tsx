import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, EquipmentType, Goal, SplitId } from '../types';
import { generateProgram } from '../lib/generateProgram';
import { saveProfile, saveProgram } from '../lib/storage';
import { SPLITS } from '../data/splits';

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'machines', label: 'Machines' },
  { value: 'cables', label: 'Cables' },
  { value: 'bodyweight', label: 'Bodyweight' },
];

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: 'strength', label: 'Strength', description: 'Build maximal force and lift heavier.' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Maximize muscle size and volume.' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Stay active and improve overall health.' },
  { value: 'fat_loss', label: 'Fat Loss', description: 'Burn fat while preserving muscle.' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [age, setAge] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('');

  // Step 2
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);

  // Step 3
  const [goal, setGoal] = useState<Goal | ''>('');

  // Step 4
  const [splitId, setSplitId] = useState<SplitId | ''>('');

  function toggleEquipment(value: EquipmentType) {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  function canAdvance() {
    if (step === 1) {
      const a = Number(age);
      const w = Number(weightLbs);
      const h = Number(heightInches);
      const d = Number(daysPerWeek);
      return a > 0 && w > 0 && h > 0 && d >= 1 && d <= 7;
    }
    if (step === 2) return equipment.length > 0;
    if (step === 3) return goal !== '';
    return splitId !== '';
  }

  function handleNext() {
    if (!canAdvance()) return;
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    else handleSubmit();
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  }

  function handleSubmit() {
    const profile: UserProfile = {
      age: Number(age),
      weightLbs: Number(weightLbs),
      heightInches: Number(heightInches),
      daysPerWeek: Number(daysPerWeek),
      equipment,
      goal: goal as Goal,
      splitId: splitId as SplitId,
      createdAt: new Date().toISOString(),
    };
    const result = generateProgram(profile);
    saveProfile(profile);
    saveProgram(result);
    navigate('/today');
  }

  const cardClass = (selected: boolean) =>
    `flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
      selected
        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
        : 'border-gray-200 text-gray-600 hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            Step {step} of 4
          </p>
          <div className="flex gap-1 mb-4">
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 1 && 'Basic Info'}
            {step === 2 && 'Equipment'}
            {step === 3 && 'Your Goal'}
            {step === 4 && 'Choose a Split'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && 'Tell us a little about yourself.'}
            {step === 2 && 'Select all equipment you have access to.'}
            {step === 3 && 'What are you training for?'}
            {step === 4 && 'Pick a training structure.'}
          </p>
        </div>

        {/* Step 1 – Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { label: 'Age', value: age, setter: setAge, placeholder: 'e.g. 25', min: 1, max: 120 },
              { label: 'Weight (lbs)', value: weightLbs, setter: setWeightLbs, placeholder: 'e.g. 185', min: 1, max: 1000 },
              { label: 'Height (inches)', value: heightInches, setter: setHeightInches, placeholder: 'e.g. 70', min: 1, max: 120 },
              { label: 'Days per week (1–7)', value: daysPerWeek, setter: setDaysPerWeek, placeholder: 'e.g. 4', min: 1, max: 7 },
            ].map(({ label, value, setter, placeholder, min, max }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 – Equipment */}
        {step === 2 && (
          <div className="space-y-2">
            {EQUIPMENT_OPTIONS.map(({ value, label }) => (
              <label key={value} className={cardClass(equipment.includes(value))}>
                <input
                  type="checkbox"
                  checked={equipment.includes(value)}
                  onChange={() => toggleEquipment(value)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    equipment.includes(value)
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  }`}
                >
                  {equipment.includes(value) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {label}
              </label>
            ))}
            {equipment.length === 0 && (
              <p className="text-xs text-red-500 pt-1">Select at least one option to continue.</p>
            )}
          </div>
        )}

        {/* Step 3 – Goal */}
        {step === 3 && (
          <div className="space-y-2">
            {GOAL_OPTIONS.map(({ value, label, description }) => (
              <label key={value} className={cardClass(goal === value)}>
                <input
                  type="radio"
                  name="goal"
                  value={value}
                  checked={goal === value}
                  onChange={() => setGoal(value)}
                  className="sr-only"
                />
                <div>
                  <div>{label}</div>
                  <div className={`text-xs font-normal mt-0.5 ${goal === value ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Step 4 – Split Picker */}
        {step === 4 && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.values(SPLITS).map((split) => (
              <label key={split.id} className={cardClass(splitId === split.id)}>
                <input
                  type="radio"
                  name="splitId"
                  value={split.id}
                  checked={splitId === split.id}
                  onChange={() => setSplitId(split.id)}
                  className="sr-only"
                />
                <div>
                  <div>{split.name}</div>
                  <div className={`text-xs font-normal mt-0.5 ${splitId === split.id ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {split.description}
                  </div>
                </div>
              </label>
            ))}
            {splitId === '' && (
              <p className="text-xs text-red-500 pt-1">Select a split to continue.</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {step === 4 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
