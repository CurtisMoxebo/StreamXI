import { Match, MatchLineups, MatchStatsResponse } from '../../models/index.js';

export const COMPETITIONS = {
  UCL: {
    id: 'ucl',
    name: 'UEFA Champions League',
    slug: 'champions-league',
    country: 'Europe',
    countryCode: 'eu',
    logo: '⭐',
    order: 1,
  },
  EPL: {
    id: 'epl',
    name: 'Premier League',
    slug: 'premier-league',
    country: 'England',
    countryCode: 'en',
    logo: '🦁',
    order: 2,
  },
  LALIGA: {
    id: 'laliga',
    name: 'La Liga EA Sports',
    slug: 'la-liga',
    country: 'Spain',
    countryCode: 'es',
    logo: '🇪🇸',
    order: 3,
  },
  SERIEA: {
    id: 'seriea',
    name: 'Serie A',
    slug: 'serie-a',
    country: 'Italy',
    countryCode: 'it',
    logo: '🇮🇹',
    order: 4,
  },
  BUNDESLIGA: {
    id: 'bundesliga',
    name: 'Bundesliga',
    slug: 'bundesliga',
    country: 'Germany',
    countryCode: 'de',
    logo: '🇩🇪',
    order: 5,
  },
  LIGUE1: {
    id: 'ligue1',
    name: 'Ligue 1 McDonald\'s',
    slug: 'ligue-1',
    country: 'France',
    countryCode: 'fr',
    logo: '🇫🇷',
    order: 6,
  },
};

