import React from 'react';
import { AppleRings } from './AppleRings';
import { UserProfile, LoggedMeal, NutrientGap, RecommendedFood } from '../types';
import { FitnessActivityCard } from './FitnessActivityCard';
import { checkWeeklyReminderStatus } from '../data/fitnessService';
import {
  Plus,
  Flame,
  Droplets,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  HeartPulse,
} from 'lucide-react';

interface HomeDashboardProps {
  user: UserProfile;
  todayMeals: LoggedMeal[];
  gaps: NutrientGap[];
  recommendations: RecommendedFood[];
  onOpenMealLogger: () => void;
  onSelectMeal: (meal: LoggedMeal) => void;
  onQuickAddRecommended: (rec: RecommendedFood) => void;
  onViewAllTrends: () => void;
  onViewAllRecs: () => void;
  onOpenWeeklyUpdate?: () => void;
  onOpenFitnessSync?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  todayMeals,
  gaps,
  recommendations,
  onOpenMealLogger,
  onSelectMeal,
  onQuickAddRecommended,
  onViewAllTrends,
  onViewAllRecs,
  onOpenWeeklyUpdate,
  onOpenFitnessSync,
}) => {
  // Compute today's consumed totals
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const todayProtein = Number(todayMeals.reduce((sum, m) => sum + m.totalProtein, 0).toFixed(1));
  const todayCarbs = Number(todayMeals.reduce((sum, m) => sum + m.totalCarbs, 0).toFixed(1));
  const todayFat = Number(todayMeals.reduce((sum, m) => sum + m.totalFat, 0).toFixed(1));
  const todayFiber = Number(todayMeals.reduce((sum, m) => sum + m.totalFiber, 0).toFixed(1));
  const todaySodium = todayMeals.reduce((sum, m) => sum + m.totalSodium, 0);

  const targets = user.targets;

  // Active top gap message in plain language
  const topGap = gaps.length > 0 ? gaps[0] : null;

  // Weekly Health Check-in status
  const weeklyStatus = checkWeeklyReminderStatus(user);

  return (
    <div className="space-y-6 pb-28 pt-3 px-4 max-w-md mx-auto">
      {/* Top Profile & Greeting Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
          />
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Today's Intake
            </span>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Hello, {user.name.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Quick Streak Badge */}
        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-slate-800">5-day streak</span>
        </div>
      </div>

      {/* WEEKLY HEALTH UPDATE REMINDER BANNER */}
      {weeklyStatus.isDue ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white shadow-md flex items-center justify-between border border-teal-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <HeartPulse className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold">Weekly Health Check-in</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Due ({weeklyStatus.daysSinceLastUpdate}d)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Update blood pressure & sugar to recalibrate your nutrition targets.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWeeklyUpdate}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-[11px] shrink-0 ml-2 shadow-sm active:scale-95 transition-all"
          >
            Update
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/70 text-slate-700 text-xs shadow-xs">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span className="text-[11px] font-medium text-slate-700">
              Health vitals updated {weeklyStatus.daysSinceLastUpdate}d ago
            </span>
          </div>
          <button
            onClick={onOpenWeeklyUpdate}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-800"
          >
            Quick Check-in →
          </button>
        </div>
      )}

      {/* TOP GAP HEALTH BANNER (Plain language, non-clinical) */}
      {topGap && (
        <div
          className={`p-3.5 rounded-2xl border backdrop-blur-md transition-all flex items-start space-x-3 shadow-xs ${
            topGap.status === 'deficit'
              ? 'bg-amber-50/80 border-amber-200/70 text-amber-900'
              : topGap.status === 'excess'
              ? 'bg-rose-50/80 border-rose-200/70 text-rose-900'
              : 'bg-teal-50/80 border-teal-200/70 text-teal-900'
          }`}
        >
          {topGap.status === 'deficit' ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : topGap.status === 'excess' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="text-xs font-bold">{topGap.summary}</div>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{topGap.actionableTip}</p>
          </div>
        </div>
      )}

      {/* APPLE-STYLE CONCENTRIC HEALTH RINGS CARD */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_4px_25px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daily Health Rings</h2>
            <p className="text-[11px] text-slate-400">Calories, Protein, Carbs, Fat</p>
          </div>
          <button
            onClick={onViewAllTrends}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-0.5"
          >
            <span>Trends</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The Animated Rings & Legends */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
          <AppleRings
            calories={{ current: todayCalories, target: targets.calories }}
            protein={{ current: todayProtein, target: targets.protein }}
            carbs={{ current: todayCarbs, target: targets.carbs }}
            fat={{ current: todayFat, target: targets.fat }}
            size={190}
          />

          {/* Macro Progress Stats Grid */}
          <div className="space-y-2.5 w-full sm:w-44">
            {/* Calories */}
            <div className="p-2 rounded-xl bg-teal-50/50 border border-teal-100/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-teal-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                  <span>Calories</span>
                </span>
                <span className="font-bold text-teal-950">
                  {todayCalories} / {targets.calories}
                </span>
              </div>
              <div className="w-full bg-teal-100/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (todayCalories / targets.calories) * 100)}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="p-2 rounded-xl bg-sky-50/50 border border-sky-100/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-sky-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                  <span>Protein</span>
                </span>
                <span className="font-bold text-sky-950">
                  {todayProtein}g / {targets.protein}g
                </span>
              </div>
              <div className="w-full bg-sky-100/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (todayProtein / targets.protein) * 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>Carbs</span>
                </span>
                <span className="font-bold text-amber-950">
                  {todayCarbs}g / {targets.carbs}g
                </span>
              </div>
              <div className="w-full bg-amber-100/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (todayCarbs / targets.carbs) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="p-2 rounded-xl bg-pink-50/50 border border-pink-100/60">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-pink-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                  <span>Fat</span>
                </span>
                <span className="font-bold text-pink-950">
                  {todayFat}g / {targets.fat}g
                </span>
              </div>
              <div className="w-full bg-pink-100/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-pink-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (todayFat / targets.fat) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FITNESS TRACKING & SYNC (Google Fit, Samsung Health, etc.) */}
      <FitnessActivityCard
        user={user}
        todayFoodCalories={todayCalories}
        onOpenSyncModal={onOpenFitnessSync}
      />

      {/* QUICK LOG CTA BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md shadow-teal-700/20 flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold">Have you eaten recently?</h3>
          <p className="text-xs text-teal-100/90">Take a photo to auto-detect your meal</p>
        </div>
        <button
          id="cta-log-meal-button"
          onClick={onOpenMealLogger}
          className="px-4 py-2.5 rounded-xl bg-white text-teal-800 font-bold text-xs shadow-sm hover:bg-teal-50 active:scale-95 transition-all flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* TODAY'S LOGGED MEALS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Today's Logged Meals ({todayMeals.length})
          </h2>
          <span className="text-[11px] text-slate-400">Actual consumption</span>
        </div>

        {todayMeals.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/70 border border-slate-200/80 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">No meals logged for today yet.</p>
            <button
              onClick={onOpenMealLogger}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
            >
              + Tap here to log breakfast or lunch
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => onSelectMeal(meal)}
                className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group active:scale-99"
              >
                <div className="flex items-center space-x-3">
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {meal.mealType.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                        {meal.title}
                      </span>
                      {meal.leftoverPercent > 0 && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                          {100 - meal.leftoverPercent}% eaten
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{meal.time}</span>
                      </span>
                      <span>•</span>
                      <span className="capitalize">{meal.mealType}</span>
                      <span>•</span>
                      <span>{meal.actualItems.length} items</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{meal.totalCalories} kcal</span>
                  <div className="text-[10px] text-slate-400">{meal.totalProtein}g protein</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED FOR YOU (Swipeable horizontal cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recommended For You
            </h2>
          </div>
          <button
            onClick={onViewAllRecs}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-0.5"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1">
          {recommendations.slice(0, 4).map((rec) => (
            <div
              key={rec.id}
              className="w-56 shrink-0 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/70 p-3 shadow-xs flex flex-col justify-between"
            >
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] mb-2 bg-slate-100">
                <img
                  src={rec.imageUrl}
                  alt={rec.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                  {rec.calories} kcal
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{rec.name}</h4>
                <p className="text-[10px] text-teal-700 font-semibold">{rec.highlightNutrient}</p>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {rec.healthBenefit}
                </p>
              </div>

              <button
                onClick={() => onQuickAddRecommended(rec)}
                className="mt-2.5 w-full py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all border border-teal-200/60"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Log to Today</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
