import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Equipment } from '../types';
import { generateProgram } from '../lib/generateProgram';
import { saveProfile, saveProgram } from '../lib/storage';

export function Onboarding() {
  const navigate = useNavigate();
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4>(3);
  const [equipment, setEquipment] = useState<Equipment>('full_gym');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const profile: UserProfile = {
      daysPerWeek,
      equipment,
      createdAt: new Date().toISOString(),
    };
    const program = generateProgram(profile);
    saveProfile(profile);
    saveProgram(program);
    navigate('/today');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Let's get started</h1>
        <p className="text-gray-500 mb-8 text-sm">Tell us a little about your setup.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-3">Days per week</legend>
            <div className="flex gap-3">
              {([3, 4] as const).map((n) => (
                <label
                  key={n}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 cursor-pointer text-sm font-medium transition-colors ${
                    daysPerWeek === n
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="daysPerWeek"
                    value={n}
                    checked={daysPerWeek === n}
                    onChange={() => setDaysPerWeek(n)}
                    className="sr-only"
                  />
                  {n} days
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-3">Equipment</legend>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: 'full_gym', label: 'Full Gym' },
                  { value: 'dumbbells_only', label: 'Dumbbells Only' },
                ] as { value: Equipment; label: string }[]
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
                    equipment === value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="equipment"
                    value={value}
                    checked={equipment === value}
                    onChange={() => setEquipment(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
