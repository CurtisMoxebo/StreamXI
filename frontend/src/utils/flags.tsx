import React from 'react';
import { Team, Competition } from '../types/index.js';

export const COUNTRY_TO_CODE: Record<string, string> = {
  // Nations & English names
  'spain': 'es',
  'espana': 'es',
  'españa': 'es',
  'england': 'gb-eng',
  'france': 'fr',
  'germany': 'de',
  'italy': 'it',
  'belgium': 'be',
  'croatia': 'hr',
  'czechia': 'cz',
  'czech republic': 'cz',
  'türkiye': 'tr',
  'turkey': 'tr',
  'finland': 'fi',
  'san marino': 'sm',
  'belarus': 'by',
  'albania': 'al',
  'latvia': 'lv',
  'armenia': 'am',
  'cyprus': 'cy',
  'montenegro': 'me',
  'suriname': 'sr',
  'eswatini': 'sz',
  'netherlands': 'nl',
  'holland': 'nl',
  'portugal': 'pt',
  'switzerland': 'ch',
  'scotland': 'gb-sct',
  'wales': 'gb-wls',
  'northern ireland': 'gb-nir',
  'ireland': 'ie',
  'austria': 'at',
  'denmark': 'dk',
  'sweden': 'se',
  'norway': 'no',
  'poland': 'pl',
  'ukraine': 'ua',
  'serbia': 'rs',
  'greece': 'gr',
  'slovakia': 'sk',
  'hungary': 'hu',
  'romania': 'ro',
  'bulgaria': 'bg',
  'slovenia': 'si',
  'kazakhstan': 'kz',
  'georgia': 'ge',
  'iceland': 'is',
  'bosnia and herzegovina': 'ba',
  'bosnia': 'ba',
  'israel': 'il',
  'luxembourg': 'lu',
  'faroe islands': 'fo',
  'estonia': 'ee',
  'lithuania': 'lt',
  'moldova': 'md',
  'gibraltar': 'gi',
  'malta': 'mt',
  'andorra': 'ad',
  'azerbaijan': 'az',
  'liechtenstein': 'li',
  'argentina': 'ar',
  'brazil': 'br',
  'uruguay': 'uy',
  'colombia': 'co',
  'united states': 'us',
  'usa': 'us',
  'mexico': 'mx',
  'canada': 'ca',
  'japan': 'jp',
  'south korea': 'kr',
  'morocco': 'ma',
  'senegal': 'sn',
  'nigeria': 'ng',
  'cameroon': 'cm',
  'ghana': 'gh',
  'egypt': 'eg',
  'algeria': 'dz',
  'ivory coast': 'ci',
  'south africa': 'za',
  'australia': 'au',
  'saudi arabia': 'sa',

  // 2-Letter / 3-Letter abbreviations
  'es': 'es',
  'esp': 'es',
  'en': 'gb-eng',
  'eng': 'gb-eng',
  'gb': 'gb',
  'fr': 'fr',
  'fra': 'fr',
  'de': 'de',
  'ger': 'de',
  'it': 'it',
  'ita': 'it',
  'be': 'be',
  'bel': 'be',
  'hr': 'hr',
  'cro': 'hr',
  'cz': 'cz',
  'cze': 'cz',
  'tr': 'tr',
  'tur': 'tr',
  'fi': 'fi',
  'fin': 'fi',
  'sm': 'sm',
  'by': 'by',
  'al': 'al',
  'lv': 'lv',
  'am': 'am',
  'cy': 'cy',
  'me': 'me',
  'sr': 'sr',
  'sz': 'sz',
  'nl': 'nl',
  'pt': 'pt',
  'ch': 'ch',
};

