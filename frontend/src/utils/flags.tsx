import React, { useState } from 'react';
import { Team } from '../types/index.js';

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  // Nations
  'spain': '🇪🇸',
  'espana': '🇪🇸',
  'españa': '🇪🇸',
  'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'france': '🇫🇷',
  'germany': '🇩🇪',
  'italy': '🇮🇹',
  'belgium': '🇧🇪',
  'croatia': '🇭🇷',
  'czechia': '🇨🇿',
  'czech republic': '🇨🇿',
  'türkiye': '🇹🇷',
  'turkey': '🇹🇷',
  'finland': '🇫🇮',
  'san marino': '🇸🇲',
  'belarus': '🇧🇾',
  'albania': '🇦🇱',
  'latvia': '🇱🇻',
  'armenia': '🇦🇲',
  'cyprus': '🇨🇾',
  'montenegro': '🇲🇪',
  'suriname': '🇸🇷',
  'eswatini': '🇸🇿',
  'netherlands': '🇳🇱',
  'holland': '🇳🇱',
  'portugal': '🇵🇹',
  'switzerland': '🇨🇭',
  'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'northern ireland': '🇬🇧',
  'ireland': '🇮🇪',
  'austria': '🇦🇹',
  'denmark': '🇩🇰',
  'sweden': '🇸🇪',
  'norway': '🇳🇴',
  'poland': '🇵🇱',
  'ukraine': '🇺🇦',
  'serbia': '🇷🇸',
  'greece': '🇬🇷',
  'slovakia': '🇸🇰',
  'hungary': '🇭🇺',
  'romania': '🇷🇴',
  'bulgaria': '🇧🇬',
  'slovenia': '🇸🇮',
  'kazakhstan': '🇰🇿',
  'georgia': '🇬🇪',
  'iceland': '🇮🇸',
  'bosnia and herzegovina': '🇧🇦',
  'bosnia': '🇧🇦',
  'israel': '🇮🇱',
  'luxembourg': '🇱🇺',
  'faroe islands': '🇫🇴',
  'estonia': '🇪🇪',
  'lithuania': '🇱🇹',
  'moldova': '🇲🇩',
  'gibraltar': '🇬🇮',
  'malta': '🇲🇹',
  'andorra': '🇦🇩',
  'azerbaijan': '🇦🇿',
  'liechtenstein': '🇱🇮',
  'argentina': '🇦🇷',
  'brazil': '🇧🇷',
  'uruguay': '🇺🇾',
  'colombia': '🇨🇴',
  'united states': '🇺🇸',
  'usa': '🇺🇸',
  'mexico': '🇲🇽',
  'canada': '🇨🇦',
  'japan': '🇯🇵',
  'south korea': '🇰🇷',
  'morocco': '🇲🇦',
  'senegal': '🇸🇳',
  'nigeria': '🇳🇬',
  'cameroon': '🇨🇲',
  'ghana': '🇬🇭',
  'egypt': '🇪🇬',
  'algeria': '🇩🇿',
  'ivory coast': '🇨🇮',
  'côte d\'ivoire': '🇨🇮',
  'south africa': '🇿🇦',
  'australia': '🇦🇺',
  'saudi arabia': '🇸🇦',

  // Common Country Codes
  'es': '🇪🇸',
  'esp': '🇪🇸',
  'en': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'eng': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'gb': '🇬🇧',
  'fr': '🇫🇷',
  'fra': '🇫🇷',
  'de': '🇩🇪',
  'ger': '🇩🇪',
  'it': '🇮🇹',
  'ita': '🇮🇹',
  'be': '🇧🇪',
  'bel': '🇧🇪',
  'hr': '🇭🇷',
  'cro': '🇭🇷',
  'cz': '🇨🇿',
  'cze': '🇨🇿',
  'tr': '🇹🇷',
  'tur': '🇹🇷',
  'fi': '🇫🇮',
  'fin': '🇫🇮',
  'sm': '🇸🇲',
  'smar': '🇸🇲',
  'by': '🇧🇾',
  'blr': '🇧🇾',
  'al': '🇦🇱',
  'alb': '🇦🇱',
  'lv': '🇱🇻',
  'lva': '🇱🇻',
  'am': '🇦🇲',
  'arm': '🇦🇲',
  'cy': '🇨🇾',
  'cyp': '🇨🇾',
  'me': '🇲🇪',
  'mne': '🇲🇪',
  'sr': '🇸🇷',
  'sur': '🇸🇷',
  'sz': '🇸🇿',
  'swz': '🇸🇿',
  'nl': '🇳🇱',
  'ned': '🇳🇱',
  'pt': '🇵🇹',
  'por': '🇵🇹',
  'ch': '🇨🇭',
  'sui': '🇨🇭',
  'sco': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

export function getTeamFlag(team?: Partial<Team> | null): string {
  if (!team) return '⚽';
  if (team.flag) return team.flag;

  const teamNameKey = (team.name || '').toLowerCase().trim();
  if (COUNTRY_FLAG_MAP[teamNameKey]) {
    return COUNTRY_FLAG_MAP[teamNameKey];
  }

  const teamCodeKey = (team.code || '').toLowerCase().trim();
  if (COUNTRY_FLAG_MAP[teamCodeKey]) {
    return COUNTRY_FLAG_MAP[teamCodeKey];
  }

  const countryKey = (team.country || '').toLowerCase().trim();
  if (COUNTRY_FLAG_MAP[countryKey]) {
    return COUNTRY_FLAG_MAP[countryKey];
  }

  const countryCodeKey = (team.countryCode || '').toLowerCase().trim();
  if (COUNTRY_FLAG_MAP[countryCodeKey]) {
    return COUNTRY_FLAG_MAP[countryCodeKey];
  }

  // Club to country mappings for major leagues
  if (/madrid|barcelona|atletico|sevilla|valencia|betis|bilbao|sociedad/i.test(teamNameKey)) return '🇪🇸';
  if (/manchester|liverpool|arsenal|chelsea|tottenham|newcastle|aston villa|west ham/i.test(teamNameKey)) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (/milan|juventus|inter|roma|napoli|lazio|atalanta|fiorentina/i.test(teamNameKey)) return '🇮🇹';
  if (/bayern|dortmund|leverkusen|leipzig|frankfurt|stuttgart/i.test(teamNameKey)) return '🇩🇪';
  if (/paris|marseille|lyon|monaco|lille|lens|rennes/i.test(teamNameKey)) return '🇫🇷';
  if (/benfica|porto|sporting/i.test(teamNameKey)) return '🇵🇹';
  if (/ajax|psv|feyenoord/i.test(teamNameKey)) return '🇳🇱';
  if (/celtic|rangers/i.test(teamNameKey)) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';

  return '⚽';
}

interface TeamBadgeProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({ team, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const flag = getTeamFlag(team);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-12 h-12 text-2xl',
  }[size];

  const hasHttpLogo = Boolean(team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')));

  return (
    <div
      className={`rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden flex-shrink-0 ${sizeClasses} ${className}`}
      title={`${team.name} (${flag})`}
      data-testid="team-badge"
    >
      {hasHttpLogo && !imgError ? (
        <img
          src={team.logo}
          alt={team.name}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="leading-none select-none">{flag}</span>
      )}
    </div>
  );
};
