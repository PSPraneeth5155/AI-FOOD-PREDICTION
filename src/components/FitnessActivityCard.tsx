import React from 'react';
import { UserProfile, FitnessActivityData } from '../types';
import {
  Watch,
  Flame,
  Activity,
  Heart,
  Moon,
  Footprints,
  RefreshCw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getSimulatedFitnessData } from '../data/fitnessService';

interface FitnessActivityCardProps {
  user: UserProfile;
  todayFoodCalories: number;
  onOpenSyncModal?: () => void;
}

export const FitnessActivityCard: React.FC<FitnessActivityCardProps> = ({
  user,
  todayFoodCalories,
  onOpenSyncModal,
}) => {
  const fitness = user.fitnessData || getSimulatedFitnessData('google_fit');
  const stepPercent = Math.min(100, Math.round((fitness.steps / (fitness.stepGoal || 10000)) * 100));

  // Net Calories Calculation
  const netCalories = todayFoodCalories - fitness.activeCaloriesBurned;

  const sourceLabels: Record<string, string> = {
    google_fit: 'Google Fit',
    samsung_health: 'Samsung Health',
    apple_health: 'Apple Health',
    fitbit: 'Fitbit',
    manual: 'Fitness Track',
  };

  return (
    <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-slate-900">Fitness & Activity</h3>
              <span className="text-[9px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-200">
                {sourceLabels[fitness.source] || 'Google Fit'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Steps, active burn & vitals</p>
          </div>
        </div>

        <button
          id="btn-sync-fitness-apps"
          onClick={onOpenSyncModal}
          className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold transition-all border border-sky-200/80 flex items-center space-x-1 active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync Apps</span>
        </button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Steps Card */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Steps
            </span>
            <Footprints className="w-3.5 h-3.5 text-teal-600" />
          </div>

          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-black text-slate-900">
              {fitness.steps.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              / {(fitness.stepGoal || 10000).toLocaleString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stepPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            {stepPercent}% of daily goal
          </span>
        </div>

        {/* Active Calories Burned Card */}
        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Active Burn
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          </div>

          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-black text-amber-950">
              {fitness.activeCaloriesBurned}
            </span>
            <span className="text-[10px] font-semibold text-amber-700">kcal</span>
          </div>

          <div className="text-[9px] text-amber-800 font-medium mt-2">
            Net balance: {netCalories > 0 ? `+${netCalories}` : netCalories} kcal
          </div>
          <span className="text-[9px] text-slate-400 block mt-0.5">
            {fitness.activeMinutes}m active • {fitness.distanceKm} km
          </span>
        </div>
      </div>

      {/* Vitals Ribbon: Resting HR & Sleep */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
        <div className="p-1.5 rounded-xl bg-slate-50">
          <span className="text-[9px] text-slate-400 block">Resting HR</span>
          <span className="text-xs font-bold text-rose-600">
            {fitness.restingHeartRate || user.medical.restingHeartRate || 64} bpm
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-slate-50">
          <span className="text-[9px] text-slate-400 block">Sleep Time</span>
          <span className="text-xs font-bold text-indigo-600">
            {fitness.sleepHours || 7.2}h ({fitness.sleepScore || 84}/100)
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-slate-50">
          <span className="text-[9px] text-slate-400 block">Blood Oxygen</span>
          <span className="text-xs font-bold text-teal-700">
            {fitness.bloodOxygenSpO2 || 98}% SpO2
          </span>
        </div>
      </div>
    </div>
  );
};
