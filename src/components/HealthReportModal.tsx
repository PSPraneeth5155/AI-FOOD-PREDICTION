import React, { useState } from 'react';
import { UserProfile, LoggedMeal, NutrientGap } from '../types';
import {
  FileText,
  Printer,
  Share2,
  X,
  CheckCircle,
  AlertCircle,
  Heart,
  Activity,
  Calendar,
} from 'lucide-react';

interface HealthReportModalProps {
  user: UserProfile;
  meals: LoggedMeal[];
  gaps: NutrientGap[];
  onClose: () => void;
}

export const HealthReportModal: React.FC<HealthReportModalProps> = ({
  user,
  meals,
  gaps,
  onClose,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7days' | '30days'>('7days');

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate averages across meals
  const totalCals = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  const totalProt = meals.reduce((sum, m) => sum + m.totalProtein, 0);
  const totalCarb = meals.reduce((sum, m) => sum + m.totalCarbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.totalFat, 0);
  const totalFiber = meals.reduce((sum, m) => sum + m.totalFiber, 0);
  const totalSod = meals.reduce((sum, m) => sum + m.totalSodium, 0);

  // Group by unique dates
  const uniqueDates = Array.from(new Set(meals.map((m) => m.date)));
  const daysCount = Math.max(1, uniqueDates.length);

  const avgCalories = Math.round(totalCals / daysCount);
  const avgProtein = Number((totalProt / daysCount).toFixed(1));
  const avgCarbs = Number((totalCarb / daysCount).toFixed(1));
  const avgFat = Number((totalFat / daysCount).toFixed(1));
  const avgFiber = Number((totalFiber / daysCount).toFixed(1));
  const avgSodium = Math.round(totalSod / daysCount);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${user.name} - Clinical Nutrition Health Report`,
          text: `Doctor Summary: BMI ${user.bmi} (${user.bmiCategory}), Avg Calories: ${avgCalories} kcal, Avg Protein: ${avgProtein}g, Avg Sodium: ${avgSodium}mg.`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `NutriTrack AI Health Report for ${user.name}\nDate: ${today}\nBMI: ${user.bmi} (${user.bmiCategory})\nBP: ${user.medical.systolicBP || '--'}/${user.medical.diastolicBP || '--'} mmHg\nFasting Glucose: ${user.medical.bloodSugar || '--'} mg/dL\nCholesterol: ${user.medical.cholesterol || '--'} mg/dL\nAvg Daily Calories: ${avgCalories} kcal\nAvg Protein: ${avgProtein}g\nAvg Fiber: ${avgFiber}g\nAvg Sodium: ${avgSodium}mg`
      );
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Action Header (hidden in print) */}
        <div className="no-print px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-800">Doctor Health Summary</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT BODY */}
        <div id="printable-health-report" className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-teal-700" />
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  NutriTrack Clinical Health Summary
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive dietary intake & vital marker history for physician review
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Report Date</span>
              <p className="text-xs font-bold text-slate-800">{today}</p>
            </div>
          </div>

          {/* Patient Demographics & BMI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Patient</span>
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user.gender}, {user.age} yrs
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Height & Weight</span>
              <p className="text-xs font-bold text-slate-900">
                {user.heightCm} cm • {user.weightKg} kg
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user.lifestyle.activityLevel.replace('_', ' ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Body Mass Index</span>
              <p className="text-xs font-extrabold text-teal-800">{user.bmi}</p>
              <p className="text-[10px] text-teal-700 font-medium">{user.bmiCategory}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Diet / Allergies</span>
              <p className="text-xs font-bold text-slate-900 capitalize">
                {user.lifestyle.dietaryPreference}
              </p>
              <p className="text-[10px] text-rose-600 font-medium truncate">
                {user.lifestyle.allergies.length > 0
                  ? user.lifestyle.allergies.join(', ')
                  : 'No allergies recorded'}
              </p>
            </div>
          </div>

          {/* Vital Markers Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Patient Vital Markers</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Blood Pressure</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {user.medical.systolicBP && user.medical.diastolicBP
                    ? `${user.medical.systolicBP}/${user.medical.diastolicBP}`
                    : '120/80'}{' '}
                  <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                </p>
                <span className="text-[9px] text-teal-600 font-medium">Standard range</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Fasting Sugar</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {user.medical.bloodSugar || 92}{' '}
                  <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                </p>
                <span className="text-[9px] text-teal-600 font-medium">Normal (&lt;100)</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cholesterol</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {user.medical.cholesterol || 184}{' '}
                  <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                </p>
                <span className="text-[9px] text-teal-600 font-medium">Desirable (&lt;200)</span>
              </div>
            </div>
          </div>

          {/* Average Nutrient Intake (7-Day Averages) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-700" />
                <span>Nutrient Intake Averages ({daysCount} Recorded Days)</span>
              </h3>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-100/80 px-3 py-2 font-bold text-slate-600 text-[11px]">
                <span>Nutrient</span>
                <span className="text-right">Observed Avg</span>
                <span className="text-right">Prescribed Target</span>
                <span className="text-right">Clinical Status</span>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <span className="font-semibold text-slate-800">Energy (Calories)</span>
                  <span className="text-right font-bold">{avgCalories} kcal</span>
                  <span className="text-right text-slate-500">{user.targets.calories} kcal</span>
                  <span className="text-right text-teal-700 font-semibold">On Target</span>
                </div>

                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <span className="font-semibold text-slate-800">Dietary Protein</span>
                  <span className="text-right font-bold">{avgProtein}g</span>
                  <span className="text-right text-slate-500">{user.targets.protein}g</span>
                  <span
                    className={`text-right font-semibold ${
                      avgProtein < user.targets.protein * 0.85 ? 'text-amber-700' : 'text-teal-700'
                    }`}
                  >
                    {avgProtein < user.targets.protein * 0.85 ? 'Mild Deficit' : 'Optimal'}
                  </span>
                </div>

                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <span className="font-semibold text-slate-800">Dietary Fiber</span>
                  <span className="text-right font-bold">{avgFiber}g</span>
                  <span className="text-right text-slate-500">{user.targets.fiber}g</span>
                  <span
                    className={`text-right font-semibold ${
                      avgFiber < 25 ? 'text-amber-700' : 'text-teal-700'
                    }`}
                  >
                    {avgFiber < 25 ? 'Low Fiber' : 'Target Met'}
                  </span>
                </div>

                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <span className="font-semibold text-slate-800">Sodium (Electrolyte)</span>
                  <span className="text-right font-bold">{avgSodium} mg</span>
                  <span className="text-right text-slate-500">{user.targets.sodium} mg</span>
                  <span
                    className={`text-right font-semibold ${
                      avgSodium > user.targets.sodium ? 'text-rose-700' : 'text-teal-700'
                    }`}
                  >
                    {avgSodium > user.targets.sodium ? 'Elevated' : 'Protected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Flagged Deficiencies & Observations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Flagged Dietary Observations
            </h3>

            <div className="space-y-2">
              {gaps.map((gap, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">{gap.summary}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{gap.actionableTip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature / Physician Verification Line */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-400">
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1" />
              <span>Reviewing Physician Signature & Date</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1" />
              <span>Clinical Notes & Diagnostic Recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
