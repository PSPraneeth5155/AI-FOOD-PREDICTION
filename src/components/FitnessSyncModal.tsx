import React, { useState } from 'react';
import { UserProfile, FitnessActivityData, FitnessSyncSource } from '../types';
import {
  X,
  Smartphone,
  Watch,
  Flame,
  Activity,
  Heart,
  Moon,
  Upload,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { getSimulatedFitnessData, parseFitnessFile } from '../data/fitnessService';

interface FitnessSyncModalProps {
  user: UserProfile;
  onUpdateFitnessData?: (fitnessData: FitnessActivityData, updatedUser?: Partial<UserProfile>) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onClose: () => void;
}

export const FitnessSyncModal: React.FC<FitnessSyncModalProps> = ({
  user,
  onUpdateFitnessData,
  onUpdateUser,
  onClose,
}) => {
  const currentFitness = user.fitnessData || getSimulatedFitnessData('google_fit');
  const [selectedSource, setSelectedSource] = useState<FitnessSyncSource>(
    user.fitnessConnections?.activeSource || 'google_fit'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [fileImportFeedback, setFileImportFeedback] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const triggerUpdate = (freshData: FitnessActivityData, partialUser?: Partial<UserProfile>) => {
    if (onUpdateFitnessData) {
      onUpdateFitnessData(freshData, partialUser);
    }
    if (onUpdateUser) {
      const merged: UserProfile = {
        ...user,
        ...partialUser,
        fitnessData: freshData,
        medical: {
          ...user.medical,
          ...(partialUser?.medical || {}),
        },
        fitnessConnections: {
          ...(user.fitnessConnections || {}),
          ...(partialUser?.fitnessConnections || {}),
        } as any,
      };
      onUpdateUser(merged);
    }
  };

  const handleSyncNow = (source: FitnessSyncSource) => {
    setIsSyncing(true);
    setSyncFeedback(`Connecting to ${getSourceName(source)}...`);

    setTimeout(() => {
      const freshData = getSimulatedFitnessData(source);
      setIsSyncing(false);
      setSyncFeedback(
        `✓ Successfully synced ${freshData.steps.toLocaleString()} steps & ${freshData.activeCaloriesBurned} active kcal from ${getSourceName(source)}!`
      );

      triggerUpdate(freshData, {
        medical: {
          ...user.medical,
          restingHeartRate: freshData.restingHeartRate || user.medical.restingHeartRate,
        },
        fitnessConnections: {
          googleFit: source === 'google_fit' || !!user.fitnessConnections?.googleFit,
          samsungHealth: source === 'samsung_health' || !!user.fitnessConnections?.samsungHealth,
          appleHealth: source === 'apple_health' || !!user.fitnessConnections?.appleHealth,
          fitbit: source === 'fitbit' || !!user.fitnessConnections?.fitbit,
          autoSync: true,
          activeSource: source,
          lastSyncedAt: new Date().toISOString(),
        },
      });

      setTimeout(() => setSyncFeedback(null), 4500);
    }, 1200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileImportFeedback(`Reading fitness data from ${file.name}...`);
      const { source, data } = await parseFitnessFile(file);
      const combined = getSimulatedFitnessData(source, data);

      triggerUpdate(combined, {
        medical: {
          ...user.medical,
          restingHeartRate: combined.restingHeartRate || user.medical.restingHeartRate,
        },
      });

      setFileImportFeedback(`✓ Imported ${combined.steps.toLocaleString()} steps from ${file.name}!`);
      setTimeout(() => setFileImportFeedback(null), 4000);
    } catch (err) {
      setFileImportFeedback('Could not read file. Supported formats: Google Fit JSON, Samsung Health CSV.');
    }
  };

  const getSourceName = (src: FitnessSyncSource) => {
    switch (src) {
      case 'google_fit':
        return 'Google Fit / Health Connect';
      case 'samsung_health':
        return 'Samsung Health & Galaxy Fit';
      case 'apple_health':
        return 'Apple Health';
      case 'fitbit':
        return 'Fitbit App';
      default:
        return 'Fitness Tracker';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connected Fitness Apps</h3>
              <p className="text-[11px] text-sky-800">Google Fit, Samsung Health, Galaxy Fit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active Synced Summary Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live Fitness Sync
                </span>
              </div>
              <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {getSourceName(currentFitness.source)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-300 block">Daily Steps</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    {currentFitness.steps.toLocaleString()}
                  </span>
                  <span className="text-xs text-teal-300 font-semibold">
                    /{currentFitness.stepGoal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-300 block">Active Calories Burned</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-black text-amber-300">
                    {currentFitness.activeCaloriesBurned}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">kcal</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-1.5 rounded-xl bg-white/5">
                <span className="text-[9px] text-slate-400 block">Resting HR</span>
                <span className="text-xs font-bold text-rose-300">
                  {currentFitness.restingHeartRate || 64} bpm
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/5">
                <span className="text-[9px] text-slate-400 block">Distance</span>
                <span className="text-xs font-bold text-sky-300">
                  {currentFitness.distanceKm} km
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/5">
                <span className="text-[9px] text-slate-400 block">Sleep Score</span>
                <span className="text-xs font-bold text-purple-300">
                  {currentFitness.sleepScore || 85}/100
                </span>
              </div>
            </div>
          </div>

          {/* Sync status toast */}
          {syncFeedback && (
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium flex items-center space-x-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Fitness Provider Selectors */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800">Select Fitness App to Sync:</h4>

            {/* Google Fit Card */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-500 transition-all flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  G
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Google Fit / Health Connect
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Android & Wear OS step tracking, walking & workout burn
                  </span>
                </div>
              </div>
              <button
                disabled={isSyncing}
                onClick={() => handleSyncNow('google_fit')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200 flex items-center space-x-1 active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            {/* Samsung Health & Galaxy Fit Card */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-500 transition-all flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  S
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Samsung Health & Galaxy Fit
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Galaxy Watch step counts, continuous heart rate, sleep & SpO2
                  </span>
                </div>
              </div>
              <button
                disabled={isSyncing}
                onClick={() => handleSyncNow('samsung_health')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 flex items-center space-x-1 active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            {/* Apple Health & Fitbit Card */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-500 transition-all flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  A
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Apple Health & Fitbit
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Daily active energy ring, distance & workouts
                  </span>
                </div>
              </div>
              <button
                disabled={isSyncing}
                onClick={() => handleSyncNow('apple_health')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 flex items-center space-x-1 active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Offline File Import (Takeout JSON or Samsung CSV) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900">
                  Import Fitness File
                </span>
              </div>
              <span className="text-[10px] text-slate-400">JSON or CSV</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Exported from Google Takeout or Samsung Health? Upload your daily activity file to import exact steps and heart rate logs directly.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.csv,.xml,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs flex items-center justify-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File to Import</span>
            </button>
            {fileImportFeedback && (
              <p className="text-[10px] text-teal-800 font-semibold mt-1">
                {fileImportFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Health data encrypted & kept local</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
