import React from 'react';
import { useTranslation } from 'react-i18next';

export type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

interface DateNavigatorProps {
  currentDateOffset: number;
  onPrevDate: () => void;
  onNextDate: () => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  matchCounts: {
    all: number;
    live: number;
    upcoming: number;
    finished: number;
  };
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDateOffset,
  onPrevDate,
  onNextDate,
  statusFilter,
  onStatusFilterChange,
  matchCounts,
}) => {
  const { t, i18n } = useTranslation();

  // Calculate formatted date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + currentDateOffset);

  const locales: Record<string, string> = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
  const currentLocale = locales[i18n.language?.substring(0, 2)] || 'en-US';
  const formattedDate = targetDate.toLocaleDateString(currentLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getDayBadge = () => {
    if (currentDateOffset === 0) return t('badgeToday');
    if (currentDateOffset === -1) {
      return i18n.language === 'fr' ? 'Hier' : i18n.language === 'es' ? 'Ayer' : 'Yesterday';
    }
    if (currentDateOffset === 1) {
      return i18n.language === 'fr' ? 'Demain' : i18n.language === 'es' ? 'Mañana' : 'Tomorrow';
    }
    return null;
  };

  const dayBadge = getDayBadge();

  return (
    <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 p-4 sm:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Date Prev / Current / Next Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={onPrevDate}
            aria-label="Previous Day"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden md:inline">{t('prevDay')}</span>
          </button>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface-900/90 border border-surface-700/90 shadow-inner">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
            </svg>
            <span className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
              {formattedDate}
            </span>
            {dayBadge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30">
                {dayBadge}
              </span>
            )}
          </div>

          <button
            onClick={onNextDate}
            aria-label="Next Day"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <span className="hidden md:inline">{t('nextDay')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Quick Status Filter Tabs */}
        <div className="flex items-center p-1 bg-surface-800/80 rounded-xl border border-surface-700 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('filterAll')} ({matchCounts.all})
          </button>
          
          <button
            onClick={() => onStatusFilterChange('live')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === 'live'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            <span>{t('filterLive')}</span> ({matchCounts.live})
          </button>

          <button
            onClick={() => onStatusFilterChange('upcoming')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              statusFilter === 'upcoming'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('filterUpcoming')} ({matchCounts.upcoming})
          </button>

          <button
            onClick={() => onStatusFilterChange('finished')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              statusFilter === 'finished'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('filterFinished')} ({matchCounts.finished})
          </button>
        </div>

      </div>
    </div>
  );
};
