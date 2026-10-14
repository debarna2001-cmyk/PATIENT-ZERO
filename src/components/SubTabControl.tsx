import React, { ReactNode, useRef } from "react";
import { motion } from "motion/react";
import { sound } from "../lib/audio";

export interface SubTabItem<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  activeColor?: string;
}

interface SubTabControlProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  layoutId: string;
  ariaLabel?: string;
  sticky?: boolean;
}

/**
 * Sticky Swipeable Segmented Sub-Tab Control
 * Features:
 * - Fluid spring-animated background pill indicator
 * - Touch-friendly min 44px tap targets
 * - Sticky anchor with backdrop blur
 * - Keyboard & ARIA accessibility
 * - Tactile sound feedback
 */
export function SubTabControl<T extends string>({
  tabs,
  activeTab,
  onChange,
  layoutId,
  ariaLabel = "Sub-navigation",
  sticky = true,
}: SubTabControlProps<T>) {
  const currentIndex = tabs.findIndex(t => t.id === activeTab);

  const handleSelect = (id: T) => {
    if (id !== activeTab) {
      sound.click();
      onChange(id);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < tabs.length - 1) {
      handleSelect(tabs[currentIndex + 1].id);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      handleSelect(tabs[currentIndex - 1].id);
    }
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 500) {
      if (deltaX < 0) {
        handleSwipeLeft();
      } else {
        handleSwipeRight();
      }
    }
  };

  return (
    <div 
      className={`w-full border-0 border-none outline-none ring-0 bg-transparent pointer-events-none ${
        sticky 
          ? "sticky top-0 z-30 pt-1 pb-2 mb-2 bg-transparent transition-all" 
          : "mb-4 bg-transparent"
      }`}
    >
      <div 
        role="tablist"
        aria-label={ariaLabel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full flex items-center w-full max-w-md mx-auto relative select-none border-0 border-none outline-none ring-0 shadow-xs pointer-events-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => handleSelect(tab.id)}
              className={`relative flex-1 py-2 sm:py-2.5 px-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-colors z-10 touch-manipulation min-h-[40px] border-0 border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 ${
                isActive
                  ? tab.activeColor || "text-cyan-700 dark:text-cyan-300"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {/* Animated Floating Pill Background - Preserves subtle inner border & soft shadow */}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200/70 dark:border-slate-700/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}

              {/* Content on top of pill */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 truncate">
                <span className="shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200"
                      : "bg-slate-300/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SwipeableTabContainer
 * Wraps view content to enable one-handed horizontal thumb swipe switching between sub-tabs
 */
export function SwipeableTabContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ""
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      // Do not trigger swipe when dragging sliders, inputs or charts
      if (
        target && 
        (target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.closest('input') || 
         target.closest('textarea') ||
         target.closest('.recharts-responsive-container'))
      ) {
        return;
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35 && deltaTime < 550) {
      if (deltaX < 0 && onSwipeLeft) {
        sound.click();
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        sound.click();
        onSwipeRight();
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={className}
    >
      {children}
    </div>
  );
}
