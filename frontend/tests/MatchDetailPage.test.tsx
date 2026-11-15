import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MatchDetailPage } from '../src/pages/MatchDetailPage.js';
import { api } from '../src/api/client.js';
import '../src/i18n/index.js';

vi.mock('../src/api/client.js', () => ({
  api: {
    getMatchById: vi.fn(),
    getMatchStreamInfo: vi.fn(),
    getMatchLineups: vi.fn(),
    getMatchStats: vi.fn(),
    getMatchAiInsights: vi.fn(),
  },
}));

const mockLiveMatch = {
  id: 'ucl-rm-mci',
  competition: { id: 'ucl', name: 'UEFA Champions League', country: 'Europe', countryCode: 'eu', order: 1 },
  homeTeam: { id: 'rm', name: 'Real Madrid', code: 'RMA', country: 'Spain', logo: '👑' },
  awayTeam: { id: 'mci', name: 'Manchester City', code: 'MCI', country: 'England', logo: '⚡' },
  kickoffTime: '2026-11-15T20:00:00.000Z',
  status: 'live' as const,
  liveMinute: 68,
  score: { home: 2, away: 2 },
  scorers: [{ id: 'sc-1', playerName: 'Vinicius Jr', minute: 12, teamId: 'rm' }],
  redCards: [{ id: 'rc-1', playerName: 'Rodri', minute: 54, teamId: 'mci' }],
};

const mockStreamReady = {
  matchId: 'ucl-rm-mci',
  status: 'ready' as const,
  statusMessage: 'Live stream is ready.',
  minutesToKickoff: 0,
  channels: [
    { id: '101', name: 'Canal+ Foot HD', country: 'France', countryCode: 'fr', flag: '🇫🇷', streamUrl: '/api/streams/relay/101' },
    { id: '201', name: 'TNT Sports 1 UK', country: 'England', countryCode: 'en', flag: '🇬🇧', streamUrl: '/api/streams/relay/201' },
    { id: '301', name: 'Movistar Liga de Campeones', country: 'Spain', countryCode: 'es', flag: '🇪🇸', streamUrl: '/api/streams/relay/301' },
  ],
  activeChannelId: '101',
};

const mockFinishedMatch = {
  ...mockLiveMatch,
  id: 'epl-tot-mun',
  status: 'finished' as const,
  score: { home: 1, away: 3 },
};

const mockStreamEnded = {
  matchId: 'epl-tot-mun',
  status: 'ended' as const,
  statusMessage: 'The game is over.',
  minutesToKickoff: -120,
  channels: [],
};

describe('Frontend Step 4: MatchDetailPage & Video Player Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMatchLineups as any).mockResolvedValue(null);
  });

  it('renders match scoreboard and live video player with channel switcher', async () => {
    (api.getMatchById as any).mockResolvedValue(mockLiveMatch);
    (api.getMatchStreamInfo as any).mockResolvedValue(mockStreamReady);

    render(
      <MemoryRouter initialEntries={['/match/ucl-rm-mci']}>
        <Routes>
          <Route path="/match/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
      expect(screen.getByText('Manchester City')).toBeInTheDocument();
      expect(screen.getByText('2 : 2')).toBeInTheDocument();
      expect(screen.getByText('Vinicius Jr')).toBeInTheDocument();
      expect(screen.getByText("12'")).toBeInTheDocument();
      expect(screen.getByTestId('stream-ready')).toBeInTheDocument();
    });

    // Verify channel dropdown with flags
    const channelSelect = screen.getByLabelText('Select broadcast channel');
    expect(channelSelect).toBeInTheDocument();
    expect(screen.getAllByText(/Canal\+ Foot HD/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/TNT Sports 1 UK/i).length).toBeGreaterThanOrEqual(1);

    // Change channel in dropdown
    fireEvent.change(channelSelect, { target: { value: '201' } });
    expect(channelSelect).toHaveValue('201');
  });

  it('displays "game is over" when match has concluded', async () => {
    (api.getMatchById as any).mockResolvedValue(mockFinishedMatch);
    (api.getMatchStreamInfo as any).mockResolvedValue(mockStreamEnded);

    render(
      <MemoryRouter initialEntries={['/match/epl-tot-mun']}>
        <Routes>
          <Route path="/match/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stream-ended')).toBeInTheDocument();
      expect(screen.getAllByText(/The game is over/i).length).toBeGreaterThanOrEqual(1);
    });

    // AI Insights tab should NOT be rendered for finished games
    expect(screen.queryByTestId('tab-button-ai')).not.toBeInTheDocument();
  });

  it('renders AI Insights tab button for live or upcoming matches', async () => {
    (api.getMatchById as any).mockResolvedValue(mockLiveMatch);
    (api.getMatchStreamInfo as any).mockResolvedValue(mockStreamReady);

    render(
      <MemoryRouter initialEntries={['/match/ucl-rm-mci']}>
        <Routes>
          <Route path="/match/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-button-lineups')).toBeInTheDocument();
      expect(screen.getByTestId('tab-button-stats')).toBeInTheDocument();
      expect(screen.getByTestId('tab-button-ai')).toBeInTheDocument();
    });
  });
});
