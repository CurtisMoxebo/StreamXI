import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { MatchLineups, PitchPlayer } from '../../types/index.js';

interface LineupsTabProps {
  matchId: string;
}

export function getPlayerFaceUrl(player: PitchPlayer): string | undefined {
  if (player.image && player.image.startsWith('http')) {
    return player.image;
  }
  return undefined;
}

/**
 * Formats player name as '{player number} {initial of players first name}. {players last name}'
 * E.g. (9, 'Kylian Mbappé') -> '9 K. Mbappé'
 * If single name like 'Pedri' -> '8 Pedri'
 */
export function formatPlayerDisplayName(name: string, number: number): string {
  const cleanName = (name || '').trim();
  if (!cleanName) return `${number}`;

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return `${number} ${parts[0]}`;
  }

  // Already prefixed by initial like "K. Mbappé"
  if (/^[A-Z]\./i.test(parts[0])) {
    return `${number} ${cleanName}`;
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  const firstInitial = firstName.charAt(0).toUpperCase();

  return `${number} ${firstInitial}. ${lastName}`;
}

export const LineupsTab: React.FC<LineupsTabProps> = ({ matchId }) => {
  const { t } = useTranslation();
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getMatchLineups(matchId)
      .then((data) => {
        if (isMounted) {
          setLineups(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load lineups:', err);
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
        <p className="text-xs">Loading team lineups and tactical pitch...</p>
      </div>
    );
  }

  if (!lineups) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        Lineup information not available for this match.
      </div>
    );
  }

  const { home, away } = lineups;

  return (
    <div className="space-y-6" data-testid="lineups-tab">
      {/* Formation & Confirmation Status Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-800/80 p-3.5 rounded-xl border border-surface-700/80">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold">Home ({home.formation}):</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              home.confirmed
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {home.confirmed ? t('confirmedLineup') : t('projectedLineup')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold">Away ({away.formation}):</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              away.confirmed
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {away.confirmed ? t('confirmedLineup') : t('projectedLineup')}
          </span>
        </div>
      </div>

      {/* FOOTBALL PITCH VISUALIZATION */}
      <div className="relative aspect-[16/10] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-900 select-none">
        
        {/* Pitch Markings SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Boundary */}
          <rect x="4%" y="4%" width="92%" height="92%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          
          {/* Halfway Line */}
          <line x1="50%" y1="4%" x2="50%" y2="96%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          
          {/* Center Circle */}
          <circle cx="50%" cy="50%" r="10%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="50%" cy="50%" r="4" fill="rgba(255,255,255,0.5)" />

          {/* Left Penalty Area (Home) */}
          <rect x="4%" y="24%" width="16%" height="52%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <rect x="4%" y="36%" width="6%" height="28%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <circle cx="15%" cy="50%" r="3" fill="rgba(255,255,255,0.5)" />

          {/* Right Penalty Area (Away) */}
          <rect x="80%" y="24%" width="16%" height="52%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <rect x="90%" y="36%" width="6%" height="28%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <circle cx="85%" cy="50%" r="3" fill="rgba(255,255,255,0.5)" />
        </svg>

        {/* Starting XI Players - Home Team (Left Half) */}
        {home.startingXI.map((player: PitchPlayer) => {
          const displayName = formatPlayerDisplayName(player.name, player.number);
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div
              key={player.id}
              style={{ left: `${player.gridX}%`, top: `${player.gridY}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
              title={`${player.name} (#${player.number}) - ${player.position}`}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-surface-900 border-2 border-brand-400 overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-white transition-all flex items-center justify-center">
                {faceUrl ? (
                  <img
                    src={faceUrl}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.player-fallback-badge');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`player-fallback-badge w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 text-white font-extrabold text-xs sm:text-sm items-center justify-center ${
                    faceUrl ? 'hidden' : 'flex'
                  }`}
                >
                  {player.number}
                </div>
              </div>
              <div className="flex flex-col items-center mt-1">
                <span className="text-[8px] sm:text-[10px] font-bold text-white bg-surface-900/95 px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap border border-white/10 max-w-[85px] sm:max-w-[110px] truncate text-center leading-tight">
                  {displayName}
                </span>
                {player.position && (
                  <span className="text-[7px] sm:text-[8px] font-extrabold text-brand-300 bg-surface-950/80 px-1 py-0.2 rounded mt-0.5 uppercase tracking-wider border border-brand-400/20">
                    {player.position}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Starting XI Players - Away Team (Right Half) */}
        {away.startingXI.map((player: PitchPlayer) => {
          const displayName = formatPlayerDisplayName(player.name, player.number);
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div
              key={player.id}
              style={{ left: `${player.gridX}%`, top: `${player.gridY}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
              title={`${player.name} (#${player.number}) - ${player.position}`}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-surface-900 border-2 border-accent-cyan overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-white transition-all flex items-center justify-center">
                {faceUrl ? (
                  <img
                    src={faceUrl}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.player-fallback-badge');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`player-fallback-badge w-full h-full bg-gradient-to-br from-cyan-600 to-cyan-800 text-white font-extrabold text-xs sm:text-sm items-center justify-center ${
                    faceUrl ? 'hidden' : 'flex'
                  }`}
                >
                  {player.number}
                </div>
              </div>
              <div className="flex flex-col items-center mt-1">
                <span className="text-[8px] sm:text-[10px] font-bold text-white bg-surface-900/95 px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap border border-white/10 max-w-[85px] sm:max-w-[110px] truncate text-center leading-tight">
                  {displayName}
                </span>
                {player.position && (
                  <span className="text-[7px] sm:text-[8px] font-extrabold text-accent-cyan bg-surface-950/80 px-1 py-0.2 rounded mt-0.5 uppercase tracking-wider border border-accent-cyan/20">
                    {player.position}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* COACHES & SUBSTITUTES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Home Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-400 bg-surface-900 flex-shrink-0 flex items-center justify-center shadow-md">
                {home.coachImage ? (
                  <img
                    src={home.coachImage}
                    alt={home.coach}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.coach-fallback');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`coach-fallback w-full h-full bg-brand-500/20 text-brand-400 font-bold text-xs items-center justify-center ${home.coachImage ? 'hidden' : 'flex'}`}>
                  {home.coach ? home.coach.charAt(0) : 'C'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
                <p className="text-sm font-bold text-white">{home.coach || 'Head Coach'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              Home
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              {t('substitutes')} ({home.substitutes.length})
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {home.substitutes.map((sub: PitchPlayer) => {
                const subDisplayName = formatPlayerDisplayName(sub.name, sub.number);
                const faceUrl = getPlayerFaceUrl(sub);
                return (
                  <div key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-850 border border-surface-750">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-400/40 bg-surface-800 flex-shrink-0 flex items-center justify-center">
                      {faceUrl ? (
                        <img
                          src={faceUrl}
                          alt={sub.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).parentElement?.querySelector('.sub-fallback-badge');
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`sub-fallback-badge w-full h-full bg-brand-500/20 text-brand-400 font-bold text-[10px] items-center justify-center ${faceUrl ? 'hidden' : 'flex'}`}>
                        {sub.number}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-200 truncate leading-tight">{subDisplayName}</span>
                      {sub.position && (
                        <span className="text-[9px] font-bold text-brand-400/80 uppercase tracking-wide">{sub.position}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Away Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-cyan bg-surface-900 flex-shrink-0 flex items-center justify-center shadow-md">
                {away.coachImage ? (
                  <img
                    src={away.coachImage}
                    alt={away.coach}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.coach-fallback');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`coach-fallback w-full h-full bg-cyan-500/20 text-accent-cyan font-bold text-xs items-center justify-center ${away.coachImage ? 'hidden' : 'flex'}`}>
                  {away.coach ? away.coach.charAt(0) : 'C'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
                <p className="text-sm font-bold text-white">{away.coach || 'Head Coach'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20">
              Away
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              {t('substitutes')} ({away.substitutes.length})
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {away.substitutes.map((sub: PitchPlayer) => {
                const subDisplayName = formatPlayerDisplayName(sub.name, sub.number);
                const faceUrl = getPlayerFaceUrl(sub);
                return (
                  <div key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-850 border border-surface-750">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-cyan/40 bg-surface-800 flex-shrink-0 flex items-center justify-center">
                      {faceUrl ? (
                        <img
                          src={faceUrl}
                          alt={sub.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).parentElement?.querySelector('.sub-fallback-badge');
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`sub-fallback-badge w-full h-full bg-cyan-500/20 text-accent-cyan font-bold text-[10px] items-center justify-center ${faceUrl ? 'hidden' : 'flex'}`}>
                        {sub.number}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-200 truncate leading-tight">{subDisplayName}</span>
                      {sub.position && (
                        <span className="text-[9px] font-bold text-accent-cyan/80 uppercase tracking-wide">{sub.position}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
