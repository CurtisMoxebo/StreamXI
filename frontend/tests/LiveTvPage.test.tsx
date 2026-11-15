import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LiveTvPage } from '../src/pages/LiveTvPage.js';
import { api } from '../src/api/client.js';
import '../src/i18n/index.js';

vi.mock('../src/api/client.js', () => ({
  api: {
    getLiveTvCategories: vi.fn(),
    getLiveTvChannels: vi.fn(),
    getLiveTvChannelDetail: vi.fn(),
  },
}));

const mockCategories = [
  { id: 'cat-1', name: 'FR | SPORT & FOOT' },
  { id: 'cat-2', name: 'UK | SKY SPORTS' },
  { id: 'cat-3', name: 'ES | MOVISTAR LALIGA' },
];

const mockCategoryGroups = [
  {
    category: { id: 'cat-1', name: 'FR | SPORT & FOOT' },
    totalChannels: 2,
    channels: [
      { id: '101', name: 'FR: CANAL+ FOOT RAW', categoryId: 'cat-1', categoryName: 'FR | SPORT & FOOT', streamUrl: '/api/streams/relay/101' },
      { id: '102', name: 'FR: BEIN SPORTS 1 RAW', categoryId: 'cat-1', categoryName: 'FR | SPORT & FOOT', streamUrl: '/api/streams/relay/102' },
    ],
  },
  {
    category: { id: 'cat-2', name: 'UK | SKY SPORTS' },
    totalChannels: 2,
    channels: [
      { id: '201', name: 'UK: SKY SPORT MAIN EVENT', categoryId: 'cat-2', categoryName: 'UK | SKY SPORTS', streamUrl: '/api/streams/relay/201' },
      { id: '202', name: 'UK: TNT SPORTS 1', categoryId: 'cat-2', categoryName: 'UK | SKY SPORTS', streamUrl: '/api/streams/relay/202' },
    ],
  },
];

describe('Step 2: LiveTvPage Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getLiveTvCategories as any).mockResolvedValue(mockCategories);
    (api.getLiveTvChannels as any).mockResolvedValue({ totalGroups: 2, groups: mockCategoryGroups });
  });

  it('renders Live TV categories and channels grouped by category', async () => {
    render(
      <MemoryRouter initialEntries={['/live-tv']}>
        <Routes>
          <Route path="/live-tv" element={<LiveTvPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Live TV Channels')).toBeInTheDocument();
      expect(screen.getAllByText('FR | SPORT & FOOT').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('UK | SKY SPORTS').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('FR: CANAL+ FOOT RAW')).toBeInTheDocument();
      expect(screen.getByText('UK: SKY SPORT MAIN EVENT')).toBeInTheDocument();
    });
  });

  it('filters channels based on channel name search query', async () => {
    render(
      <MemoryRouter initialEntries={['/live-tv']}>
        <Routes>
          <Route path="/live-tv" element={<LiveTvPage searchQuery="CANAL+" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FR: CANAL+ FOOT RAW')).toBeInTheDocument();
      expect(screen.queryByText('UK: SKY SPORT MAIN EVENT')).not.toBeInTheDocument();
    });
  });

  it('filters channels based on category name search query', async () => {
    render(
      <MemoryRouter initialEntries={['/live-tv']}>
        <Routes>
          <Route path="/live-tv" element={<LiveTvPage searchQuery="SKY SPORTS" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('UK: SKY SPORT MAIN EVENT')).toBeInTheDocument();
      expect(screen.getByText('UK: TNT SPORTS 1')).toBeInTheDocument();
      expect(screen.queryByText('FR: CANAL+ FOOT RAW')).not.toBeInTheDocument();
    });
  });

  it('allows filtering by clicking category filter pill', async () => {
    render(
      <MemoryRouter initialEntries={['/live-tv']}>
        <Routes>
          <Route path="/live-tv" element={<LiveTvPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('UK | SKY SPORTS').length).toBeGreaterThanOrEqual(1);
    });

    // Click on UK | SKY SPORTS category pill button
    const ukPill = screen.getAllByText('UK | SKY SPORTS')[0];
    fireEvent.click(ukPill);

    await waitFor(() => {
      expect(screen.getByText('UK: SKY SPORT MAIN EVENT')).toBeInTheDocument();
      expect(screen.queryByText('FR: CANAL+ FOOT RAW')).not.toBeInTheDocument();
    });
  });
});
