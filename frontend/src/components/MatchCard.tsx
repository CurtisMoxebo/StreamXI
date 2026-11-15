import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Match } from '../types/index.js';
import { TeamBadge, getTeamFlag } from '../utils/flags.js';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  const homeRedCards = match.redCards.filter((r) => r.teamId === match.homeTeam.id);
  const awayRedCards = match.redCards.filter((r) => r.teamId === match.awayTeam.id);

  // Format kickoff time e.g. "20:00"
  const kickoffDate = new Date(match.kickoffTime);
  const kickoffHours = String(kickoffDate.getHours()).padStart(2, '0');
  const kickoffMinutes = String(kickoffDate.getMinutes()).padStart(2, '0');
  const formattedKickoff = `${kickoffHours}:${kickoffMinutes} CET`;

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="match-card bg-surface-800/90 rounded-xl border border-surface-700/80 p-4 relative overflow-hidden cursor-pointer hover:border-brand-500/50 transition-all duration-300"
      data-testid={`match-card-${match.id}`}
    >
      {/* Live highlight bar on left */}
      {isLive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400" />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1">
        
        {/* Status & Kickoff Time Column */}
        <div className="flex items-center sm:w-44 flex-shrink-0 gap-3 border-b sm:border-b-0 sm:border-r border-surface-700/60 pb-2 sm:pb-0 sm:pr-4">
          <div>
            {isLive && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-red" />
                </span>
                <span className="font-mono font-bold text-accent-red text-xs uppercase tracking-wider">
                  LIVE {match.liveMinute}'
                </span>
              </div>
            )}

            {isFinished && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-mono font-bold text-slate-300 text-xs uppercase tracking-wider">
                  {t('statusFinished')}
                </span>
              </div>
            )}

            {isUpcoming && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="font-mono font-bold text-slate-300 text-xs uppercase tracking-wider">
                  {t('statusUpcoming')}
                </span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 mt-0.5">{formattedKickoff}</div>
          </div>
        </div>

        {/* Teams & Scores Column */}
        <div className="flex-1 space-y-2.5">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TeamBadge team={match.homeTeam} size="md" />
              <div className="flex items-center gap-2">
                <span className="text-sm select-none mr-0.5" title={match.homeTeam.country}>
                  {getTeamFlag(match.homeTeam)}
                </span>
                <span className="font-semibold text-sm sm:text-base text-slate-100">
                  {match.homeTeam.name}
                </span>
                {homeRedCards.map((rc) => (
                  <span
                    key={rc.id}
                    className="red-card-badge"
                    title={`Red Card: ${rc.playerName} ${rc.minute}'`}
                    aria-label="Red card"
                  />
                ))}
              </div>
            </div>

            {/* Score */}
            {isLive && (
              <span className="font-mono font-extrabold text-xl sm:text-2xl text-brand-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                {match.score?.home ?? 0}
              </span>
            )}
            {isFinished && (
              <span className="font-mono font-bold text-xl sm:text-2xl text-slate-100">
                {match.score?.home ?? 0}
              </span>
            )}
            {isUpcoming && (
              <span className="font-mono text-sm text-slate-500 font-medium">-</span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TeamBadge team={match.awayTeam} size="md" />
              <div className="flex items-center gap-2">
                <span className="text-sm select-none mr-0.5" title={match.awayTeam.country}>
                  {getTeamFlag(match.awayTeam)}
                </span>
                <span className="font-semibold text-sm sm:text-base text-slate-100">
                  {match.awayTeam.name}
                </span>
                {awayRedCards.map((rc) => (
                  <span
                    key={rc.id}
                    className="red-card-badge"
                    title={`Red Card: ${rc.playerName} ${rc.minute}'`}
                    aria-label="Red card"
                  />
                ))}
              </div>
            </div>

            {/* Score */}
            {isLive && (
              <span className="font-mono font-extrabold text-xl sm:text-2xl text-brand-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                {match.score?.away ?? 0}
              </span>
            )}
            {isFinished && (
              <span className="font-mono font-bold text-xl sm:text-2xl text-slate-100">
                {match.score?.away ?? 0}
              </span>
            )}
            {isUpcoming && (
              <span className="font-mono text-sm text-slate-500 font-medium">-</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
