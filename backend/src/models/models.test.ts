import { describe, it, expect } from 'vitest';
import {
  MatchSchema,
  MatchLineupsSchema,
  UpcomingMatchStatsSchema,
  InGameMatchStatsSchema,
  AIPredictionSchema,
  MatchStreamInfoSchema,
} from './index.js';

describe('Step 2: Core Data Models & Schema Validation', () => {
  it('validates a complete Match object', () => {
    const validMatch = {
      id: 'ucl-rm-mci',
      competition: {
        id: 'ucl',
        name: 'UEFA Champions League',
        slug: 'champions-league',
        country: 'Europe',
        countryCode: 'eu',
        order: 1,
      },
      homeTeam: {
        id: 'rm',
        name: 'Real Madrid',
        code: 'RMA',
        country: 'Spain',
      },
      awayTeam: {
        id: 'mci',
        name: 'Manchester City',
        code: 'MCI',
        country: 'England',
      },
      kickoffTime: new Date().toISOString(),
      status: 'live',
      liveMinute: 68,
      score: { home: 2, away: 2 },
      redCards: [
        { id: 'rc-1', playerName: 'Rodri', minute: 54, teamId: 'mci' },
      ],
      scorers: [
        { id: 'sc-1', playerName: 'Vinicius Jr', minute: 23, teamId: 'rm' },
        { id: 'sc-2', playerName: 'Haaland', minute: 31, teamId: 'mci' },
      ],
    };

    const parsed = MatchSchema.parse(validMatch);
    expect(parsed.status).toBe('live');
    expect(parsed.redCards).toHaveLength(1);
    expect(parsed.score?.home).toBe(2);
  });

  it('validates football pitch lineups with 11 starters', () => {
    const createPlayer = (i: number) => ({
      id: `p-${i}`,
      name: `Player ${i}`,
      number: i,
      position: i === 1 ? 'GK' : 'MF',
      gridX: 50,
      gridY: (i % 11) * 8 + 5,
    });

    const lineups = {
      matchId: 'm-123',
      home: {
        formation: '4-3-3',
        confirmed: true,
        coach: 'Carlo Ancelotti',
        startingXI: Array.from({ length: 11 }, (_, i) => createPlayer(i + 1)),
        substitutes: [createPlayer(12), createPlayer(13)],
      },
      away: {
        formation: '4-2-3-1',
        confirmed: false,
        coach: 'Pep Guardiola',
        startingXI: Array.from({ length: 11 }, (_, i) => createPlayer(i + 14)),
        substitutes: [createPlayer(25)],
      },
    };

    const parsed = MatchLineupsSchema.parse(lineups);
    expect(parsed.home.startingXI).toHaveLength(11);
    expect(parsed.home.confirmed).toBe(true);
    expect(parsed.away.confirmed).toBe(false);
  });

  it('validates upcoming match stats with last 5 games form', () => {
    const pastGames = Array.from({ length: 5 }, (_, i) => ({
      opponent: `Opponent ${i}`,
      score: '2 - 1',
      result: 'W' as const,
      date: '2026-11-01',
    }));

    const stats = {
      type: 'upcoming' as const,
      matchId: 'm-123',
      home: {
        teamId: 'rm',
        teamName: 'Real Madrid',
        form: ['W', 'W', 'D', 'W', 'L'] as ('W' | 'D' | 'L')[],
        past5Games: pastGames,
        goalsScored: 12,
        goalsConceded: 4,
        expectedGoals: 2.15,
        possession: 59.4,
        bigChancesCreated: 18,
        cleanSheets: 2,
      },
      away: {
        teamId: 'mci',
        teamName: 'Manchester City',
        form: ['W', 'D', 'W', 'W', 'W'] as ('W' | 'D' | 'L')[],
        past5Games: pastGames,
        goalsScored: 15,
        goalsConceded: 5,
        expectedGoals: 2.45,
        possession: 64.2,
        bigChancesCreated: 21,
        cleanSheets: 3,
      },
    };

    const parsed = UpcomingMatchStatsSchema.parse(stats);
    expect(parsed.type).toBe('upcoming');
    expect(parsed.home.past5Games).toHaveLength(5);
  });

  it('validates in-game live/past match stats metrics', () => {
    const liveStats = {
      type: 'live' as const,
      matchId: 'm-123',
      possession: { home: 54, away: 46 },
      bigChances: { home: 3, away: 2 },
      totalShots: { home: 14, away: 11 },
      shotsOnTarget: { home: 6, away: 5 },
      goalkeeperSaves: { home: 3, away: 4 },
      cornerKicks: { home: 7, away: 5 },
      fouls: { home: 9, away: 12 },
      passes: { home: 512, away: 440 },
      tackles: { home: 18, away: 15 },
      freeKicks: { home: 13, away: 10 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 1 },
    };

    const parsed = InGameMatchStatsSchema.parse(liveStats);
    expect(parsed.possession.home).toBe(54);
    expect(parsed.redCards.away).toBe(1);
  });

  it('validates AI predictions (Tab 3: probabilities, 2 low-risk, 2 high-risk bets, summary)', () => {
    const prediction = {
      matchId: 'm-123',
      probabilities: {
        homeWin: 48,
        draw: 28,
        awayWin: 24,
      },
      lowRiskBets: [
        { title: 'Over 1.5 Goals', risk: 'low' as const, confidence: 88, reasoning: 'Both teams score consistently' },
        { title: 'Home Team or Draw', risk: 'low' as const, confidence: 82, reasoning: 'Strong home record' },
      ],
      highRiskBets: [
        { title: 'Both Teams to Score & Over 3.5 Goals', risk: 'high' as const, confidence: 61, reasoning: 'High xG for both sides' },
        { title: 'Haaland to Score Anytime', risk: 'high' as const, confidence: 55, reasoning: 'Haaland penalty taker and top scorer' },
      ],
      analyticalSummary: 'Real Madrid enters this clash with formidable attacking momentum at the Santiago Bernabeu, while Manchester City will look to exploit transitional spaces. Given both clubs high expected goals metrics over their last five matches, an open encounter with multiple goals is highly probable.',
      generatedAt: new Date().toISOString(),
      model: 'gemini-3.5-flash-lite',
    };

    const parsed = AIPredictionSchema.parse(prediction);
    expect(parsed.lowRiskBets).toHaveLength(2);
    expect(parsed.highRiskBets).toHaveLength(2);
    expect(parsed.probabilities.homeWin).toBe(48);
  });

  it('validates MatchStreamInfo schema for IPTV broadcast channels', () => {
    const streamInfo = {
      matchId: 'm-123',
      status: 'ready' as const,
      statusMessage: 'Live stream is ready to broadcast',
      minutesToKickoff: 15,
      channels: [
        { id: 'ch-fr-1', name: 'Canal+ Foot', country: 'France', countryCode: 'fr', flag: '🇫🇷', streamUrl: '/api/streams/relay/ch-fr-1' },
        { id: 'ch-en-1', name: 'TNT Sports 1', country: 'England', countryCode: 'en', flag: '🇬🇧', streamUrl: '/api/streams/relay/ch-en-1' },
        { id: 'ch-es-1', name: 'Movistar Liga de Campeones', country: 'Spain', countryCode: 'es', flag: '🇪🇸', streamUrl: '/api/streams/relay/ch-es-1' },
      ],
      activeChannelId: 'ch-fr-1',
    };

    const parsed = MatchStreamInfoSchema.parse(streamInfo);
    expect(parsed.status).toBe('ready');
    expect(parsed.channels).toHaveLength(3);
  });
});
