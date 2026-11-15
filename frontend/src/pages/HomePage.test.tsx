import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage.js';
import { api } from '../api/client.js';
import '../i18n/index.js';

// Mock API
vi.mock('../api/client.js', () => ({
  api: {
    getMatches: vi.fn(),
  },
}));

const mockMatchesData = {
  date: '2026-11-15',
  totalMatches: 3,
  groups: [
    {
      competition: {
        id: 'ucl',
        name: 'UEFA Champions League',
        slug: 'champions-league',
        country: 'Europe',
        countryCode: 'eu',
        order: 1,
      },
      matches: [
        {
          id: 'ucl-rm-mci',
          competition: { id: 'ucl', name: 'UEFA Champions League', country: 'Europe', countryCode: 'eu', order: 1 },
          homeTeam: { id: 'rm', name: 'Real Madrid', code: 'RMA', country: 'Spain' },
          awayTeam: { id: 'mci', name: 'Manchester City', code: 'MCI', country: 'England' },
          kickoffTime: '2026-11-15T20:00:00.000Z',
          status: 'live',
          liveMinute: 68,
          score: { home: 2, away: 2 },
          redCards: [{ id: 'rc-1', playerName: 'Rodri', minute: 54, teamId: 'mci' }],
          scorers: [],
        },
        {
          id: 'ucl-ars-bay',
          competition: { id: 'ucl', name: 'UEFA Champions League', country: 'Europe', countryCode: 'eu', order: 1 },
          homeTeam: { id: 'ars', name: 'Arsenal', code: 'ARS', country: 'England' },
          awayTeam: { id: 'bay', name: 'Bayern Munich', code: 'BAY', country: 'Germany' },
          kickoffTime: '2026-11-15T20:00:00.000Z',
          status: 'upcoming',
          scorers: [],
          redCards: [],
        },
      ],
    },
    {
      competition: {
        id: 'epl',
        name: 'Premier League',
        slug: 'premier-league',
        country: 'England',
        countryCode: 'en',
        order: 2,
      },
      matches: [
        {
          id: 'epl-tot-mun',
          competition: { id: 'epl', name: 'Premier League', country: 'England', countryCode: 'en', order: 2 },
          homeTeam: { id: 'tot', name: 'Tottenham Hotspur', code: 'TOT', country: 'England' },
          awayTeam: { id: 'mun', name: 'Manchester United', code: 'MUN', country: 'England' },
          kickoffTime: '2026-11-15T16:30:00.000Z',
          status: 'finished',
          score: { home: 1, away: 3 },
          redCards: [{ id: 'rc-2', playerName: 'Romero', minute: 71, teamId: 'tot' }],
          scorers: [],
        },
      ],
    },
  ],
};

describe('Frontend Step 3: HomePage & Matches List Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMatches as any).mockResolvedValue(mockMatchesData);
  });

  it('renders matches grouped by competition and sorted', async () => {
    render(
      <BrowserRouter>
        <HomePage searchQuery="" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('UEFA Champions League').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Premier League').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
      expect(screen.getByText('Manchester City')).toBeInTheDocument();
    });
  });

  it('renders red cards badge next to penalized team', async () => {
    render(
      <BrowserRouter>
        <HomePage searchQuery="" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      const redCardElements = screen.getAllByLabelText('Red card');
      expect(redCardElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters matches smoothly when search query is entered', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <HomePage searchQuery="Arsenal" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Arsenal')).toBeInTheDocument();
      expect(screen.queryByText('Manchester United')).not.toBeInTheDocument();
    });

    // When query doesn't match anything
    rerender(
      <BrowserRouter>
        <HomePage searchQuery="NonExistentTeam" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No matches found/i)).toBeInTheDocument();
    });
  });

  it('filters by status when status filter buttons are clicked', async () => {
    render(
      <BrowserRouter>
        <HomePage searchQuery="" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
      expect(screen.getByText('Tottenham Hotspur')).toBeInTheDocument();
    });

    // Click "Live" filter
    const liveFilterBtn = screen.getByRole('button', { name: /Live/i });
    fireEvent.click(liveFilterBtn);

    await waitFor(() => {
      // Real Madrid is live
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
      // Tottenham is finished, so hidden
      expect(screen.queryByText('Tottenham Hotspur')).not.toBeInTheDocument();
    });
  });

  it('navigates dates when previous and next date buttons are clicked', async () => {
    render(
      <BrowserRouter>
        <HomePage searchQuery="" onResetSearch={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getMatches).toHaveBeenCalledTimes(1);
    });

    const nextDateBtn = screen.getByLabelText('Next Day');
    fireEvent.click(nextDateBtn);

    await waitFor(() => {
      expect(api.getMatches).toHaveBeenCalledTimes(2);
    });
  });
});
