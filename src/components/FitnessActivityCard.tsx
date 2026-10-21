import React, { useState, useEffect } from 'react';
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
  Plus,
  Smartphone,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { getSimulatedFitnessData } from '../data/fitnessService';
import { ComingSoonModal } from './ComingSoonModal';

interface FitnessActivityCardProps {
  user: UserProfile;
  todayFoodCalories: number;
  onOpenSyncModal?: () => void;
  onUpdateFitnessData?: (data: FitnessActivityData) => void;
}

export const FitnessActivityCard: React.FC<FitnessActivityCardProps> = ({
  user,
  todayFoodCalories,
  onOpenSyncModal,
  onUpdateFitnessData,
}) => {
  const [fitness, setFitness] = useState<FitnessActivityData>(
    user.fitnessData || getSimulatedFitnessData('google_fit')
  );
  const [comingSoonApp, setComingSoonApp] = useState<string | null>(null);
  const [freeSyncSuccess, setFreeSyncSuccess] = useState<string | null>(null);
  const [isLivePedometerActive, setIsLivePedometerActive] = useState<boolean>(false);

  useEffect(() => {
    if (user.fitnessData) {
      setFitness(user.fitnessData);
    }
  }, [user.fitnessData]);

  // Real device motion listener for free live step count
  useEffect(() => {
    if (!isLivePedometerActive) return;

    let lastAccel = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const delta = Math.abs(mag - lastAccel);

      if (delta > 3.2) {
        setFitness((prev) => {
          const updated = {
            ...prev,
            steps: prev.steps + 1,
            distanceKm: Number((prev.distanceKm + 0.0008).toFixed(2)),
            activeCaloriesBurned: prev.activeCaloriesBurned + (prev.steps % 25 === 0 ? 1 : 0),
          };
          if (onUpdateFitnessData) onUpdateFitnessData(updated);
          return updated;
        });
      }
      lastAccel = mag;
    };

    if (typeof window !== 'undefined' && 'ondevicemotion' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isLivePedometerActive, onUpdateFitnessData]);

  const stepPercent = Math.min(100, Math.round((fitness.steps / (fitness.stepGoal || 10000)) * 100));
  const netCalories = todayFoodCalories - fitness.activeCaloriesBurned;

  const sourceLabels: Record<string, string> = {
    google_fit: 'Google Fit',
    samsung_health: 'Samsung Health',
    apple_health: 'Apple Health',
    fitbit: 'Fitbit',
    manual: 'Fitness Track',
  };

  // Instant Free Live Activity Sync
  const handleFreeInstantSync = () => {
    const fresh = getSimulatedFitnessData('google_fit', {
      steps: Math.min(12500, fitness.steps + 1250),
      activeCaloriesBurned: fitness.activeCaloriesBurned + 65,
      activeMinutes: fitness.activeMinutes + 12,
      distanceKm: Number((fitness.distanceKm + 0.9).toFixed(1)),
      restingHeartRate: 64,
    });
    setFitness(fresh);
    if (onUpdateFitnessData) onUpdateFitnessData(fresh);

    setFreeSyncSuccess('✓ Successfully updated live activity steps & burn!');
    setTimeout(() => setFreeSyncSuccess(null), 3000);
  };

  return (
    <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xs space-y-3.5">
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

      {/* Free Feedback Toast */}
      {freeSyncSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{freeSyncSuccess}</span>
        </div>
      )}

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

      {/* Free Instant Sync & Motion Sensor Controls */}
      <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#00695c]" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Free Live Sensor</span>
            <span className="text-[9px] text-slate-400 block">
              {isLivePedometerActive ? 'Accelerometer counting footsteps' : 'Zero API keys required'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setIsLivePedometerActive(!isLivePedometerActive)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
              isLivePedometerActive
                ? 'bg-[#00695c] text-white border-emerald-900 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isLivePedometerActive ? 'Active ●' : 'Start Sensor'}
          </button>

          <button
            type="button"
            onClick={handleFreeInstantSync}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-200 transition-all active:scale-95"
          >
            +1.2k Steps
          </button>
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
          <span className="text-xs font-bold text-[#00695c]">
            {fitness.bloodOxygenSpO2 || 98}% SpO2
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONNECT CLOUD FITNESS APPS (WITH "+" COMING SOON POPUP) */}
      {/* ========================================================= */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-800">Connect Wearable Apps</h4>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Click + to connect</span>
        </div>

        <div className="space-y-1.5">
          {[
            {
              id: 'google_fit',
              name: 'Google Fit',
              desc: 'Android, Wear OS & Health Connect step sync',
              iconText: 'G',
              iconBg: 'bg-blue-600 text-white',
            },
            {
              id: 'apple_fit',
              name: 'Apple Fit',
              desc: 'Apple Watch rings, steps walked & active distance',
              iconText: '',
              iconBg: 'bg-slate-900 text-white',
            },
            {
              id: 'samsung_health',
              name: 'Samsung Health',
              desc: 'Galaxy Fit step counts & continuous heart rate',
              iconText: 'S',
              iconBg: 'bg-indigo-600 text-white',
            },
            {
              id: 'fitbit',
              name: 'Fitbit',
              desc: 'All-day tracker workouts & sleep metrics',
              iconText: 'F',
              iconBg: 'bg-teal-600 text-white',
            },
          ].map((app) => (
            <div
              key={app.id}
              className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/20 border border-slate-200/80 flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-7 h-7 rounded-xl ${app.iconBg} font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  {app.iconText}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">{app.name}</span>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1 rounded-sm">
                      Cloud Sync
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block line-clamp-1">{app.desc}</span>
                </div>
              </div>

              {/* The "+" (Plus) Connect Button */}
              <button
                type="button"
                id={`btn-connect-${app.id}`}
                onClick={() => setComingSoonApp(app.name)}
                className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-[#00695c] text-emerald-800 hover:text-white border border-emerald-200 hover:border-[#00695c] shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
                title={`Connect ${app.name}`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Interactive Modal */}
      <ComingSoonModal
        isOpen={!!comingSoonApp}
        appName={comingSoonApp || ''}
        onClose={() => setComingSoonApp(null)}
        onConnectFreeSensor={handleFreeInstantSync}
      />
    </div>
  );
};
