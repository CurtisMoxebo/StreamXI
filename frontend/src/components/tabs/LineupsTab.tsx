import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { MatchLineups, PitchPlayer } from '../../types/index.js';

interface LineupsTabProps {
  matchId: string;
}

export const DEFAULT_PERSON_IMAGE = '/default-avatar.svg';

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

/**
 * Ensures player positions are displayed with full standard tactical position codes (e.g. GK, CB, LB, RB, DM, CM, CAM, RW, LW, ST)
 * rather than single-letter codes (G, D, M, F).
 */
export function formatPositionCode(pos?: string, starterIndex?: number, subIndex?: number): string {
  const p = (pos || '').toUpperCase().trim();
  if (['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CF', 'LWB', 'RWB', 'AM', 'RM', 'LM'].includes(p)) {
    return p;
  }
  if (starterIndex !== undefined) {
    const starterRoles = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CAM', 'RW', 'ST', 'LW'];
    return starterRoles[starterIndex] || 'CM';
  }
  if (p === 'G') return 'GK';
  if (p === 'D') return 'CB';
  if (p === 'M') return 'CM';
  if (p === 'F' || p === 'A') return 'ST';
  if (subIndex !== undefined) {
    const benchRoles = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'CAM', 'RW', 'ST'];
    return benchRoles[subIndex % benchRoles.length];
  }
  return p && p !== 'SUB' ? p : 'CM';
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

  // Helper to render a player marker on the pitch (handles horizontal and vertical mapping)
  const renderPlayerNode = (
    player: PitchPlayer,
    index: number,
    isHome: boolean,
    isVertical: boolean = false
  ) => {
    const displayName = formatPlayerDisplayName(player.name, player.number);
    const faceUrl = getPlayerFaceUrl(player) || DEFAULT_PERSON_IMAGE;
    const posCode = formatPositionCode(player.position, index);

    // On vertical pitch: vertical coordinate Y = (100 - gridX)%, horizontal lateral coordinate X = gridY%
    const left = isVertical ? `${player.gridY}%` : `${player.gridX}%`;
    const top = isVertical ? `${100 - player.gridX}%` : `${player.gridY}%`;

    return (
      <div
        key={`${player.id}-${isVertical ? 'v' : 'h'}`}
        style={{ left, top }}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
        title={`${player.name} (#${player.number}) - ${posCode}`}
      >
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-surface-900 border-2 ${
            isHome ? 'border-brand-400' : 'border-blue-400'
          } overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-white transition-all flex items-center justify-center`}
        >
          <img
            src={faceUrl}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes(DEFAULT_PERSON_IMAGE)) {
                target.src = DEFAULT_PERSON_IMAGE;
              }
            }}
          />
        </div>
        <div className="flex flex-col items-center mt-0.5 sm:mt-1">
          <span className="text-[7px] sm:text-[9px] md:text-[10px] font-bold text-white bg-surface-900/95 px-1 sm:px-1.5 py-0.5 rounded shadow-md whitespace-nowrap border border-white/10 max-w-[75px] sm:max-w-[95px] md:max-w-[110px] truncate text-center leading-tight">
            {displayName}
          </span>
          <span
            className={`text-[6px] sm:text-[7px] md:text-[8px] font-extrabold ${
              isHome ? 'text-brand-300' : 'text-blue-400'
            } bg-surface-950/80 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider`}
          >
            {posCode}
          </span>
        </div>
      </div>
    );
  };

  // Helper for substitute item
  const renderSubstituteItem = (sub: PitchPlayer, index: number, isHome: boolean) => {
    const subDisplayName = formatPlayerDisplayName(sub.name, sub.number);
    const faceUrl = getPlayerFaceUrl(sub) || DEFAULT_PERSON_IMAGE;
    const posCode = formatPositionCode(sub.position, undefined, index);

    return (
      <div key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-850 border border-surface-750">
        <div
          className={`w-7 h-7 rounded-full overflow-hidden border ${
            isHome ? 'border-brand-400/50' : 'border-blue-400/50'
          } bg-surface-800 flex-shrink-0 flex items-center justify-center`}
        >
          <img
            src={faceUrl}
            alt={sub.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes(DEFAULT_PERSON_IMAGE)) {
                target.src = DEFAULT_PERSON_IMAGE;
              }
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-slate-200 truncate leading-tight text-xs">{subDisplayName}</span>
          <span
            className={`text-[9px] font-bold ${
              isHome ? 'text-brand-400/80' : 'text-blue-400/90'
            } uppercase tracking-wide`}
          >
            {posCode}
          </span>
        </div>
      </div>
    );
  };

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
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {away.confirmed ? t('confirmedLineup') : t('projectedLineup')}
          </span>
        </div>
      </div>

      {/* MOBILE VERTICAL PITCH VISUALIZATION (Visible on screens < md) */}
      <div className="block md:hidden">
        <div className="relative aspect-[9/13] w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-900 select-none">
          {/* Vertical Pitch Markings SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Boundary */}
            <rect x="4%" y="4%" width="92%" height="92%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            
            {/* Halfway Line (Horizontal on vertical field) */}
            <line x1="4%" y1="50%" x2="96%" y2="50%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            
            {/* Center Circle */}
            <circle cx="50%" cy="50%" r="13%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <circle cx="50%" cy="50%" r="3.5" fill="rgba(255,255,255,0.5)" />

            {/* Top Penalty Area (Away Team) */}
            <rect x="20%" y="4%" width="60%" height="16%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <rect x="32%" y="4%" width="36%" height="6%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="50%" cy="14%" r="3" fill="rgba(255,255,255,0.5)" />

            {/* Bottom Penalty Area (Home Team) */}
            <rect x="20%" y="80%" width="60%" height="16%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <rect x="32%" y="90%" width="36%" height="6%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="50%" cy="86%" r="3" fill="rgba(255,255,255,0.5)" />
          </svg>

          {/* Away Team Players on Mobile (Top Half) */}
          {away.startingXI.map((player: PitchPlayer, i: number) => renderPlayerNode(player, i, false, true))}

          {/* Home Team Players on Mobile (Bottom Half) */}
          {home.startingXI.map((player: PitchPlayer, i: number) => renderPlayerNode(player, i, true, true))}
        </div>
      </div>

      {/* DESKTOP HORIZONTAL PITCH VISUALIZATION (Visible on screens >= md) */}
      <div className="hidden md:block">
        <div className="relative aspect-[16/10] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-900 select-none">
          {/* Horizontal Pitch Markings SVG */}
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
          {home.startingXI.map((player: PitchPlayer, i: number) => renderPlayerNode(player, i, true, false))}

          {/* Starting XI Players - Away Team (Right Half) */}
          {away.startingXI.map((player: PitchPlayer, i: number) => renderPlayerNode(player, i, false, false))}
        </div>
      </div>

      {/* COACHES & SUBSTITUTES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Home Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-brand-400 bg-surface-900 flex-shrink-0 flex items-center justify-center shadow-md">
                <img
                  src={home.coachImage || DEFAULT_PERSON_IMAGE}
                  alt={home.coach}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes(DEFAULT_PERSON_IMAGE)) {
                      target.src = DEFAULT_PERSON_IMAGE;
                    }
                  }}
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
                <p className="text-sm font-bold text-white">{home.coach || 'Head Coach'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/20">
              Home
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              {t('substitutes')} ({home.substitutes.length})
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {home.substitutes.map((sub: PitchPlayer, i: number) => renderSubstituteItem(sub, i, true))}
            </div>
          </div>
        </div>

        {/* Away Team Coach & Subs */}
        <div className="bg-surface-800/80 rounded-xl border border-surface-700/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-400 bg-surface-900 flex-shrink-0 flex items-center justify-center shadow-md">
                <img
                  src={away.coachImage || DEFAULT_PERSON_IMAGE}
                  alt={away.coach}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes(DEFAULT_PERSON_IMAGE)) {
                      target.src = DEFAULT_PERSON_IMAGE;
                    }
                  }}
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">{t('headCoach')}</span>
                <p className="text-sm font-bold text-white">{away.coach || 'Head Coach'}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              Away
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              {t('substitutes')} ({away.substitutes.length})
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {away.substitutes.map((sub: PitchPlayer, i: number) => renderSubstituteItem(sub, i, false))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