export function getSeedMatches(baseDateString: string): Match[] {
  // Normalize date string (YYYY-MM-DD)
  const d = baseDateString ? baseDateString.substring(0, 10) : new Date().toISOString().substring(0, 10);

  return [
    // 1. UCL: Real Madrid vs Man City (LIVE)
    {
      id: 'ucl-rm-mci',
      competition: COMPETITIONS.UCL,
      homeTeam: { id: 'rm', name: 'Real Madrid', code: 'RMA', country: 'Spain', logo: '👑' },
      awayTeam: { id: 'mci', name: 'Manchester City', code: 'MCI', country: 'England', logo: '⚡' },
      kickoffTime: `${d}T20:00:00.000Z`,
      status: 'live',
      liveMinute: 68,
      score: { home: 2, away: 2 },
      scorers: [
        { id: 'sc-1', playerName: 'Vinicius Jr', minute: 12, teamId: 'rm' },
        { id: 'sc-2', playerName: 'Rodri', minute: 28, teamId: 'mci' },
        { id: 'sc-3', playerName: 'Jude Bellingham', minute: 56, teamId: 'rm' },
        { id: 'sc-4', playerName: 'Erling Haaland', minute: 64, teamId: 'mci' },
      ],
      redCards: [
        { id: 'rc-1', playerName: 'Rodri', minute: 54, teamId: 'mci' },
      ],
      venue: 'Santiago Bernabéu, Madrid',
    },
    // 2. UCL: Arsenal vs Bayern Munich (LIVE)
    {
      id: 'ucl-ars-bay',
      competition: COMPETITIONS.UCL,
      homeTeam: { id: 'ars', name: 'Arsenal', code: 'ARS', country: 'England', logo: '🔴' },
      awayTeam: { id: 'bay', name: 'Bayern Munich', code: 'BAY', country: 'Germany', logo: '⚪' },
      kickoffTime: `${d}T20:00:00.000Z`,
      status: 'live',
      liveMinute: 42,
      score: { home: 1, away: 0 },
      scorers: [
        { id: 'sc-5', playerName: 'Bukayo Saka', minute: 29, teamId: 'ars' },
      ],
      redCards: [],
      venue: 'Emirates Stadium, London',
    },
    // 3. EPL: Liverpool vs Chelsea (UPCOMING - in < 30 mins)
    {
      id: 'epl-liv-che',
      competition: COMPETITIONS.EPL,
      homeTeam: { id: 'liv', name: 'Liverpool', code: 'LIV', country: 'England', logo: '🔴' },
      awayTeam: { id: 'che', name: 'Chelsea', code: 'CHE', country: 'England', logo: '🔵' },
      kickoffTime: `${d}T20:30:00.000Z`,
      status: 'upcoming',
      scorers: [],
      redCards: [],
      venue: 'Anfield, Liverpool',
    },
    // 4. EPL: Tottenham vs Manchester United (FINISHED)
    {
      id: 'epl-tot-mun',
      competition: COMPETITIONS.EPL,
      homeTeam: { id: 'tot', name: 'Tottenham Hotspur', code: 'TOT', country: 'England', logo: '⚪' },
      awayTeam: { id: 'mun', name: 'Manchester United', code: 'MUN', country: 'England', logo: '👹' },
      kickoffTime: `${d}T16:30:00.000Z`,
      status: 'finished',
      score: { home: 1, away: 3 },
      scorers: [
        { id: 'sc-6', playerName: 'Son Heung-min', minute: 22, teamId: 'tot' },
        { id: 'sc-7', playerName: 'Bruno Fernandes', minute: 34, teamId: 'mun' },
        { id: 'sc-8', playerName: 'Rasmus Hojlund', minute: 61, teamId: 'mun' },
        { id: 'sc-9', playerName: 'Marcus Rashford', minute: 88, teamId: 'mun' },
      ],
      redCards: [
        { id: 'rc-2', playerName: 'Cristian Romero', minute: 71, teamId: 'tot' },
      ],
      venue: 'Tottenham Hotspur Stadium, London',
    },
    // 5. EPL: Aston Villa vs Newcastle (UPCOMING)
    {
      id: 'epl-avl-new',
      competition: COMPETITIONS.EPL,
      homeTeam: { id: 'avl', name: 'Aston Villa', code: 'AVL', country: 'England', logo: '🦁' },
      awayTeam: { id: 'new', name: 'Newcastle United', code: 'NEW', country: 'England', logo: '⚫' },
      kickoffTime: `${d}T22:00:00.000Z`,
      status: 'upcoming',
      scorers: [],
      redCards: [],
      venue: 'Villa Park, Birmingham',
    },
    // 6. La Liga: Barcelona vs Atletico Madrid (UPCOMING)
    {
      id: 'laliga-bar-atm',
      competition: COMPETITIONS.LALIGA,
      homeTeam: { id: 'bar', name: 'FC Barcelona', code: 'BAR', country: 'Spain', logo: '🔵🔴' },
      awayTeam: { id: 'atm', name: 'Atletico Madrid', code: 'ATM', country: 'Spain', logo: '🔴⚪' },
      kickoffTime: `${d}T21:00:00.000Z`,
      status: 'upcoming',
      scorers: [],
      redCards: [],
      venue: 'Estadi Olímpic Lluís Companys, Barcelona',
    },
    // 7. La Liga: Real Sociedad vs Athletic Club (FINISHED)
    {
      id: 'laliga-rso-ath',
      competition: COMPETITIONS.LALIGA,
      homeTeam: { id: 'rso', name: 'Real Sociedad', code: 'RSO', country: 'Spain', logo: '🔵' },
      awayTeam: { id: 'ath', name: 'Athletic Club', code: 'ATH', country: 'Spain', logo: '🦁' },
      kickoffTime: `${d}T14:00:00.000Z`,
      status: 'finished',
      score: { home: 1, away: 1 },
      scorers: [
        { id: 'sc-10', playerName: 'Oyarzabal', minute: 40, teamId: 'rso' },
        { id: 'sc-11', playerName: 'Inaki Williams', minute: 78, teamId: 'ath' },
      ],
      redCards: [],
      venue: 'Reale Arena, San Sebastian',
    },
    // 8. Ligue 1: Paris Saint-Germain vs Marseille (FINISHED)
    {
      id: 'l1-psg-om',
      competition: COMPETITIONS.LIGUE1,
      homeTeam: { id: 'psg', name: 'Paris Saint-Germain', code: 'PSG', country: 'France', logo: '🗼' },
      awayTeam: { id: 'om', name: 'Olympique de Marseille', code: 'OM', country: 'France', logo: '⚪' },
      kickoffTime: `${d}T17:00:00.000Z`,
      status: 'finished',
      score: { home: 3, away: 0 },
      scorers: [
        { id: 'sc-12', playerName: 'Joao Neves', minute: 7, teamId: 'psg' },
        { id: 'sc-13', playerName: 'Balerdi (OG)', minute: 29, teamId: 'psg', isOwnGoal: true },
        { id: 'sc-14', playerName: 'Bradley Barcola', minute: 40, teamId: 'psg' },
      ],
      redCards: [
        { id: 'rc-3', playerName: 'Amine Harit', minute: 20, teamId: 'om' },
      ],
      venue: 'Parc des Princes, Paris',
    },
  ];
}

