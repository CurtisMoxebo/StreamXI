import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { MatchLineups, PitchPlayer } from '../../types/index.js';

interface LineupsTabProps {
  matchId: string;
}

export const DEFAULT_PLAYER_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="%2394a3b8"><circle cx="32" cy="24" r="14"/><path d="M14 54c0-9.94 8.06-18 18-18s18 8.06 18 18v2H14v-2z"/></svg>';

export function getPlayerFaceUrl(player: PitchPlayer): string {
  if (player.image && player.image.startsWith('http')) {
    return player.image;
  }
  if (player.id && /^\d+$/.test(player.id)) {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${player.id}.png&w=96&h=96&scale=crop`;
  }
  return DEFAULT_PLAYER_AVATAR;
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
        
        {/* Pitch Turf Pattern Lines */}
        <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,#ffffff_60px,#ffffff_61px)]" />

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
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-900 border-2 border-brand-400 overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-white transition-all flex items-center justify-center">
                  <img
                    src={faceUrl}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PLAYER_AVATAR;
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 min-w-[15px] h-3.5 sm:min-w-[18px] sm:h-4 px-1 rounded-full bg-brand-500 border border-white text-slate-950 font-black text-[8px] sm:text-[9px] leading-tight flex items-center justify-center shadow">
                  {player.number}
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-white bg-surface-900/95 px-1.5 py-0.5 rounded-md mt-1 shadow-md whitespace-nowrap border border-white/10 max-w-[85px] sm:max-w-[110px] truncate text-center">
                {displayName}
              </span>
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
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-900 border-2 border-accent-cyan overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-white transition-all flex items-center justify-center">
                  <img
                    src={faceUrl}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PLAYER_AVATAR;
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 min-w-[15px] h-3.5 sm:min-w-[18px] sm:h-4 px-1 rounded-full bg-accent-cyan border border-white text-slate-950 font-black text-[8px] sm:text-[9px] leading-tight flex items-center justify-center shadow">
                  {player.number}
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-white bg-surface-900/95 px-1.5 py-0.5 rounded-md mt-1 shadow-md whitespace-nowrap border border-white/10 max-w-[85px] sm:max-w-[110px] truncate text-center">
                {displayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* COACHES & SUBSTITUTES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Home Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-2">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
              <p className="text-sm font-bold text-white">{home.coach}</p>
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
                      <img
                        src={faceUrl}
                        alt={sub.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PLAYER_AVATAR;
                        }}
                      />
                    </div>
                    <span className="text-slate-200 truncate">{subDisplayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Away Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-2">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
              <p className="text-sm font-bold text-white">{away.coach}</p>
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
                      <img
                        src={faceUrl}
                        alt={sub.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PLAYER_AVATAR;
                        }}
                      />
                    </div>
                    <span className="text-slate-200 truncate">{subDisplayName}</span>
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
