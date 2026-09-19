import React from 'react';
import { Home, Plus, TrendingUp, Sparkles, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavBarProps {
  currentTab?: TabType;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
  onTabChange?: (tab: TabType) => void;
  onQuickLogClick?: () => void;
  onOpenLogger?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  activeTab,
  onChangeTab,
  onTabChange,
  onQuickLogClick,
  onOpenLogger,
}) => {
  const active = activeTab || currentTab || 'home';
  const handleSelectTab = (t: TabType) => {
    if (onTabChange) onTabChange(t);
    if (onChangeTab) onChangeTab(t);
  };
  const handleOpenAction = () => {
    if (onOpenLogger) onOpenLogger();
    if (onQuickLogClick) onQuickLogClick();
  };
  const tabs = [
    { id: 'home' as TabType, label: 'Today', icon: Home },
    { id: 'insights' as TabType, label: 'Trends', icon: TrendingUp },
    { id: 'log' as TabType, label: 'Log', isAction: true },
    { id: 'recommendations' as TabType, label: 'For You', icon: Sparkles },
    { id: 'settings' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      <div className="mx-4 mb-3 pointer-events-auto">
        <nav
          id="bottom-nav-bar"
          aria-label="Main Navigation"
          className="flex items-center justify-around px-2 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
        >
          {tabs.map((tab) => {
            if (tab.isAction) {
              return (
                <button
                  key="quick-log-action"
                  id="nav-quick-log-btn"
                  onClick={handleOpenAction}
                  aria-label="Log Food or Meal"
                  className="relative -top-4 flex flex-col items-center justify-center group focus:outline-none"
                >
                  <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-700/30 border-2 border-white transform active:scale-95 transition-transform duration-150">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-semibold text-teal-800 mt-1">Log Meal</span>
                </button>
              );
            }

            const Icon = tab.icon!;
            const isActive = active === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                  isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-colors ${isActive ? 'bg-teal-50' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[11px] font-medium tracking-tight mt-0.5 ${isActive ? 'font-bold text-teal-900' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