const HOME_STARTERS_POOL = [
  { name: 'Thibaut Courtois', number: 1, position: 'GK', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/148011.png&w=96&h=96&scale=crop' },
  { name: 'Dani Carvajal', number: 2, position: 'RB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/167246.png&w=96&h=96&scale=crop' },
  { name: 'Eder Militão', number: 3, position: 'CB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/226154.png&w=96&h=96&scale=crop' },
  { name: 'Antonio Rüdiger', number: 22, position: 'CB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/159419.png&w=96&h=96&scale=crop' },
  { name: 'Ferland Mendy', number: 23, position: 'LB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/226553.png&w=96&h=96&scale=crop' },
  { name: 'Federico Valverde', number: 8, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/226500.png&w=96&h=96&scale=crop' },
  { name: 'Eduardo Camavinga', number: 6, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/271708.png&w=96&h=96&scale=crop' },
  { name: 'Jude Bellingham', number: 5, position: 'CAM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/285747.png&w=96&h=96&scale=crop' },
  { name: 'Rodrygo Goes', number: 11, position: 'RW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/253896.png&w=96&h=96&scale=crop' },
  { name: 'Kylian Mbappé', number: 9, position: 'ST', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/230784.png&w=96&h=96&scale=crop' },
  { name: 'Vinicius Jr', number: 7, position: 'LW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/248239.png&w=96&h=96&scale=crop' },
];

const AWAY_STARTERS_POOL = [
  { name: 'Ederson Moraes', number: 31, position: 'GK', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/180373.png&w=96&h=96&scale=crop' },
  { name: 'Kyle Walker', number: 2, position: 'RB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/128386.png&w=96&h=96&scale=crop' },
  { name: 'Ruben Dias', number: 3, position: 'CB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/226156.png&w=96&h=96&scale=crop' },
  { name: 'John Stones', number: 5, position: 'CB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/170669.png&w=96&h=96&scale=crop' },
  { name: 'Josko Gvardiol', number: 24, position: 'LB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/283624.png&w=96&h=96&scale=crop' },
  { name: 'Rodrigo Hernandez', number: 16, position: 'DM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/226162.png&w=96&h=96&scale=crop' },
  { name: 'Kevin De Bruyne', number: 17, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/128456.png&w=96&h=96&scale=crop' },
  { name: 'Bernardo Silva', number: 20, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/183120.png&w=96&h=96&scale=crop' },
  { name: 'Phil Foden', number: 47, position: 'RW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/248554.png&w=96&h=96&scale=crop' },
  { name: 'Erling Haaland', number: 9, position: 'ST', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/253941.png&w=96&h=96&scale=crop' },
  { name: 'Jeremy Doku', number: 11, position: 'LW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/285748.png&w=96&h=96&scale=crop' },
];

function generatePitchStarters(prefix: string, isHome: boolean) {
  const gkX = isHome ? 12 : 88;
  const defX = isHome ? 25 : 75;
  const midX = isHome ? 38 : 62;
  const attX = isHome ? 48 : 52;

  const pool = isHome ? HOME_STARTERS_POOL : AWAY_STARTERS_POOL;

  const yPositions = [50, 20, 40, 60, 80, 50, 30, 70, 20, 50, 80];
  const xPositions = [gkX, defX, defX, defX, defX, midX, midX, midX, attX, attX, attX];

  return pool.map((p, idx) => ({
    id: `${prefix}-${idx + 1}`,
    name: p.name,
    number: p.number,
    position: p.position,
    image: p.image,
    gridX: xPositions[idx] || 50,
    gridY: yPositions[idx] || 50,
  }));
}

export function getSeedLineups(matchId: string): MatchLineups {
  const isConfirmed = matchId.includes('rm') || matchId.includes('psg') || matchId.includes('tot');

  return {
    matchId,
    home: {
      formation: '4-3-3',
      confirmed: isConfirmed,
      coach: 'Carlo Ancelotti',
      startingXI: generatePitchStarters('h', true),
      substitutes: [
        { id: 'sub-h-1', name: 'Andriy Lunin', number: 13, position: 'GK', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/247942.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-h-2', name: 'Luka Modric', number: 10, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/85942.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-h-3', name: 'Brahim Diaz', number: 21, position: 'RW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/231070.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-h-4', name: 'Arda Güler', number: 15, position: 'CAM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/328402.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-h-5', name: 'Endrick Felipe', number: 16, position: 'ST', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/347493.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
      ],
    },
    away: {
      formation: '4-3-3',
      confirmed: isConfirmed,
      coach: 'Pep Guardiola',
      startingXI: generatePitchStarters('a', false),
      substitutes: [
        { id: 'sub-a-1', name: 'Stefan Ortega', number: 18, position: 'GK', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/167247.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-a-2', name: 'Manuel Akanji', number: 25, position: 'CB', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/215779.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-a-3', name: 'Mateo Kovacic', number: 8, position: 'CM', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/156749.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-a-4', name: 'Jack Grealish', number: 10, position: 'LW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/175923.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
        { id: 'sub-a-5', name: 'Savinho Moreira', number: 26, position: 'RW', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/328405.png&w=96&h=96&scale=crop', gridX: 0, gridY: 0 },
      ],
    },
  };
}

export function getSeedStats(match: Match): MatchStatsResponse {
  if (match.status === 'upcoming') {
    // Tab 2 for Upcoming games: Recent 5 games form and statistics
    const makeFormGames = (opponents: string[], wins: boolean[]) => 
      opponents.map((opp, idx) => ({
        opponent: opp,
        score: wins[idx] ? '2 - 0' : (idx === 2 ? '1 - 1' : '1 - 2'),
        result: wins[idx] ? ('W' as const) : (idx === 2 ? ('D' as const) : ('L' as const)),
        date: `2026-11-0${idx + 1}`,
        competition: match.competition.name,
      }));

    return {
      type: 'upcoming',
      matchId: match.id,
      home: {
        teamId: match.homeTeam.id,
        teamName: match.homeTeam.name,
        form: ['W', 'W', 'D', 'W', 'W'],
        past5Games: makeFormGames(['Sevilla', 'Valencia', 'Girona', 'Betis', 'Villarreal'], [true, true, false, true, true]),
        goalsScored: 14,
        goalsConceded: 3,
        expectedGoals: 2.38,
        possession: 61.5,
        bigChancesCreated: 19,
        cleanSheets: 3,
      },
      away: {
        teamId: match.awayTeam.id,
        teamName: match.awayTeam.name,
        form: ['W', 'D', 'W', 'L', 'W'],
        past5Games: makeFormGames(['Fulham', 'Brighton', 'Everton', 'Wolves', 'Brentford'], [true, false, true, false, true]),
        goalsScored: 11,
        goalsConceded: 6,
        expectedGoals: 1.84,
        possession: 55.2,
        bigChancesCreated: 14,
        cleanSheets: 2,
      },
    };
  }

  // Tab 2 for Live or Past games: In-Game Statistics
  return {
    type: match.status === 'live' ? 'live' : 'finished',
    matchId: match.id,
    possession: { home: 54, away: 46 },
    bigChances: { home: 4, away: 3 },
    totalShots: { home: 16, away: 12 },
    shotsOnTarget: { home: 7, away: 5 },
    goalkeeperSaves: { home: 3, away: 5 },
    cornerKicks: { home: 8, away: 4 },
    fouls: { home: 11, away: 14 },
    passes: { home: 532, away: 461 },
    tackles: { home: 19, away: 17 },
    freeKicks: { home: 14, away: 11 },
    yellowCards: { home: 2, away: 3 },
    redCards: {
      home: match.redCards.filter(r => r.teamId === match.homeTeam.id).length,
      away: match.redCards.filter(r => r.teamId === match.awayTeam.id).length,
    },
  };
}
