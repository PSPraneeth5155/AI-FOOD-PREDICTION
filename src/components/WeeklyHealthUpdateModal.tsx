import React, { useState } from 'react';
import { UserProfile } from '../types';
import { calculateBMI, calculateTargets } from '../data/nutritionDb';
import {
  X,
  Calendar,
  Scale,
  Activity,
  Heart,
  Droplet,
  CheckCircle2,
  Bell,
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { requestNotificationPermission } from '../data/fitnessService';

interface WeeklyHealthUpdateModalProps {
  user: UserProfile;
  onSave?: (updated: UserProfile) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onClose: () => void;
}

export const WeeklyHealthUpdateModal: React.FC<WeeklyHealthUpdateModalProps> = ({
  user,
  onSave,
  onUpdateUser,
  onClose,
}) => {
  const [weightKg, setWeightKg] = useState<number>(user.weightKg);
  const [systolicBP, setSystolicBP] = useState<number>(user.medical.systolicBP || 120);
  const [diastolicBP, setDiastolicBP] = useState<number>(user.medical.diastolicBP || 80);
  const [bloodSugar, setBloodSugar] = useState<number>(user.medical.bloodSugar || 95);
  const [cholesterol, setCholesterol] = useState<number>(user.medical.cholesterol || 180);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(
    user.medical.restingHeartRate || 64
  );
  const [bodyFatPercent, setBodyFatPercent] = useState<number>(
    user.medical.bodyFatPercent || 18.5
  );

  // Reminder schedule
  const [reminderEnabled, setReminderEnabled] = useState(
    user.weeklyReminder?.enabled ?? true
  );
  const [reminderDay, setReminderDay] = useState<number>(
    user.weeklyReminder?.dayOfWeek ?? 0
  );
  const [reminderTime, setReminderTime] = useState<string>(
    user.weeklyReminder?.time ?? '09:00'
  );
  const [notifyBrowser, setNotifyBrowser] = useState(
    user.weeklyReminder?.notifyBrowser ?? false
  );

  const [notificationStateText, setNotificationStateText] = useState<string | null>(null);

  // Calculate live BMI
  const newBmi = calculateBMI(weightKg, user.heightCm);
  const weightDiff = Number((weightKg - user.weightKg).toFixed(1));

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setNotifyBrowser(true);
      setNotificationStateText('✓ Browser notifications enabled! You will receive weekly prompts.');
    } else {
      setNotifyBrowser(false);
      setNotificationStateText('Browser notification permission was not granted.');
    }
    setTimeout(() => setNotificationStateText(null), 3500);
  };

  const handleSave = () => {
    const updatedTargets = calculateTargets({
      ...user,
      weightKg,
      medical: {
        ...user.medical,
        systolicBP,
        diastolicBP,
        bloodSugar,
        cholesterol,
        restingHeartRate,
        bodyFatPercent,
      },
    });

    const updatedUser: UserProfile = {
      ...user,
      weightKg,
      bmi: newBmi.bmi,
      bmiCategory: newBmi.category,
      medical: {
        ...user.medical,
        systolicBP,
        diastolicBP,
        bloodSugar,
        cholesterol,
        restingHeartRate,
        bodyFatPercent,
      },
      targets: updatedTargets,
      lastHealthDataUpdate: new Date().toISOString().split('T')[0],
      weeklyReminder: {
        enabled: reminderEnabled,
        dayOfWeek: reminderDay,
        time: reminderTime,
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        notifyBrowser,
      },
    };

    if (onUpdateUser) onUpdateUser(updatedUser);
    if (onSave) onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/80 to-sky-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Health Data Update</h3>
              <p className="text-[11px] text-teal-800">Recalibrate nutrition & calorie targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Weight & BMI Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-slate-900">Body Weight & BMI</span>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                BMI: {newBmi.bmi} • {newBmi.category}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="w-28 p-2 rounded-xl bg-white border border-slate-200 text-center">
                <span className="block text-[10px] font-semibold text-slate-400">Trend</span>
                <div className="flex items-center justify-center space-x-1 mt-0.5">
                  {weightDiff > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-rose-600">+{weightDiff} kg</span>
                    </>
                  ) : weightDiff < 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">{weightDiff} kg</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-600">Stable</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals: BP & Blood Sugar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Cardiovascular & Metabolic Vitals</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Systolic BP */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Normal: 90-120</span>
              </div>

              {/* Diastolic BP */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Normal: 60-80</span>
              </div>

              {/* Fasting Blood Sugar */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Fasting Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Normal: 70-99</span>
              </div>

              {/* Total Cholesterol */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Desirable: &lt;200</span>
              </div>

              {/* Resting Heart Rate */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Resting Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">From watch: 60-75</span>
              </div>

              {/* Body Fat */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFatPercent}
                  onChange={(e) => setBodyFatPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Healthy: 14-24%</span>
              </div>
            </div>
          </div>

          {/* Weekly Reminder Schedule Card */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-slate-900">Weekly Reminder Schedule</span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
            </div>

            {reminderEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={reminderDay}
                    onChange={(e) => setReminderDay(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 text-xs font-medium bg-white"
                  >
                    <option value={0}>Sunday Morning</option>
                    <option value={1}>Monday Morning</option>
                    <option value={5}>Friday Morning</option>
                    <option value={6}>Saturday Morning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 text-xs font-medium bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-teal-200/60">
              <span className="text-[11px] text-teal-950 font-medium">Browser Push Alerts</span>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold transition-all shadow-xs"
              >
                {notifyBrowser ? 'Enabled ✓' : 'Enable Alerts'}
              </button>
            </div>

            {notificationStateText && (
              <p className="text-[10px] font-medium text-teal-900 mt-1">
                {notificationStateText}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Update Health Vitals</span>
          </button>
        </div>
      </div>
    </div>
  );
};
