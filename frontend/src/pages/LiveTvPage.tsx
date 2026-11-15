import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { LiveTvCategory, LiveTvCategoryGroup, LiveTvChannel } from '../types/index.js';

interface LiveTvPageProps {
  searchQuery?: string;
  onResetSearch?: () => void;
}

export const LiveTvPage: React.FC<LiveTvPageProps> = ({
  searchQuery = '',
  onResetSearch,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categoryGroups, setCategoryGroups] = useState<LiveTvCategoryGroup[]>([]);
  const [categories, setCategories] = useState<LiveTvCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded categories state (default all open or open on search)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    Promise.all([
      api.getLiveTvCategories(),
      api.getLiveTvChannels({ limit: 40 }),
    ])
      .then(([catList, channelData]) => {
        if (isCancelled) return;
        setCategories(catList);
        setCategoryGroups(channelData.groups || []);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load Live TV channels:', err);
        setError('Failed to load live TV channels. Please try again.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Filter groups and channels based on search query (channel name OR category name) and selected category
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return categoryGroups
      .map((group) => {
        // 1. Category ID filter
        if (selectedCategoryId !== 'all' && group.category.id !== selectedCategoryId) {
          return null;
        }

        // 2. Search query filter (matches channel name OR category name)
        if (!q) {
          return group;
        }

        const categoryMatches = group.category.name.toLowerCase().includes(q);
        if (categoryMatches) {
          return group; // Category name matches -> include all channels
        }

        // Otherwise filter channels inside the category
        const matchingChannels = group.channels.filter((ch) =>
          ch.name.toLowerCase().includes(q)
        );

        if (matchingChannels.length === 0) {
          return null;
        }

        return {
          ...group,
          channels: matchingChannels,
          totalChannels: matchingChannels.length,
        };
      })
      .filter((g): g is LiveTvCategoryGroup => g !== null && g.channels.length > 0);
  }, [categoryGroups, searchQuery, selectedCategoryId]);

  const totalVisibleChannels = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.channels.length, 0);
  }, [filteredGroups]);

  const handleChannelClick = (channel: LiveTvChannel) => {
    navigate(`/live-tv/${channel.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="font-display font-semibold text-base text-slate-200">Loading Live TV Channels...</h3>
        <p className="text-xs text-slate-400 mt-1">Retrieving channel categories and streams</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface-850 border border-surface-700/80 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center mx-auto text-xl">
          ⚠️
        </div>
        <h3 className="font-display font-bold text-lg text-white">Live TV Unavailable</h3>
        <p className="text-xs text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-850 via-surface-900 to-surface-850 rounded-2xl border border-surface-750 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live IPTV Broadcast
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            {t('liveTvTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {t('liveTvSubtitle')}
          </p>
        </div>

        {/* Total Channels Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-surface-800/90 border border-surface-700 rounded-xl text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
            <span className="font-display font-bold text-lg text-brand-400">{totalVisibleChannels} Channels</span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter by Category
          </span>
          {selectedCategoryId !== 'all' && (
            <button
              onClick={() => setSelectedCategoryId('all')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-surface-700">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-surface-800 text-slate-300 hover:text-white hover:bg-surface-750 border border-surface-700/60'
            }`}
          >
            {t('allCategories')} ({categoryGroups.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-500 text-white font-semibold shadow-md'
                    : 'bg-surface-800 text-slate-300 hover:text-white hover:bg-surface-750 border border-surface-700/60'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Search Filter Banner if search query active */}
      {searchQuery && (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-semibold text-brand-400">Search Filter:</span>
            <span>Showing channels or categories matching &ldquo;<span className="text-white font-bold">{searchQuery}</span>&rdquo;</span>
            <span className="text-slate-400">({totalVisibleChannels} results)</span>
          </div>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white rounded-lg font-semibold cursor-pointer transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Channels Grouped by Category */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-surface-850/60 rounded-2xl border border-surface-750/70 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-800 border border-surface-700 mx-auto flex items-center justify-center text-slate-400 text-2xl shadow-inner">
            📺
          </div>
          <h3 className="font-display font-bold text-xl text-white">
            {t('noChannelsFound')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {t('noChannelsDesc')}
          </p>
          {(searchQuery || selectedCategoryId !== 'all') && (
            <div className="pt-2">
              <button
                onClick={() => {
                  if (onResetSearch) onResetSearch();
                  setSelectedCategoryId('all');
                }}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedCategories[group.category.id];

            return (
              <section
                key={group.category.id}
                className="bg-surface-850/90 rounded-2xl border border-surface-750/80 overflow-hidden shadow-xl"
              >
                {/* Category Header (collapsible) */}
                <div
                  onClick={() => toggleCategoryCollapse(group.category.id)}
                  className="p-4 sm:px-6 bg-surface-800/80 border-b border-surface-750/80 flex items-center justify-between cursor-pointer hover:bg-surface-800 transition-colors select-none"
                  data-testid={`category-header-${group.category.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                      📺
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sm sm:text-base text-white">
                        {group.category.name}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-900 border border-surface-700 text-slate-300">
                      {group.channels.length} Channels
                    </span>
                    <button
                      type="button"
                      aria-label="Toggle Category"
                      className="text-slate-400 hover:text-white"
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Channels Grid */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {group.channels.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => handleChannelClick(ch)}
                        className="group relative bg-surface-900/90 hover:bg-surface-800/95 border border-surface-750/70 hover:border-brand-500/50 rounded-xl p-3.5 transition-all shadow-md hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer flex items-center gap-3.5"
                        data-testid={`channel-card-${ch.id}`}
                      >
                        {/* Channel Icon or Fallback */}
                        <div className="w-11 h-11 rounded-lg bg-surface-800 border border-surface-700 flex-shrink-0 flex items-center justify-center overflow-hidden p-1 group-hover:scale-105 transition-transform">
                          {ch.streamIcon ? (
                            <img
                              src={ch.streamIcon}
                              alt={ch.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-sm">📺</span>
                          )}
                        </div>

                        {/* Channel Name & Category */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-300 truncate transition-colors">
                            {ch.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ch.categoryName}
                          </p>
                        </div>

                        {/* Play Arrow Icon */}
                        <div className="w-8 h-8 rounded-full bg-surface-800 group-hover:bg-brand-500 text-slate-400 group-hover:text-surface-950 flex-shrink-0 flex items-center justify-center transition-all shadow-inner">
                          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

    </div>
  );
};
