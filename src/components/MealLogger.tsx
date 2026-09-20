import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Search,
  Scale,
  Percent,
  Flame,
  Dumbbell,
  HelpCircle,
  RefreshCw,
  Layers,
  AlertCircle,
  SwitchCamera,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { FoodItem, MealType, LoggedMeal, PortionSize, UserProfile } from '../types';
import {
  FOOD_DATABASE,
  SAMPLE_MEAL_PRESETS,
  calculateItemNutrition,
  calculateProteinBreakdown,
} from '../data/nutritionDb';
import { evaluateMealHealthSuitability } from '../data/fitnessService';

interface MealLoggerProps {
  user: UserProfile;
  onSaveMeal: (meal: LoggedMeal) => void;
  onCancel: () => void;
}

export const MealLogger: React.FC<MealLoggerProps> = ({ user, onSaveMeal, onCancel }) => {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mealTitle, setMealTitle] = useState('Lunch Meal');
  const [activeStage, setActiveStage] = useState<'capture' | 'review'>('capture');

  // Images
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [showAfterCapture, setShowAfterCapture] = useState(false);

  // Mode: Indian Plate or Global
  const [isIndianMode, setIsIndianMode] = useState<boolean>(true);

  // Camera stream state & robust attachment
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const afterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Detection states & active interactive selection
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<FoodItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [leftoverPercent, setLeftoverPercent] = useState<number>(0);

  // Feedback loop toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const itemCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Expandable protein view toggle
  const [showProteinDetails, setShowProteinDetails] = useState<boolean>(true);

  // Manual Food Search Modal
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('all');

  // Start Camera Stream with fallback
  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    setCameraError(null);
    const targetFacing = overrideFacing || facingMode;

    try {
      // Stop prior tracks
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Constrained camera failed, trying simple video stream:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCameraStream(fallbackStream);
        setIsCameraActive(true);
      } catch (fallbackErr) {
        console.warn('Camera access unavailable:', fallbackErr);
        setCameraError(
          'Camera access was not granted or is unavailable. You can upload a photo or choose a 1-tap demo plate.'
        );
        setIsCameraActive(false);
      }
    }
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Wire video element as soon as camera is active & stream is ready
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => {
        console.warn('Video playback error:', e);
      });
    }
  }, [isCameraActive, cameraStream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from live video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const width = v.videoWidth || 640;
    const height = v.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(v, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopCamera();
      handleProcessImage(dataUrl);
    }
  };

  // Helper to optimize and resize uploaded photos for fast vision processing
  const optimizeImageForUpload = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isAfter: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        const optimized = await optimizeImageForUpload(rawBase64);
        if (isAfter) {
          setAfterImage(optimized);
          setLeftoverPercent(20);
        } else {
          handleProcessImage(optimized);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Process image with backend detection endpoint
  const handleProcessImage = async (imageBase64: string, presetItems?: any[]) => {
    setBeforeImage(imageBase64);
    setIsAnalyzing(true);
    setActiveStage('review');
    // Clear previously detected items so stale food never displays during or after new upload
    setDetectedItems([]);

    if (presetItems) {
      // Immediate preset selection with calibrated confidence & alternatives
      const items: FoodItem[] = presetItems.map((pi) => {
        const match = FOOD_DATABASE.find((f) => f.name.toLowerCase() === pi.name.toLowerCase()) || FOOD_DATABASE[0];
        const constructed = calculateItemNutrition(match, pi.portion || 'medium');
        if (pi.box) constructed.box = pi.box;
        if (match.cuisineRegion) constructed.cuisineRegion = match.cuisineRegion;
        if (typeof match.isHighProtein === 'boolean') constructed.isHighProtein = match.isHighProtein;
        const candidates: string[] = pi.similarCandidates || match.similarCandidates || [];
        constructed.similarCandidates = candidates;
        constructed.confidenceTier = pi.confidenceTier || (candidates.length > 0 ? 'medium' : 'high');
        constructed.confidence = pi.confidence || (constructed.confidenceTier === 'high' ? 0.88 : 0.72);
        constructed.isConfirmed = constructed.confidenceTier === 'high';
        constructed.originalPrediction = pi.name;
        return constructed;
      });

      setDetectedItems(items);
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch('/api/detect-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mealType,
          isIndianMode,
          cuisinePreference: isIndianMode ? 'indian' : 'global',
        }),
      });

      const data = await res.json();
      if (data.detectedItems && data.detectedItems.length > 0) {
        setDetectedItems(data.detectedItems);
        if (data.mealTitle && (!mealTitle || mealTitle === 'Lunch' || mealTitle === 'Breakfast' || mealTitle === 'Dinner')) {
          setMealTitle(data.mealTitle);
        }
      } else {
        setDetectedItems([]);
        setToastMessage(data.message || 'No dishes detected. Tap "+ Add Item" to choose from food library.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.warn('Detection API error:', err);
      setDetectedItems([]);
      setToastMessage('Could not connect to food recognition service. Tap "+ Add Item" to add manually.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Change Portion Size (Small / Medium / Large)
  const handleChangePortion = (itemId: string, newPortion: PortionSize) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const dbEntry = FOOD_DATABASE.find((f) => f.name.toLowerCase() === item.name.toLowerCase());
        if (dbEntry) {
          const recalculated = calculateItemNutrition(dbEntry, newPortion);
          return {
            ...recalculated,
            id: item.id,
            name: item.name,
            box: item.box,
            cuisineRegion: item.cuisineRegion || dbEntry.cuisineRegion,
            isHighProtein: item.isHighProtein ?? dbEntry.isHighProtein,
            similarCandidates: item.similarCandidates || dbEntry.similarCandidates,
          };
        }
        // If not in DB, adjust by ratio
        const currentMultiplier = item.portionMultiplier || 1.0;
        const newMultiplier = newPortion === 'small' ? 0.7 : newPortion === 'large' ? 1.4 : 1.0;
        const factor = newMultiplier / currentMultiplier;
        return {
          ...item,
          portion: newPortion,
          portionMultiplier: newMultiplier,
          calories: Math.round(item.calories * factor),
          protein: Number((item.protein * factor).toFixed(1)),
          carbs: Number((item.carbs * factor).toFixed(1)),
          fat: Number((item.fat * factor).toFixed(1)),
          fiber: Number((item.fiber * factor).toFixed(1)),
          sodium: Math.round(item.sodium * factor),
        };
      })
    );
  };

  // Log user correction / confirmation to feedback loop for model improvement
  const logCorrection = async (
    originalPrediction: string,
    selectedFood: string,
    confidenceTier: 'high' | 'medium' | 'low',
    feedbackType: 'approved_as_is' | 'swapped_candidate' | 'manual_search_override',
    cuisineRegion?: string
  ) => {
    try {
      await fetch('/api/feedback/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrediction,
          selectedFood,
          confidenceTier,
          feedbackType,
          cuisineRegion: cuisineRegion || 'Pan-Indian',
        }),
      });
      setToastMessage(
        feedbackType === 'approved_as_is'
          ? 'Dish confirmed ✓'
          : `Swapped to ${selectedFood} & recorded to learning loop`
      );
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      console.warn('Feedback logging error:', e);
    }
  };

  // 1-Tap Confirmation for Medium/Low confidence items
  const handleConfirmItem = (itemId: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        logCorrection(
          item.originalPrediction || item.name,
          item.name,
          item.confidenceTier || 'medium',
          'approved_as_is',
          item.cuisineRegion
        );
        return { ...item, isConfirmed: true, confidenceTier: 'high' };
      })
    );
  };

  // 1-Tap Disambiguation: swap with similar candidate
  const handleSwapCandidate = (itemId: string, candidateName: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const dbEntry = FOOD_DATABASE.find((f) => f.name.toLowerCase() === candidateName.toLowerCase());
        logCorrection(
          item.originalPrediction || item.name,
          candidateName,
          item.confidenceTier || 'medium',
          'swapped_candidate',
          dbEntry?.cuisineRegion || item.cuisineRegion
        );
        if (dbEntry) {
          const currentPortion = item.portion || 'medium';
          const replacement = calculateItemNutrition(dbEntry, currentPortion);
          return {
            ...replacement,
            id: item.id,
            name: dbEntry.name,
            originalPrediction: item.originalPrediction || item.name,
            confidenceTier: 'high',
            isConfirmed: true,
            box: item.box,
            cuisineRegion: dbEntry.cuisineRegion,
            isHighProtein: dbEntry.isHighProtein,
            similarCandidates: dbEntry.similarCandidates || item.similarCandidates?.filter((c) => c !== candidateName),
          };
        }
        return { ...item, name: candidateName, isConfirmed: true, confidenceTier: 'high' };
      })
    );
  };

  // Rename detected item
  const handleRenameItem = (itemId: string, newName: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, name: newName, isConfirmed: true };
      })
    );
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setDetectedItems((prev) => prev.filter((i) => i.id !== itemId));
    if (selectedItemId === itemId) setSelectedItemId(null);
  };

  // Select food from manual database (either add fresh or replace active item)
  const handleSelectFoodFromDb = (baseItem: (typeof FOOD_DATABASE)[0]) => {
    if (replacingItemId) {
      setDetectedItems((prev) =>
        prev.map((item) => {
          if (item.id !== replacingItemId) return item;
          logCorrection(
            item.originalPrediction || item.name,
            baseItem.name,
            item.confidenceTier || 'low',
            'manual_search_override',
            baseItem.cuisineRegion
          );
          const replacement = calculateItemNutrition(baseItem, item.portion || 'medium');
          return {
            ...replacement,
            id: item.id,
            name: baseItem.name,
            originalPrediction: item.originalPrediction || item.name,
            confidenceTier: 'high',
            isConfirmed: true,
            box: item.box,
            cuisineRegion: baseItem.cuisineRegion,
            isHighProtein: baseItem.isHighProtein,
            similarCandidates: baseItem.similarCandidates,
          };
        })
      );
      setReplacingItemId(null);
      setShowManualSearch(false);
      setSearchQuery('');
      return;
    }

    // Add fresh food
    const newItem = calculateItemNutrition(baseItem, 'medium');
    newItem.id = `item-${Date.now()}`;
    newItem.cuisineRegion = baseItem.cuisineRegion;
    newItem.isHighProtein = baseItem.isHighProtein;
    newItem.similarCandidates = baseItem.similarCandidates;
    newItem.confidenceTier = 'high';
    newItem.isConfirmed = true;
    newItem.originalPrediction = baseItem.name;
    setDetectedItems((prev) => [...prev, newItem]);
    setShowManualSearch(false);
    setSearchQuery('');
  };

  // Calculate actual consumption considering leftovers
  const consumptionRatio = Math.max(0, Math.min(1, (100 - leftoverPercent) / 100));

  const actualConsumedItems: FoodItem[] = detectedItems.map((item) => ({
    ...item,
    calories: Math.round(item.calories * consumptionRatio),
    protein: Number((item.protein * consumptionRatio).toFixed(1)),
    carbs: Number((item.carbs * consumptionRatio).toFixed(1)),
    fat: Number((item.fat * consumptionRatio).toFixed(1)),
    fiber: Number((item.fiber * consumptionRatio).toFixed(1)),
    sodium: Math.round(item.sodium * consumptionRatio),
  }));

  const totalCalories = actualConsumedItems.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = Number(actualConsumedItems.reduce((sum, i) => sum + i.protein, 0).toFixed(1));
  const totalCarbs = Number(actualConsumedItems.reduce((sum, i) => sum + i.carbs, 0).toFixed(1));
  const totalFat = Number(actualConsumedItems.reduce((sum, i) => sum + i.fat, 0).toFixed(1));
  const totalFiber = Number(actualConsumedItems.reduce((sum, i) => sum + i.fiber, 0).toFixed(1));
  const totalSodium = actualConsumedItems.reduce((sum, i) => sum + i.sodium, 0);

  // Protein breakdown metrics
  const proteinData = calculateProteinBreakdown(actualConsumedItems);

  // Instant Health Suitability Assessment based on user's clinical vitals & targets
  const healthSuitability = evaluateMealHealthSuitability(actualConsumedItems, user);

  // Save finalized meal
  const handleSave = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const newMeal: LoggedMeal = {
      id: `meal-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      mealType,
      title: mealTitle || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
      imageUrl: beforeImage || undefined,
      afterImageUrl: afterImage || undefined,
      servedItems: detectedItems,
      actualItems: actualConsumedItems,
      leftoverPercent,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSodium,
    };

    onSaveMeal(newMeal);
  };

  // Filter food database for manual search
  const filteredDb = FOOD_DATABASE.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.regionalNames && item.regionalNames.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesQuery) return false;

    if (searchCategoryFilter === 'south-indian') {
      return item.cuisineRegion === 'South Indian';
    }
    if (searchCategoryFilter === 'north-indian') {
      return item.cuisineRegion === 'North Indian';
    }
    if (searchCategoryFilter === 'high-protein') {
      return item.isHighProtein || item.protein >= 10;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-28 pt-4 px-4 max-w-md mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900">
          {activeStage === 'capture' ? 'Log Meal' : 'Confirm Meal'}
        </h1>
        <div className="w-9" />
      </div>

      {/* STAGE 1: CAPTURE & QUICK PRESETS */}
      {activeStage === 'capture' && (
        <div className="space-y-4">
          {/* Meal Type Selector */}
          <div className="p-1 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-xs flex items-center justify-between">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setMealType(type);
                  setMealTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Meal`);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all ${
                  mealType === type
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Cuisine Recognition Mode Toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-teal-950">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <div>
                <span className="text-xs font-bold">Multi-Item Indian Food Detection</span>
                <p className="text-[10px] text-teal-800">
                  Segments thalis, dosas, sambar & chutneys into separate items
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsIndianMode(!isIndianMode)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                isIndianMode
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              {isIndianMode ? '🇮🇳 Active' : 'Global'}
            </button>
          </div>

          {/* Live Camera Viewfinder or Capture Card */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[4/3] flex flex-col items-center justify-center text-white shadow-lg">
            {isCameraActive ? (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  onLoadedMetadata={() => {
                    videoRef.current?.play().catch(() => {});
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Camera Top Controls */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
                  <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Viewfinder</span>
                  </span>

                  <button
                    type="button"
                    onClick={flipCamera}
                    title="Switch Camera (Front/Rear)"
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>

                {/* Viewfinder Reticle */}
                <div className="absolute inset-10 border border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-7 h-7 border-t-2 border-l-2 border-teal-400 absolute top-0 left-0" />
                  <div className="w-7 h-7 border-t-2 border-r-2 border-teal-400 absolute top-0 right-0" />
                  <div className="w-7 h-7 border-b-2 border-l-2 border-teal-400 absolute bottom-0 left-0" />
                  <div className="w-7 h-7 border-b-2 border-r-2 border-teal-400 absolute bottom-0 right-0" />
                  <span className="text-[11px] text-white/95 font-semibold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm shadow-xs">
                    Center Plate & Tap Shutter
                  </span>
                </div>

                {/* Shutter Button & Controls */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-6 z-20">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-2 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    title="Snap Plate"
                    className="w-16 h-16 rounded-full border-4 border-white bg-teal-500 hover:bg-teal-400 flex items-center justify-center active:scale-90 shadow-xl transition-transform"
                  >
                    <div className="w-6 h-6 rounded-full bg-white shadow-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Photo instead"
                    className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-sm border border-white/20 active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Snap Plate or Upload Photo</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-[240px]">
                    Instantly evaluates portion nutrition and checks suitability against your health vitals.
                  </p>
                </div>

                {cameraError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] leading-tight max-w-xs">
                    {cameraError}
                  </div>
                )}

                <div className="flex items-center space-x-3 w-full max-w-xs pt-1">
                  <button
                    id="btn-start-camera"
                    type="button"
                    onClick={() => startCamera()}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-teal-900/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>

                  <button
                    id="btn-upload-photo"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, false)}
            />
          </div>

          {/* 1-Tap Sample Platters (Indian & Global) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700">1-Tap Demo Platters</span>
              <span className="text-[11px] text-teal-700 font-semibold">Under 3 Taps</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SAMPLE_MEAL_PRESETS.map((preset: any) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setMealType(preset.mealType);
                    setMealTitle(preset.name);
                    handleProcessImage(preset.image, preset.items);
                  }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all text-left flex flex-col active:scale-98"
                >
                  <div className="h-24 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={preset.image}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {preset.isIndianPlate && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-500/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
                        🇮🇳 {preset.cuisineRegion || 'Indian'}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{preset.name}</div>
                    <div className="text-[10px] text-teal-700 font-medium capitalize mt-0.5">
                      {preset.mealType} • {preset.items.length} items
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: REVIEW & ADJUST MULTI-ITEM DETECTION */}
      {activeStage === 'review' && (
        <div className="space-y-4">
          {/* Plate Image View with Interactive Bounding Boxes */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
            {beforeImage && (
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={beforeImage}
                  alt="Meal Plate"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Individual item bounding boxes with tap-to-select */}
                {detectedItems.map((item, idx) => {
                  if (!item.box) return null;
                  const top = (item.box.ymin / 1000) * 100;
                  const left = (item.box.xmin / 1000) * 100;
                  const width = ((item.box.xmax - item.box.xmin) / 1000) * 100;
                  const height = ((item.box.ymax - item.box.ymin) / 1000) * 100;
                  const isSelected = selectedItemId === item.id;
                  const needsConfirmation =
                    (item.confidenceTier === 'medium' || item.confidenceTier === 'low') && !item.isConfirmed;

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        itemCardRefs.current[item.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`absolute border-2 rounded-xl transition-all duration-200 cursor-pointer pointer-events-auto ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/25 ring-2 ring-amber-300 z-20 scale-[1.02]'
                          : needsConfirmation
                          ? 'border-amber-400/90 bg-amber-400/15 hover:border-amber-300 hover:bg-amber-400/25 z-10'
                          : 'border-teal-400 bg-teal-500/15 hover:border-teal-300 hover:bg-teal-500/25 z-10'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${Math.max(16, width)}%`,
                        height: `${Math.max(16, height)}%`,
                      }}
                    >
                      <span
                        className={`absolute -top-3 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : needsConfirmation
                            ? 'bg-amber-700 text-white'
                            : 'bg-teal-900/90 text-white'
                        }`}
                      >
                        <span>{item.name}</span>
                        {needsConfirmation && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                        )}
                      </span>
                    </div>
                  );
                })}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">
                      Detecting plate items & calculating protein...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Header Banner */}
            <div className="px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between">
              <div className="flex-1 mr-2">
                <input
                  type="text"
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="text-sm font-bold text-slate-800 border-b border-dashed border-slate-300 focus:border-teal-500 focus:outline-none w-full bg-transparent"
                  placeholder="Meal Name"
                />
                <span className="text-[10px] text-slate-400 capitalize">{mealType}</span>
              </div>
              <button
                onClick={() => setShowManualSearch(true)}
                className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 flex items-center space-x-1 hover:bg-teal-100 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* DEDICATED PROTEIN BREAKDOWN MODULE (EXPANDABLE) */}
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs overflow-hidden">
            <div
              onClick={() => setShowProteinDetails(!showProteinDetails)}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">Protein Breakdown</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {totalProtein}g Total
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Portion-scaled formula per item</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  showProteinDetails ? 'rotate-180' : ''
                }`}
              />
            </div>

            {showProteinDetails && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100">
                {/* Visual Protein Equation */}
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs">
                  <span className="font-semibold block text-[11px] text-emerald-800 uppercase tracking-wider mb-1">
                    Combined Protein Formula
                  </span>
                  <div className="font-medium leading-relaxed">{proteinData.summarySentence}</div>
                </div>

                {/* High-Protein vs Low-Protein Separation */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* High Protein Items */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700">
                      <span>⚡ High-Protein Items</span>
                    </div>
                    {proteinData.highProteinItems.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        {proteinData.highProteinItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-700 font-medium truncate max-w-[100px]">
                              {item.name}
                            </span>
                            <span className="font-bold text-emerald-700">{item.protein}g</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No high-protein item</p>
                    )}
                  </div>

                  {/* Standard / Low Protein Items */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-600">
                      <span>Accompanying Items</span>
                    </div>
                    {proteinData.lowProteinItems.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        {proteinData.lowProteinItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-700 font-medium truncate max-w-[100px]">
                              {item.name}
                            </span>
                            <span className="font-bold text-slate-600">{item.protein}g</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">None</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DETECTED FOOD ITEM CARDS (INDIVIDUAL CARDS ON PLATE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Individual Food Items ({detectedItems.length})
              </span>
              <span className="text-[11px] text-slate-400">Editable portion & items</span>
            </div>

            {detectedItems.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">No items detected on this plate.</p>
                <button
                  onClick={() => setShowManualSearch(true)}
                  className="text-xs font-semibold text-teal-700 underline"
                >
                  Search food database to add manually
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {detectedItems.map((item) => {
                  const isHighProteinItem = item.isHighProtein ?? item.protein >= 8;
                  const candidates = item.similarCandidates || [];
                  const isSelected = selectedItemId === item.id;
                  const tier = item.confidenceTier || 'medium';
                  const needsConfirmation = (tier === 'medium' || tier === 'low') && !item.isConfirmed;

                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        itemCardRefs.current[item.id] = el;
                      }}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`p-3.5 rounded-2xl bg-white border transition-all space-y-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-300/80 shadow-md'
                          : needsConfirmation && tier === 'low'
                          ? 'border-rose-200 bg-rose-50/20 shadow-xs hover:border-rose-300'
                          : needsConfirmation && tier === 'medium'
                          ? 'border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-300'
                          : 'border-slate-200 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      {/* CONFIDENCE ACTION BANNERS: 1-2 TAP HUMAN-IN-THE-LOOP */}
                      {needsConfirmation && tier === 'medium' && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                          <div className="flex items-center space-x-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[11px] font-semibold">Confirm this dish?</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmItem(item.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold shadow-xs active:scale-95 flex items-center space-x-1 transition-all"
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Looks right</span>
                          </button>
                        </div>
                      )}

                      {needsConfirmation && tier === 'low' && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                          <div className="flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-[11px] font-semibold">Unrecognized dish</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplacingItemId(item.id);
                              setShowManualSearch(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs active:scale-95 flex items-center space-x-1 transition-all"
                          >
                            <Search className="w-3 h-3 stroke-[2.5]" />
                            <span>Identify dish</span>
                          </button>
                        </div>
                      )}

                      {/* Item Header & Badges */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleRenameItem(item.id, e.target.value)}
                              className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                            />
                            {item.isConfirmed && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 flex items-center space-x-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Confirmed</span>
                              </span>
                            )}
                            {item.cuisineRegion && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                {item.cuisineRegion}
                              </span>
                            )}
                            {isHighProteinItem && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center space-x-0.5">
                                <span>⚡ High Protein</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.servingDescription}</p>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplacingItemId(item.id);
                              setShowManualSearch(true);
                            }}
                            className="text-slate-400 hover:text-teal-700 p-1 transition-colors"
                            title="Replace dish"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item.id);
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 1-Tap Candidate Disambiguation Chips (Handles Visually Similar Foods) */}
                      {candidates.length > 0 && (
                        <div className="pt-0.5 flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-0.5">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            <span>{needsConfirmation ? 'Or swap to:' : 'Similar:'}</span>
                          </span>
                          {candidates.map((cand, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwapCandidate(item.id, cand);
                              }}
                              className="text-[10px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 active:scale-95 px-2 py-0.5 rounded-lg border border-teal-200 transition-colors"
                            >
                              Swap to {cand}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplacingItemId(item.id);
                              setShowManualSearch(true);
                            }}
                            className="text-[10px] font-medium text-slate-400 hover:text-teal-700 px-1 py-0.5 underline"
                          >
                            Search other
                          </button>
                        </div>
                      )}

                      {/* Portion Buttons (Small / Medium / Large) & Macro Badge */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          {(['small', 'medium', 'large'] as PortionSize[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangePortion(item.id, p);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                                item.portion === p
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        {/* Nutrient Summary for Item */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">{item.calories} kcal</span>
                          <div className="text-[10px] text-slate-500">
                            <span className="font-bold text-emerald-700">{item.protein}g P</span> •{' '}
                            {item.carbs}g C • {item.fat}g F
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional: BEFORE & AFTER MEAL CONSUMPTION PAIR */}
          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Plate Finish (Optional)</h4>
                  <p className="text-[10px] text-slate-500">Calculate actual eaten = served - leftovers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAfterCapture(!showAfterCapture)}
                className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
              >
                {showAfterCapture ? 'Hide' : '+ After Photo'}
              </button>
            </div>

            {showAfterCapture && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => afterFileInputRef.current?.click()}
                    className="p-3 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 flex flex-col items-center justify-center text-center space-y-1 text-teal-800"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">
                      {afterImage ? 'Change Finish Photo' : 'Upload Finish Plate'}
                    </span>
                  </button>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 font-medium">Leftover Amount</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={leftoverPercent}
                        onChange={(e) => setLeftoverPercent(parseInt(e.target.value))}
                        className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg"
                      />
                      <span className="text-xs font-bold text-slate-800 w-8">{leftoverPercent}%</span>
                    </div>
                  </div>
                </div>

                <input
                  ref={afterFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, true)}
                />

                {leftoverPercent > 0 && (
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-900 text-xs font-medium flex items-center justify-between border border-teal-100">
                    <span>Actual Consumption:</span>
                    <span className="font-bold">{100 - leftoverPercent}% eaten</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INSTANT HEALTH SUITABILITY EVALUATION (Tailored to User's Clinical Vitals) */}
          {actualConsumedItems.length > 0 && (
            <div
              className={`p-4 rounded-3xl border transition-all space-y-3 ${
                healthSuitability.status === 'suitable'
                  ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                  : healthSuitability.status === 'moderate'
                  ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                  : 'bg-rose-50/70 border-rose-200/90 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      healthSuitability.status === 'suitable'
                        ? 'bg-emerald-600 text-white'
                        : healthSuitability.status === 'moderate'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {healthSuitability.status === 'suitable' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : healthSuitability.status === 'moderate' ? (
                      <Info className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      {healthSuitability.badgeLabel}
                    </span>
                    <span className="text-[10px] opacity-75 block">
                      Based on BP, Blood Sugar & Target Macros
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    healthSuitability.status === 'suitable'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : healthSuitability.status === 'moderate'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {healthSuitability.status === 'suitable'
                    ? 'Healthy Choice'
                    : healthSuitability.status === 'moderate'
                    ? 'Moderate'
                    : 'Caution'}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed font-medium">
                {healthSuitability.summary}
              </p>

              {/* Vitals Evaluation Grid */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                  Clinical Vital Checks:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {healthSuitability.vitalChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-200/60 flex items-start justify-between text-xs space-x-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {check.vital}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            • {check.userValue}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          {check.plateImpact}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          check.status === 'good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : check.status === 'warning'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {check.status === 'good' ? 'OK ✓' : 'Alert ⚠️'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Clinical Recommendations */}
              {healthSuitability.clinicalTips.length > 0 && (
                <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-700 block">
                    Nutrition Guidance:
                  </span>
                  {healthSuitability.clinicalTips.map((tip, idx) => (
                    <p key={idx} className="text-[10px] text-slate-600 leading-tight">
                      • {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Running Totals Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                Meal Totals
              </span>
              <span className="text-base font-extrabold text-teal-400">
                {totalCalories} kcal
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-slate-700">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Protein</span>
                <p className="text-xs font-extrabold text-white">{totalProtein}g</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Carbs</span>
                <p className="text-xs font-bold text-white">{totalCarbs}g</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Fat</span>
                <p className="text-xs font-bold text-white">{totalFat}g</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Fiber</span>
                <p className="text-xs font-bold text-white">{totalFiber}g</p>
              </div>
            </div>
          </div>

          {/* Primary 1-Tap Save Action */}
          <div className="pt-2">
            <button
              id="btn-confirm-save-meal"
              onClick={handleSave}
              disabled={detectedItems.length === 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center space-x-2 active:scale-98 transition-all shadow-lg shadow-teal-800/25"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Confirm & Save Meal</span>
            </button>
          </div>
        </div>
      )}

      {/* HUMAN-IN-THE-LOOP FEEDBACK TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MANUAL FOOD SEARCH MODAL (FOR ADDING OR FAST 1-TAP REPLACING) */}
      {showManualSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {replacingItemId ? 'Replace Detected Dish' : 'Search Food Library'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {replacingItemId
                    ? 'Select the exact Indian or global dish from database'
                    : 'Over 50+ regional Indian items & whole foods'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManualSearch(false);
                  setReplacingItemId(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Dosa, Sambar, Rasam, Paneer, Dal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] font-semibold scrollbar-none">
                {[
                  { id: 'all', label: 'All Foods' },
                  { id: 'south-indian', label: '🇮🇳 South Indian' },
                  { id: 'north-indian', label: '🇮🇳 North Indian' },
                  { id: 'high-protein', label: '⚡ High Protein' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSearchCategoryFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${
                      searchCategoryFilter === chip.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Results */}
            <div className="p-2 overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredDb.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching foods found for "{searchQuery}".
                </div>
              ) : (
                filteredDb.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectFoodFromDb(item)}
                    className="w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div className="flex-1 mr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-800">{item.name}</span>
                        {item.cuisineRegion && (
                          <span className="text-[9px] font-bold px-1 rounded-sm bg-amber-50 text-amber-700">
                            {item.cuisineRegion}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.servingDescription} • {item.calories} kcal •{' '}
                        <span className="font-bold text-emerald-700">{item.protein}g protein</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${
                        replacingItemId
                          ? 'text-amber-800 bg-amber-100'
                          : 'text-teal-700 bg-teal-50'
                      }`}
                    >
                      {replacingItemId ? 'Replace' : '+ Add'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
