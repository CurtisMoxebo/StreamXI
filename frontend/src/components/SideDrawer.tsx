import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-surface-850 border-r border-surface-750 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Side menu"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-surface-750/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden p-0.5 bg-gradient-to-tr from-brand-600 to-brand-400">
              <img
                src="/streamxi-logo.jpg"
                alt="StreamXI"
                className="w-full h-full object-cover rounded-[6px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
              />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-wide">
              Stream<span className="text-brand-400">XI</span>
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Menu Drawer"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-750 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation (The 2 options: Football & Live TV) */}
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('menuTitle')}
            </div>
            <nav className="mt-2 space-y-2">
              
              {/* Option 1: Football (Active) */}
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gradient-to-r from-brand-500/15 to-transparent text-brand-400 border border-brand-500/30 font-semibold text-sm group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <span>{t('navFootball')}</span>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
              </Link>

              {/* Option 2: Live TV (Inactive / Coming Soon) */}
              <div
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-surface-800 font-medium text-sm transition-all group cursor-not-allowed"
                title={t('badgeSoon')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-750 text-slate-400 group-hover:text-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeWidth="2" />
                      <polyline points="17 2 12 7 7 2" strokeWidth="2" />
                    </svg>
                  </div>
                  <span>{t('navLiveTv')}</span>
                </div>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-surface-750 text-slate-400 border border-surface-700">
                  {t('badgeSoon')}
                </span>
              </div>

            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
