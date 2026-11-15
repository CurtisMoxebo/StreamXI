import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LiveTvChannelPage } from '../src/pages/LiveTvChannelPage.js';
import { api } from '../src/api/client.js';
import '../src/i18n/index.js';

vi.mock('../src/api/client.js', () => ({
  api: {
    getLiveTvCategories: vi.fn(),
    getLiveTvChannels: vi.fn(),
    getLiveTvChannelDetail: vi.fn(),
    getLiveTvChannelEpg: vi.fn(),
  },
}));

const mockChannelDetail = {
  id: '1562854',
  name: 'FR: CANAL+ LIVE 1 RAW',
  categoryId: 'cat-1',
  categoryName: 'FR | CANAL+',
  streamIcon: 'https://example.com/canal.png',
  streamUrl: '/api/streams/relay/1562854',
  epg: [
    {
      id: 'epg-1',
      title: 'Vivez en direct les évènements de CANAL+',
      description: 'Grand match en direct sur Canal+ Live',
      start: '2026-11-15 20:00:00',
      end: '2026-11-15 22:00:00',
      startTimestamp: 1794772800,
      stopTimestamp: 1794780000,
      isNowPlaying: true,
    },
    {
      id: 'epg-2',
      title: 'Canal Football Club - Débrief',
      description: 'Le grand débrief de la soirée foot',
      start: '2026-11-15 22:00:00',
      end: '2026-11-15 23:30:00',
      startTimestamp: 1794780000,
      stopTimestamp: 1794785400,
      isNowPlaying: false,
    },
  ],
};

describe('Step 3: LiveTvChannelPage Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders channel header, video player, and EPG listings', async () => {
    (api.getLiveTvChannelDetail as any).mockResolvedValue(mockChannelDetail);

    render(
      <MemoryRouter initialEntries={['/live-tv/1562854']}>
        <Routes>
          <Route path="/live-tv/:channelId" element={<LiveTvChannelPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FR: CANAL+ LIVE 1 RAW')).toBeInTheDocument();
      expect(screen.getByText('FR | CANAL+')).toBeInTheDocument();
      expect(screen.getByTestId('live-channel-player')).toBeInTheDocument();
      expect(screen.getByTestId('epg-section')).toBeInTheDocument();
      expect(screen.getByText('Vivez en direct les évènements de CANAL+')).toBeInTheDocument();
      expect(screen.getByText('Canal Football Club - Débrief')).toBeInTheDocument();
      expect(screen.getByText('Now Playing')).toBeInTheDocument();
    });
  });

  it('launches live stream when play button is clicked', async () => {
    (api.getLiveTvChannelDetail as any).mockResolvedValue(mockChannelDetail);

    render(
      <MemoryRouter initialEntries={['/live-tv/1562854']}>
        <Routes>
          <Route path="/live-tv/:channelId" element={<LiveTvChannelPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('channel-play-card')).toBeInTheDocument();
    });

    const playBtn = screen.getByLabelText('Play Live Stream');
    fireEvent.click(playBtn);

    // After play is clicked, the launch card overlay disappears and video player active
    await waitFor(() => {
      expect(screen.queryByTestId('channel-play-card')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Close Stream')).toBeInTheDocument();
    });
  });

  it('displays error state when channel cannot be loaded', async () => {
    (api.getLiveTvChannelDetail as any).mockRejectedValue(new Error('Channel not found'));

    render(
      <MemoryRouter initialEntries={['/live-tv/unknown-channel']}>
        <Routes>
          <Route path="/live-tv/:channelId" element={<LiveTvChannelPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Channel Not Available')).toBeInTheDocument();
      expect(screen.getByText('Back to Live TV')).toBeInTheDocument();
    });
  });
});