export const COMPETITION_LOGOS: Record<string, string> = {
  'champions-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
  'ucl': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
  'uefa-champions-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
  'premier-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
  'epl': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
  'la-liga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
  'laliga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
  'serie-a': 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
  'seriea': 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
  'bundesliga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
  'ligue-1': 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
  'ligue1': 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
  'europa-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png',
  'uel': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png',
  'nations-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png',
  'uefa-nations-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png',
  'unl': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png',
  'friendlies': 'https://a.espncdn.com/i/leaguelogos/soccer/500/53.png',
};

/**
 * Returns a clean, high-resolution rectangular country flag image URL (flagcdn.com).
 * Renders without circular borders and without text codes.
 */
export function getTeamFlagUrl(team?: Partial<Team> | null): string {
  if (!team) return 'https://flagcdn.com/w40/un.png';

  const teamNameKey = (team.name || '').toLowerCase().trim();
  if (COUNTRY_TO_CODE[teamNameKey]) {
    return `https://flagcdn.com/w40/${COUNTRY_TO_CODE[teamNameKey]}.png`;
  }

  const countryKey = (team.country || '').toLowerCase().trim();
  if (COUNTRY_TO_CODE[countryKey]) {
    return `https://flagcdn.com/w40/${COUNTRY_TO_CODE[countryKey]}.png`;
  }

  const countryCodeKey = (team.countryCode || '').toLowerCase().trim();
  if (COUNTRY_TO_CODE[countryCodeKey]) {
    return `https://flagcdn.com/w40/${COUNTRY_TO_CODE[countryCodeKey]}.png`;
  }

  const teamCodeKey = (team.code || '').toLowerCase().trim();
  if (COUNTRY_TO_CODE[teamCodeKey]) {
    return `https://flagcdn.com/w40/${COUNTRY_TO_CODE[teamCodeKey]}.png`;
  }

  // Club to country mapping
  if (/madrid|barcelona|atletico|sevilla|valencia|betis|bilbao|sociedad/i.test(teamNameKey)) return 'https://flagcdn.com/w40/es.png';
  if (/manchester|liverpool|arsenal|chelsea|tottenham|newcastle|aston villa|west ham/i.test(teamNameKey)) return 'https://flagcdn.com/w40/gb-eng.png';
  if (/milan|juventus|inter|roma|napoli|lazio|atalanta|fiorentina/i.test(teamNameKey)) return 'https://flagcdn.com/w40/it.png';
  if (/bayern|dortmund|leverkusen|leipzig|frankfurt|stuttgart/i.test(teamNameKey)) return 'https://flagcdn.com/w40/de.png';
  if (/paris|marseille|lyon|monaco|lille|lens|rennes/i.test(teamNameKey)) return 'https://flagcdn.com/w40/fr.png';
  if (/benfica|porto|sporting/i.test(teamNameKey)) return 'https://flagcdn.com/w40/pt.png';
  if (/ajax|psv|feyenoord/i.test(teamNameKey)) return 'https://flagcdn.com/w40/nl.png';
  if (/celtic|rangers/i.test(teamNameKey)) return 'https://flagcdn.com/w40/gb-sct.png';

  return 'https://flagcdn.com/w40/un.png';
}

/**
 * Returns the official high-resolution competition logo URL.
 */
export function getCompetitionLogo(comp?: Partial<Competition> | null): string {
  if (comp?.logo && comp.logo.startsWith('http')) return comp.logo;
  const key = `${comp?.slug || ''} ${comp?.id || ''} ${comp?.name || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  for (const [k, url] of Object.entries(COMPETITION_LOGOS)) {
    if (key.includes(k)) return url;
  }
  return 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png';
}

interface TeamFlagProps {
  team: Team;
  className?: string;
}

/**
 * Clean rectangular flag image without circles, borders, or codes.
 */
export const TeamFlag: React.FC<TeamFlagProps> = ({ team, className = 'w-6 h-4' }) => {
  const flagUrl = getTeamFlagUrl(team);
  return (
    <img
      src={flagUrl}
      alt={team.country || team.name}
      className={`object-cover rounded-sm shadow-sm flex-shrink-0 ${className}`}
      loading="lazy"
    />
  );
};
