import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Match } from '../types/index.js';

interface MatchHeaderProps {
  match: Match;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  const { t } = useTranslation();

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  const homeRedCards = match.redCards.filter((r) => r.teamId === match.homeTeam.id);
  const awayRedCards = match.redCards.filter((r) => r.teamId === match.awayTeam.id);

  return (
    <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
      {/* Top Breadcrumb & Competition Info */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t('backToMatches')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface-750 text-slate-300 font-semibold border border-surface-700">
            {match.competition.logo} {match.competition.name}
          </span>
        </div>
      </div>

      {/* Main Scoreboard Banner */}
      <div className="grid grid-cols-12 items-center gap-4 py-2">
        
        {/* Home Team */}
        <div className="col-span-5 flex flex-col sm:flex-row items-center sm:justify-end gap-3 text-center sm:text-right">
          <div>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <h2 className="font-display font-bold text-base sm:text-2xl text-white">
                {match.homeTeam.name}
              </h2>
              {homeRedCards.map((rc) => (
                <span key={rc.id} className="red-card-badge" title={`Red card: ${rc.playerName} ${rc.minute}'`} />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{match.homeTeam.country}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-md flex-shrink-0">
            {match.homeTeam.logo || '⚽'}
          </div>
        </div>

        {/* Center Score & Match Status */}
        <div className="col-span-2 text-center space-y-1">
          {isLive && (
            <>
              <div className="font-mono font-black text-2xl sm:text-4xl text-brand-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.5)]">
                {match.score?.home ?? 0} : {match.score?.away ?? 0}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/20 text-accent-red border border-accent-red/30 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-ping" />
                {match.liveMinute}'
              </div>
            </>
          )}

          {isFinished && (
            <>
              <div className="font-mono font-black text-2xl sm:text-4xl text-slate-100">
                {match.score?.home ?? 0} : {match.score?.away ?? 0}
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t('statusFinished')}
              </span>
            </>
          )}

          {isUpcoming && (
            <>
              <div className="font-mono font-bold text-xl sm:text-2xl text-slate-500">
                VS
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {new Date(match.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} CET
              </span>
            </>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-5 flex flex-col-reverse sm:flex-row items-center sm:justify-start gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-md flex-shrink-0">
            {match.awayTeam.logo || '⚽'}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display font-bold text-base sm:text-2xl text-white">
                {match.awayTeam.name}
              </h2>
              {awayRedCards.map((rc) => (
                <span key={rc.id} className="red-card-badge" title={`Red card: ${rc.playerName} ${rc.minute}'`} />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{match.awayTeam.country}</p>
          </div>
        </div>

      </div>

      {/* Goal Scorers list for Live or Past matches */}
      {match.scorers && match.scorers.length > 0 && (
        <div className="pt-3 border-t border-surface-750/70 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-300">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <span>⚽ Scorers:</span>
          </span>
          {match.scorers.map((scorer) => (
            <span key={scorer.id} className="font-medium text-slate-200">
              {scorer.playerName} {scorer.minute}'
              {scorer.isOwnGoal && ' (OG)'}
              {scorer.isPenalty && ' (P)'}
            </span>
          ))}
        </div>
      )}

      {/* Venue */}
      {match.venue && (
        <div className="text-center text-[11px] text-slate-400">
          🏟️ {match.venue}
        </div>
      )}
    </div>
  );
};
