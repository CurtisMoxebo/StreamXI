import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n/index.js';
import { MatchDetailPage } from './MatchDetailPage.js';
import { LineupsTab } from '../components/tabs/LineupsTab.js';
import { StatsTab } from '../components/tabs/StatsTab.js';
import { AiInsightsTab } from '../components/tabs/AiInsightsTab.js';
import { api } from '../api/client.js';
import { Match, MatchLineups, UpcomingMatchStats, InGameMatchStats, AIPrediction, MatchStreamInfo } from '../types/index.js';

// Mock API client
vi.mock('../api/client.js', () => ({
  api: {
    getMatchById: vi.fn(),
    getMatchStreamInfo: vi.fn(),
    getMatchLineups: vi.fn(),
    getMatchStats: vi.fn(),
    getMatchAiInsights: vi.fn(),
  },
}));

describe('Match Detail Tabs & Lazy Loading', () => {
  const mockMatchLive: Match = {
    id: 'match-101',
    competition: { id: 'cl', name: 'Champions League', slug: 'ucl', country: 'Europe', countryCode: 'EU', order: 1 },
    homeTeam: { id: 'rm', name: 'Real Madrid', code: 'RMA', country: 'Spain' },
    awayTeam: { id: 'mci', name: 'Manchester City', code: 'MCI', country: 'England' },
    kickoffTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'live',
    liveMinute: 42,
    score: { home: 1, away: 0 },
    scorers: [{ id: 's1', playerName: 'Vinicius Jr', minute: 23, teamId: 'rm' }],
    redCards: [],
    venue: 'Santiago Bernabéu',
  };

  const mockMatchFinished: Match = {
    ...mockMatchLive,
    id: 'match-102',
    status: 'finished',
    score: { home: 2, away: 1 },
  };

  const mockStreamInfo: MatchStreamInfo = {
    matchId: 'match-101',
    status: 'ready',
    statusMessage: 'Live broadcast available',
    minutesToKickoff: -42,
    channels: [{ id: 'ch-1', name: 'Canal+ Foot', country: 'France', countryCode: 'FR', flag: '🇫🇷', streamUrl: '/live/ch-1' }],
    activeChannelId: 'ch-1',
  };

  const mockLineups: MatchLineups = {
    matchId: 'match-101',
    home: {
      formation: '4-3-3',
      confirmed: true,
      coach: 'Carlo Ancelotti',
      startingXI: [
        { id: 'p1', name: 'Courtois', number: 1, position: 'GK', gridX: 50, gridY: 88 },
        { id: 'p2', name: 'Vinicius Jr', number: 7, position: 'LW', gridX: 18, gridY: 25 },
      ],
      substitutes: [{ id: 'sub1', name: 'Modric', number: 10, position: 'MF', gridX: 0, gridY: 0 }],
    },
    away: {
      formation: '4-1-4-1',
      confirmed: true,
      coach: 'Pep Guardiola',
      startingXI: [
        { id: 'p3', name: 'Ederson', number: 31, position: 'GK', gridX: 50, gridY: 12 },
        { id: 'p4', name: 'Haaland', number: 9, position: 'ST', gridX: 50, gridY: 35 },
      ],
      substitutes: [{ id: 'sub2', name: 'De Bruyne', number: 17, position: 'MF', gridX: 0, gridY: 0 }],
    },
  };

  const mockInGameStats: InGameMatchStats = {
    type: 'live',
    matchId: 'match-101',
    possession: { home: 54, away: 46 },
    bigChances: { home: 3, away: 1 },
    totalShots: { home: 9, away: 6 },
    shotsOnTarget: { home: 4, away: 2 },
    goalkeeperSaves: { home: 2, away: 3 },
    cornerKicks: { home: 5, away: 3 },
    fouls: { home: 8, away: 11 },
    passes: { home: 380, away: 320 },
    tackles: { home: 14, away: 12 },
    freeKicks: { home: 11, away: 8 },
    yellowCards: { home: 1, away: 2 },
    redCards: { home: 0, away: 0 },
  };

  const mockUpcomingStats: UpcomingMatchStats = {
    type: 'upcoming',
    matchId: 'match-101',
    home: {
      teamId: 'rm',
      teamName: 'Real Madrid',
      form: ['W', 'W', 'D', 'W', 'L'],
      past5Games: [
        { opponent: 'Barcelona', score: '2-1', result: 'W', date: '2026-05-01' },
      ],
      goalsScored: 12,
      goalsConceded: 4,
      expectedGoals: 2.1,
      possession: 58,
      bigChancesCreated: 15,
      cleanSheets: 3,
    },
    away: {
      teamId: 'mci',
      teamName: 'Manchester City',
      form: ['W', 'W', 'W', 'D', 'W'],
      past5Games: [
        { opponent: 'Arsenal', score: '3-1', result: 'W', date: '2026-05-02' },
      ],
      goalsScored: 14,
      goalsConceded: 5,
      expectedGoals: 2.4,
      possession: 64,
      bigChancesCreated: 18,
      cleanSheets: 2,
    },
  };

  const mockAiPrediction: AIPrediction = {
    matchId: 'match-101',
    probabilities: {
      homeWin: 52,
      draw: 26,
      awayWin: 22,
    },
    lowRiskBets: [
      {
        title: 'Over 1.5 Total Goals',
        risk: 'low',
        confidence: 88,
        reasoning: 'Both teams average over 2.4 goals per match in recent European fixtures.',
      },
      {
        title: 'Real Madrid or Draw (Double Chance)',
        risk: 'low',
        confidence: 81,
        reasoning: 'Madrid remains undefeated at the Bernabéu across their last 12 home ties.',
      },
    ],
    highRiskBets: [
      {
        title: 'Vinicius Jr First Goalscorer',
        risk: 'high',
        confidence: 45,
        reasoning: 'Vinicius creates 1v1 overloads against high lines and scored in 3 consecutive UCL knockout legs.',
      },
      {
        title: 'Both Teams to Score in Both Halves',
        risk: 'high',
        confidence: 38,
        reasoning: 'High-octane tactical matchup with defensive vulnerabilities on transitional counter-attacks.',
      },
    ],
    analyticalSummary: 'Real Madrid leverages home advantage and rapid counter-attacks against Manchester City high press.',
    generatedAt: new Date().toISOString(),
    model: 'gemini-3.5-flash-lite',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMatchById as any).mockResolvedValue(mockMatchLive);
    (api.getMatchStreamInfo as any).mockResolvedValue(mockStreamInfo);
    (api.getMatchLineups as any).mockResolvedValue(mockLineups);
    (api.getMatchStats as any).mockResolvedValue(mockInGameStats);
    (api.getMatchAiInsights as any).mockResolvedValue(mockAiPrediction);
  });

  it('renders LineupsTab with pitch, players, coaches, and substitutes', async () => {
    render(<LineupsTab matchId="match-101" />);

    expect(await screen.findByText('Carlo Ancelotti')).toBeDefined();
    expect(screen.getByText('Pep Guardiola')).toBeDefined();
    expect(screen.getByText('Courtois')).toBeDefined();
    expect(screen.getByText('Haaland')).toBeDefined();
    expect(screen.getByText('Modric')).toBeDefined();
    expect(screen.getByText('De Bruyne')).toBeDefined();
  });

  it('renders StatsTab with in-game comparison stats for live match', async () => {
    render(<StatsTab matchId="match-101" />);

    expect(await screen.findByText('54%')).toBeDefined();
    expect(screen.getByText('46%')).toBeDefined();
  });

  it('renders StatsTab with 5-game form and metrics for upcoming match', async () => {
    (api.getMatchStats as any).mockResolvedValue(mockUpcomingStats);

    render(<StatsTab matchId="match-101" />);

    expect(await screen.findByText('Real Madrid')).toBeDefined();
    expect(screen.getByText('Manchester City')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined(); // goals scored
    expect(screen.getByText('14')).toBeDefined();
  });

  it('renders AiInsightsTab with probabilities, 2 low risk, 2 high risk bets, and Gemini summary', async () => {
    render(<AiInsightsTab matchId="match-101" />);

    expect(await screen.findByText('52%')).toBeDefined();
    expect(screen.getByText('26%')).toBeDefined();
    expect(screen.getByText('22%')).toBeDefined();

    expect(screen.getByText('Over 1.5 Total Goals')).toBeDefined();
    expect(screen.getByText('Real Madrid or Draw (Double Chance)')).toBeDefined();
    expect(screen.getByText('Vinicius Jr First Goalscorer')).toBeDefined();
    expect(screen.getByText('Both Teams to Score in Both Halves')).toBeDefined();

    expect(
      screen.getByText(
        /"Real Madrid leverages home advantage and rapid counter-attacks against Manchester City high press."/
      )
    ).toBeDefined();
    expect(screen.getByText('gemini-3.5-flash-lite')).toBeDefined();
  });

  it('enforces lazy-loading in MatchDetailPage: only lineups API called on initial render', async () => {
    render(
      <MemoryRouter initialEntries={['/match/match-101']}>
        <Routes>
          <Route path="/match/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial render fetches match, streamInfo, and lineups ONLY
    await waitFor(() => {
      expect(api.getMatchById).toHaveBeenCalledWith('match-101');
      expect(api.getMatchStreamInfo).toHaveBeenCalledWith('match-101');
      expect(api.getMatchLineups).toHaveBeenCalledWith('match-101');
    });

    // Stats and AI Insights must NOT have been called yet
    expect(api.getMatchStats).not.toHaveBeenCalled();
    expect(api.getMatchAiInsights).not.toHaveBeenCalled();

    // Now click the Stats Tab
    const statsTabBtn = screen.getByTestId('tab-button-stats');
    fireEvent.click(statsTabBtn);

    await waitFor(() => {
      expect(api.getMatchStats).toHaveBeenCalledWith('match-101');
    });
    expect(api.getMatchAiInsights).not.toHaveBeenCalled();

    // Now click the AI Tab
    const aiTabBtn = screen.getByTestId('tab-button-ai');
    fireEvent.click(aiTabBtn);

    await waitFor(() => {
      expect(api.getMatchAiInsights).toHaveBeenCalledWith('match-101');
    });
  });

  it('hides AI tab button when match is finished', async () => {
    (api.getMatchById as any).mockResolvedValue(mockMatchFinished);

    render(
      <MemoryRouter initialEntries={['/match/match-102']}>
        <Routes>
          <Route path="/match/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.getMatchById).toHaveBeenCalledWith('match-102');
    });

    expect(screen.queryByTestId('tab-button-ai')).toBeNull();
  });
});
