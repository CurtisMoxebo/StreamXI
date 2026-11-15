import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-surface-750/70 bg-surface-900/80 py-5">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>{t('copyright')}</p>
      </div>
    </footer>
  );
};
