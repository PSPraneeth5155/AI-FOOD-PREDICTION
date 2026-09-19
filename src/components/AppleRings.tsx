import React from 'react';

interface RingData {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  trackColor: string;
  radius: number;
  strokeWidth: number;
}

interface AppleRingsProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  size?: number;
}

export const AppleRings: React.FC<AppleRingsProps> = ({
  calories,
  protein,
  carbs,
  fat,
  size = 220,
}) => {
  const center = size / 2;
  const strokeWidth = 14;

  const rings: RingData[] = [
    {
      name: 'Calories',
      current: calories.current,
      target: calories.target,
      unit: 'kcal',
      color: '#0D9488', // Calming Teal
      trackColor: 'rgba(13, 148, 136, 0.15)',
      radius: center - strokeWidth - 2,
      strokeWidth,
    },
    {
      name: 'Protein',
      current: protein.current,
      target: protein.target,
      unit: 'g',
      color: '#0284C7', // Ocean Blue
      trackColor: 'rgba(2, 132, 199, 0.15)',
      radius: center - strokeWidth * 2 - 6,
      strokeWidth,
    },
    {
      name: 'Carbs',
      current: carbs.current,
      target: carbs.target,
      unit: 'g',
      color: '#F59E0B', // Warm Amber
      trackColor: 'rgba(245, 158, 11, 0.15)',
      radius: center - strokeWidth * 3 - 10,
      strokeWidth,
    },
    {
      name: 'Fat',
      current: fat.current,
      target: fat.target,
      unit: 'g',
      color: '#EC4899', // Rose Coral
      trackColor: 'rgba(236, 72, 153, 0.15)',
      radius: center - strokeWidth * 4 - 14,
      strokeWidth,
    },
  ];

  const calRemaining = Math.max(0, calories.target - calories.current);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg] transform">
        <defs>
          <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="carbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>

        {rings.map((ring, idx) => {
          const circumference = 2 * Math.PI * ring.radius;
          const ratio = Math.min(1.2, Math.max(0, ring.current / ring.target));
          const strokeDashoffset = circumference - ratio * circumference;

          return (
            <g key={ring.name}>
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={ring.trackColor}
                strokeWidth={ring.strokeWidth}
              />
              {/* Active Progress */}
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={
                  idx === 0
                    ? 'url(#calGradient)'
                    : idx === 1
                    ? 'url(#proteinGradient)'
                    : idx === 2
                    ? 'url(#carbGradient)'
                    : 'url(#fatGradient)'
                }
                strokeWidth={ring.strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </g>
          );
        })}
      </svg>

      {/* Center Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
          {calRemaining > 0 ? calRemaining.toLocaleString() : 0}
        </span>
        <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
          {calRemaining > 0 ? 'kcal left' : 'Goal met'}
        </span>
        <span className="text-[10px] text-teal-700/80 font-semibold mt-0.5 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
          {calories.current} of {calories.target}
        </span>
      </div>
    </div>
  );
};
