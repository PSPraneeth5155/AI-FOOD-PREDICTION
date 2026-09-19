import React, { useState, useEffect } from 'react';
import { UserProfile, LoggedMeal, NavigationTab, RecommendedFood } from './types';
import {
  DEFAULT_USER_PROFILE,
  SEED_MEALS,
  RECOMMENDED_FOODS,
  computeNutrientGaps,
  calculateItemNutrition,
  FOOD_DATABASE,
} from './data/nutritionDb';

import { BottomNavBar } from './components/BottomNavBar';
import { HomeDashboard } from './components/HomeDashboard';
import { MealLogger } from './components/MealLogger';
import { InsightsView } from './components/InsightsView';
import { RecommendationsView } from './components/RecommendationsView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { HealthReportModal } from './components/HealthReportModal';
import { MealDetailModal } from './components/MealDetailModal';

export default function App() {
  // 1. User Profile State (persisted in localStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('nutritrack_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user profile from storage', e);
    }
    return DEFAULT_USER_PROFILE;
  });

  // 2. Meals State (persisted in localStorage)
  const [meals, setMeals] = useState<LoggedMeal[]>(() => {
    try {
      const saved = localStorage.getItem('nutritrack_meals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load meals from storage', e);
    }
    return SEED_MEALS;
  });

  // 3. Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');

  // 4. Modals State
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !user.onboardingCompleted);
  const [showHealthReport, setShowHealthReport] = useState<boolean>(false);
  const [selectedMeal, setSelectedMeal] = useState<LoggedMeal | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('nutritrack_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Error saving user to localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('nutritrack_meals', JSON.stringify(meals));
    } catch (e) {
      console.warn('Error saving meals to localStorage', e);
    }
  }, [meals]);

  // Today's Meals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter((m) => m.date === todayStr);

  // Compute live nutrient gaps for today
  const nutrientGaps = computeNutrientGaps(
    todayMeals,
    user.targets,
    user.lifestyle.dietaryPreference,
    user.lifestyle.allergies,
    user.lifestyle.regionalPreference
  );

  // Filter recommendations matching user dietary preferences & allergies
  const filteredRecs = RECOMMENDED_FOODS.filter((rec) => {
    // Diet preference check
    if (user.lifestyle.dietaryPreference === 'vegetarian' && !rec.dietTags.includes('Vegetarian')) {
      return false;
    }
    if (user.lifestyle.dietaryPreference === 'vegan' && !rec.dietTags.includes('Vegan')) {
      return false;
    }
    // Allergy exclusions
    if (user.lifestyle.allergies.some((alg) => rec.allergens.includes(alg))) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    const reg = user.lifestyle.regionalPreference;
    if (reg && reg !== 'Global') {
      const aMatches = a.dietTags.includes(reg) || a.dietTags.includes('Pan-Indian');
      const bMatches = b.dietTags.includes(reg) || b.dietTags.includes('Pan-Indian');
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return 0;
  });

  // Handle Meal Save from MealLogger
  const handleSaveMeal = (newMeal: LoggedMeal) => {
    setMeals((prev) => [newMeal, ...prev]);
    setCurrentTab('home');
  };

  // Quick Add Recommended Food directly to today
  const handleQuickAddRecommended = (rec: RecommendedFood) => {
    const baseDbItem = FOOD_DATABASE.find((f) => f.name === rec.name) || {
      id: rec.id,
      name: rec.name,
      category: 'Recommended',
      servingDescription: '1 standard portion',
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      fiber: rec.fiber,
      sugar: 0,
      sodium: rec.sodium,
    };

    const foodItem = calculateItemNutrition(baseDbItem, 'medium');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const quickMeal: LoggedMeal = {
      id: `meal-rec-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      mealType: 'snack',
      title: rec.name,
      imageUrl: rec.imageUrl,
      servedItems: [foodItem],
      actualItems: [foodItem],
      leftoverPercent: 0,
      totalCalories: rec.calories,
      totalProtein: rec.protein,
      totalCarbs: rec.carbs,
      totalFat: rec.fat,
      totalFiber: rec.fiber,
      totalSodium: rec.sodium,
    };

    setMeals((prev) => [quickMeal, ...prev]);
  };

  // Delete Meal
  const handleDeleteMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    setSelectedMeal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-slate-50/70 to-sky-50/30 text-slate-800 antialiased selection:bg-teal-200">
      {/* Background soft ambient glowing meshes for modern glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-36 -left-24 w-96 h-96 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-sky-200/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 w-96 h-96 rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      {/* Main Container constrained to mobile viewport standard (390-430px optimal, expands nicely on tablet) */}
      <main className="relative z-10 mx-auto min-h-screen">
        {currentTab === 'home' && (
          <HomeDashboard
            user={user}
            todayMeals={todayMeals}
            gaps={nutrientGaps}
            recommendations={filteredRecs}
            onOpenMealLogger={() => setCurrentTab('log')}
            onSelectMeal={(m) => setSelectedMeal(m)}
            onQuickAddRecommended={handleQuickAddRecommended}
            onViewAllTrends={() => setCurrentTab('insights')}
            onViewAllRecs={() => setCurrentTab('recommendations')}
          />
        )}

        {currentTab === 'log' && (
          <MealLogger
            onSaveMeal={handleSaveMeal}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            user={user}
            meals={meals}
          />
        )}

        {currentTab === 'recommendations' && (
          <RecommendationsView
            user={user}
            gaps={nutrientGaps}
            recommendations={filteredRecs}
            onQuickAdd={handleQuickAddRecommended}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onOpenHealthReport={() => setShowHealthReport(true)}
            onRestartOnboarding={() => setShowOnboarding(true)}
          />
        )}
      </main>

      {/* Persistent Floating Bottom Navigation Bar (Hidden when actively logging meal to maintain focus) */}
      {currentTab !== 'log' && (
        <BottomNavBar
          activeTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          onOpenLogger={() => setCurrentTab('log')}
        />
      )}

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={user}
          onComplete={(updated) => {
            setUser(updated);
            setShowOnboarding(false);
          }}
          onClose={user.onboardingCompleted ? () => setShowOnboarding(false) : undefined}
        />
      )}

      {showHealthReport && (
        <HealthReportModal
          user={user}
          meals={meals}
          gaps={nutrientGaps}
          onClose={() => setShowHealthReport(false)}
        />
      )}

      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDeleteMeal={handleDeleteMeal}
        />
      )}
    </div>
  );
}
