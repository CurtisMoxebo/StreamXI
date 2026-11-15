import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { MatchStatsResponse, UpcomingMatchStats, InGameMatchStats } from '../../types/index.js';

interface StatsTabProps {
  matchId: string;
}

export const StatsTab: React.FC<StatsTabProps> = ({ matchId }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<MatchStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getMatchStats(matchId)
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading match statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        Statistics not available for this match.
      </div>
    );
  }

  // Helper for Comparison Bar
  const renderComparisonBar = (label: string, homeVal: number, awayVal: number, unit = '') => {
    const total = homeVal + awayVal || 1;
    const homePercent = Math.round((homeVal / total) * 100);

    return (
      <div className="space-y-1.5 py-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-brand-400 font-mono text-sm">{homeVal}{unit}</span>
          <span className="text-slate-300 font-medium">{label}</span>
          <span className="text-accent-cyan font-mono text-sm">{awayVal}{unit}</span>
        </div>
        <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden flex">
          <div style={{ width: `${homePercent}%` }} className="h-full bg-brand-500 rounded-l-full transition-all duration-500" />
          <div style={{ width: `${100 - homePercent}%` }} className="h-full bg-accent-cyan rounded-r-full transition-all duration-500" />
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER CASE 1: UPCOMING GAME (Recent 5 games form & Form Stats)
  // -------------------------------------------------------------
  if (stats.type === 'upcoming') {
    const { home, away } = stats as UpcomingMatchStats;

    return (
      <div className="space-y-6" data-testid="stats-upcoming">
        {/* Recent 5 games W/D/L Form badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Home Form */}
          <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-700 pb-2">
              <span className="text-sm font-bold text-white">{home.teamName}</span>
              <div className="flex items-center gap-1.5">
                {home.form.map((res, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-md text-[11px] font-extrabold flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-brand-500 text-slate-950'
                        : res === 'D'
                        ? 'bg-slate-600 text-white'
                        : 'bg-accent-red text-white'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                {t('last5Games')}
              </span>
              {home.past5Games.map((game, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-850">
                  <span className="text-slate-300">vs {game.opponent}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200">{game.score}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        game.result === 'W'
                          ? 'bg-brand-500/20 text-brand-400'
                          : game.result === 'D'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-red-500/20 text-accent-red'
                      }`}
                    >
                      {game.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Away Form */}
          <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-700 pb-2">
              <span className="text-sm font-bold text-white">{away.teamName}</span>
              <div className="flex items-center gap-1.5">
                {away.form.map((res, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-md text-[11px] font-extrabold flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-brand-500 text-slate-950'
                        : res === 'D'
                        ? 'bg-slate-600 text-white'
                        : 'bg-accent-red text-white'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                {t('last5Games')}
              </span>
              {away.past5Games.map((game, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-850">
                  <span className="text-slate-300">vs {game.opponent}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200">{game.score}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        game.result === 'W'
                          ? 'bg-brand-500/20 text-brand-400'
                          : game.result === 'D'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-red-500/20 text-accent-red'
                      }`}
                    >
                      {game.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 5-Game Form Statistics Comparison Bars */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Last 5 Matches Performance Metrics
          </h4>

          {renderComparisonBar(t('goalsScored'), home.goalsScored, away.goalsScored)}
          {renderComparisonBar(t('goalsConceded'), home.goalsConceded, away.goalsConceded)}
          {renderComparisonBar(t('expectedGoals'), home.expectedGoals, away.expectedGoals)}
          {renderComparisonBar(t('possession'), home.possession, away.possession, '%')}
          {renderComparisonBar(t('bigChances'), home.bigChancesCreated, away.bigChancesCreated)}
          {renderComparisonBar(t('cleanSheets'), home.cleanSheets, away.cleanSheets)}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER CASE 2: LIVE OR FINISHED MATCH (In-Game Metrics)
  // -------------------------------------------------------------
  const liveStats = stats as InGameMatchStats;

  return (
    <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-5 space-y-4" data-testid="stats-live">
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
        In-Match Detailed Statistics
      </h4>

      {renderComparisonBar(t('possession'), liveStats.possession.home, liveStats.possession.away, '%')}
      {renderComparisonBar(t('bigChances'), liveStats.bigChances.home, liveStats.bigChances.away)}
      {renderComparisonBar(t('shotsTotal'), liveStats.totalShots.home, liveStats.totalShots.away)}
      {renderComparisonBar(t('shotsOnTarget'), liveStats.shotsOnTarget.home, liveStats.shotsOnTarget.away)}
      {renderComparisonBar(t('goalkeeperSaves'), liveStats.goalkeeperSaves.home, liveStats.goalkeeperSaves.away)}
      {renderComparisonBar(t('cornerKicks'), liveStats.cornerKicks.home, liveStats.cornerKicks.away)}
      {renderComparisonBar(t('fouls'), liveStats.fouls.home, liveStats.fouls.away)}
      {renderComparisonBar(t('passes'), liveStats.passes.home, liveStats.passes.away)}
      {renderComparisonBar(t('tackles'), liveStats.tackles.home, liveStats.tackles.away)}
      {renderComparisonBar(t('yellowCards'), liveStats.yellowCards.home, liveStats.yellowCards.away)}
      {renderComparisonBar(t('redCards'), liveStats.redCards.home, liveStats.redCards.away)}
    </div>
  );
};
