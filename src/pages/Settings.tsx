import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../types';
import { getProfile, saveProgram, setCurrentDayIndex, clearAllData } from '../lib/storage';
import { generateProgram } from '../lib/generateProgram';

export function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
  }, [navigate]);

  function handleRegenerate() {
    if (!profile) return;
    const program = generateProgram(profile);
    saveProgram(program);
    setCurrentDayIndex(0);
    setSuccessMessage('Program regenerated!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  function handleResetAll() {
    const confirmed = window.confirm('Are you sure? This will delete all your data.');
    if (!confirmed) return;
    clearAllData();
    navigate('/onboarding');
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your profile and program.</p>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Current Profile</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Days per week</span>
            <span className="font-medium text-gray-900">{profile.daysPerWeek}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Equipment</span>
            <span className="font-medium text-gray-900">
              {profile.equipment === 'full_gym' ? 'Full Gym' : 'Dumbbells Only'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRegenerate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Regenerate Program
          </button>

          {successMessage && (
            <p className="text-center text-sm text-indigo-600 font-medium">{successMessage}</p>
          )}

          <button
            onClick={handleResetAll}
            className="w-full border-2 border-red-400 text-red-500 hover:bg-red-50 active:bg-red-100 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
