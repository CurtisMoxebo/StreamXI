import React from 'react';
import { useTranslation } from 'react-i18next';

interface TopCompetitionsSidebarProps {
  onSelectCompetition?: (leagueName: string) => void;
  selectedCompetition?: string;
}

const TOP_COMPETITIONS = [
  { name: 'UEFA Champions League', keyword: 'Champions League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', liveCount: '2 Live' },
  { name: 'UEFA Nations League', keyword: 'Nations League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png', liveCount: '8 Live' },
  { name: 'Premier League', keyword: 'Premier League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', matchCount: '3' },
  { name: 'La Liga EA Sports', keyword: 'La Liga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png', matchCount: '2' },
  { name: 'Serie A', keyword: 'Serie A', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png', matchCount: '1' },
  { name: 'Bundesliga', keyword: 'Bundesliga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png', matchCount: '1' },
  { name: 'Ligue 1 McDonald\'s', keyword: 'Ligue 1', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png', matchCount: '1' },
];

export const TopCompetitionsSidebar: React.FC<TopCompetitionsSidebarProps> = ({
  onSelectCompetition,
  selectedCompetition,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="bg-surface-850/85 rounded-2xl border border-surface-750/70 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('topLeagues')}
            </span>
            <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
              Active
            </span>
          </div>

          <ul className="space-y-1 text-xs text-slate-300">
            {TOP_COMPETITIONS.map((comp) => {
              const isActive = selectedCompetition === comp.keyword;
              return (
                <li
                  key={comp.keyword}
                  onClick={() => onSelectCompetition?.(comp.keyword)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                    isActive ? 'bg-surface-800 border border-brand-500/40 text-brand-400' : 'hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                    <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {comp.name}
                    </span>
                  </div>
                  {comp.liveCount ? (
                    <span className="text-[10px] font-bold text-brand-400 bg-brand-500/15 px-1.5 py-0.5 rounded">
                      {comp.liveCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-surface-800 px-1.5 py-0.5 rounded">
                      {comp.matchCount}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
};
