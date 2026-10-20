import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  Scale,
  Award,
  Sparkles,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { FoodItem, FoodSuitabilityResponse, NutrientDriverExplanation, RecommendationLabel } from '../types';

interface SuitabilityExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  suitability: FoodSuitabilityResponse | null;
  onPortionChange?: (newPortionMultiplier: number, newGrams: number) => void;
}

export const SuitabilityExplanationModal: React.FC<SuitabilityExplanationModalProps> = ({
  isOpen,
  onClose,
  foodItem,
  suitability,
  onPortionChange,
}) => {
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  if (!isOpen || !foodItem || !suitability) return null;

  const score = suitability.suitabilityScore;
  const label = suitability.recommendationLabel;
  const risk = suitability.riskLevel;

  // Determine theme color based on score bands
  const getTheme = () => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ring: '#10b981',
        stroke: 'text-emerald-600',
        gradient: 'from-emerald-500 to-teal-600',
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-teal-50 text-teal-900 border-teal-200',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
        ring: '#0d9488',
        stroke: 'text-teal-600',
        gradient: 'from-teal-500 to-cyan-600',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        ring: '#f59e0b',
        stroke: 'text-amber-600',
        gradient: 'from-amber-500 to-orange-500',
      };
    }
    if (score >= 30) {
      return {
        bg: 'bg-orange-50 text-orange-900 border-orange-200',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        ring: '#f97316',
        stroke: 'text-orange-600',
        gradient: 'from-orange-500 to-rose-500',
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-900 border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      ring: '#ef4444',
      stroke: 'text-rose-600',
      gradient: 'from-rose-600 to-red-700',
    };
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className={`p-6 pb-4 bg-gradient-to-r ${theme.gradient} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/25 backdrop-blur-md uppercase tracking-wider">
              {foodItem.cuisineRegion || 'Indian'} &bull; {foodItem.category}
            </span>
            {suitability.sourceConfidence === 'CLINICALLY_CITED' && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/40 text-white">
                <Award className="w-3 h-3" /> Cited Guideline
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold leading-tight">{foodItem.name}</h2>
          <p className="text-sm text-white/80 mt-0.5">{foodItem.servingDescription}</p>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Hero Score Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-4">
              {/* Radial Score Ring */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    style={{ stroke: theme.ring }}
                    strokeDasharray={`${score}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-gray-900 leading-none">{Math.round(score)}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">/ 100</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${theme.badge}`}>
                    {label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      risk === 'SAFE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : risk === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800'
                        : risk === 'WARNING'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {risk}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Hybrid Rule + LightGBM Safety-Floor Blended
                </p>
              </div>
            </div>

            {/* Recommended Portion */}
            {suitability.recommendedPortionGrams && (
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block">
                  Clinical Portion
                </span>
                <span className="text-base font-bold text-gray-800">
                  {suitability.recommendedPortionGrams}g
                </span>
                <span className="text-xs text-gray-500 block truncate max-w-[120px]">
                  {suitability.recommendedHouseholdMeasure}
                </span>
              </div>
            )}
          </div>

          {/* Binding Condition Alert */}
          {suitability.bindingConditionVariant && suitability.bindingConditionVariant !== 'NONE' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-semibold block text-amber-950">
                  Strictest Limiting Condition: {suitability.bindingConditionVariant}
                </span>
                Clinical boundaries for this condition dictated the score ceiling under authoritative safety-floor rules.
              </div>
            </div>
          )}

          {/* Top 3 Clinical Nutrient Drivers */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" /> Key Clinical Nutrient Drivers
            </h3>
            <div className="space-y-3">
              {suitability.topDrivers && suitability.topDrivers.length > 0 ? (
                suitability.topDrivers.map((driver, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 capitalize">
                          {driver.nutrient.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            driver.direction === 'LIMITING'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {driver.direction}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-gray-900">
                          {driver.foodValue} {driver.unit}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          (Target: {driver.safeOrRequiredThreshold} {driver.unit})
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden my-1">
                      <div
                        className={`h-full rounded-full ${
                          driver.direction === 'LIMITING'
                            ? driver.foodValue <= driver.safeOrRequiredThreshold
                              ? 'bg-emerald-500'
                              : driver.foodValue <= driver.dangerThreshold
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : driver.foodValue >= driver.safeOrRequiredThreshold
                            ? 'bg-emerald-500'
                            : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(10, (driver.foodValue / Math.max(1, driver.dangerThreshold || driver.safeOrRequiredThreshold * 1.5)) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Guideline Citation Rationale */}
                    {driver.guidelineCitation && (
                      <p className="text-[11px] text-gray-500 italic mt-1.5 flex items-center gap-1">
                        &bull; {driver.guidelineCitation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No restricting nutrient drivers triggered for this item.</p>
              )}
            </div>
          </div>

          {/* Clinician Portion Optimizer Action */}
          {onPortionChange && suitability.recommendedPortionGrams && foodItem.portionMultiplier !== undefined && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Clinician Safe Portion</span>
                <span className="text-xs text-emerald-800">
                  Scaling down to {suitability.recommendedPortionGrams}g keeps sodium and carbs safely inside your guideline limits.
                </span>
              </div>
              <button
                onClick={() => {
                  const targetMultiplier = Number((suitability.recommendedPortionGrams / 100).toFixed(2));
                  onPortionChange(targetMultiplier, suitability.recommendedPortionGrams);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap ml-3"
              >
                Snap to Portion
              </button>
            </div>
          )}

          {/* Full 12-Nutrient Breakdown Accordion Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowFullBreakdown(!showFullBreakdown)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-gray-700 hover:text-gray-900 uppercase tracking-wider"
            >
              <span>Full 12-Nutrient Clinical Profile</span>
              {showFullBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFullBreakdown && suitability.allNutrientBreakdowns && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 animate-in fade-in duration-150">
                {suitability.allNutrientBreakdowns.map((nb, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 text-xs">
                    <span className="text-gray-500 capitalize block truncate">
                      {nb.nutrient.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-bold text-gray-900">
                      {nb.foodValue} {nb.unit}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      Limit: {nb.safeOrRequiredThreshold} {nb.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Governance Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>Rules: <strong className="text-gray-700">{suitability.ruleSetVersionHash || '504-v1.0.0'}</strong></span>
            <span>Model: <strong className="text-gray-700">{suitability.mlModelVersion || 'lgbm-onnx-v1'}</strong></span>
          </div>
          <span>Engine Latency: <strong className="text-emerald-600">{suitability.latencyMs}ms</strong></span>
        </div>
      </div>
    </div>
  );
};
