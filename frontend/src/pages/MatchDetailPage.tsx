import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MatchHeader } from '../components/MatchHeader.js';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { LineupsTab } from '../components/tabs/LineupsTab.js';
import { StatsTab } from '../components/tabs/StatsTab.js';
import { AiInsightsTab } from '../components/tabs/AiInsightsTab.js';
import { api } from '../api/client.js';
import { Match, MatchStreamInfo } from '../types/index.js';

interface MatchDetailPageProps {
  // Optional custom renderer for testing or extensions
  renderTabContent?: (activeTab: 'lineups' | 'stats' | 'ai', match: Match) => React.ReactNode;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ renderTabContent }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const [match, setMatch] = useState<Match | null>(null);
  const [streamInfo, setStreamInfo] = useState<MatchStreamInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'lineups' | 'stats' | 'ai'>('lineups');

  const channelFromUrl = searchParams.get('channel');

  // Fetch match details and stream information
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    Promise.all([api.getMatchById(id), api.getMatchStreamInfo(id)])
      .then(([matchData, streamData]) => {
        setMatch(matchData);
        setStreamInfo(streamData);

        // If no channel in URL but ready stream has channels, set default to first channel in URL
        if (!channelFromUrl && streamData.channels.length > 0) {
          setSearchParams({ channel: streamData.channels[0].id }, { replace: true });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load match detail:', err);
        setLoading(false);
      });
  }, [id]);

  // Handle switching streaming channel & update URL query param
  const handleSelectChannel = (channelId: string) => {
    setSearchParams({ channel: channelId });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading match center & stream relay...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Match Not Found</h2>
        <p className="text-xs text-slate-400">The requested football match does not exist.</p>
      </div>
    );
  }

  const isLiveOrUpcoming = match.status === 'live' || match.status === 'upcoming';
  const activeChannelId = channelFromUrl || streamInfo?.activeChannelId;

  // Render lazy tabs
  const renderDefaultTab = () => {
    switch (activeTab) {
      case 'lineups':
        return <LineupsTab matchId={match.id} />;
      case 'stats':
        return <StatsTab matchId={match.id} />;
      case 'ai':
        return isLiveOrUpcoming ? (
          <AiInsightsTab matchId={match.id} />
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            AI insights are only available for live or upcoming matches.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Score & Match Details Header */}
      <MatchHeader match={match} />

      {/* 2. Video Player Section with Channel Dropdown */}
      {streamInfo && (
        <VideoPlayer
          streamInfo={streamInfo}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
        />
      )}

      {/* 3. Three Dedicated Tabs Navigation */}
      <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 p-2 sm:p-3 shadow-xl">
        <div className="flex items-center gap-2 border-b border-surface-750 pb-2">
          
          {/* Tab 1: Lineups (Loaded by default) */}
          <button
            onClick={() => setActiveTab('lineups')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'lineups'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
            }`}
            data-testid="tab-button-lineups"
          >
            📋 {t('tabLineups')}
          </button>

          {/* Tab 2: Stats & H2H (Loaded only when clicked) */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
            }`}
            data-testid="tab-button-stats"
          >
            📊 {t('tabStats')}
          </button>

          {/* Tab 3: AI Insights (Only if live or upcoming, loaded only when clicked) */}
          {isLiveOrUpcoming && (
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-brand-500 to-accent-cyan text-white shadow-md'
                  : 'text-accent-cyan/90 hover:text-accent-cyan hover:bg-surface-800'
              }`}
              data-testid="tab-button-ai"
            >
              ✨ {t('tabAiInsights')}
            </button>
          )}

        </div>

        {/* Tab Content Display Area */}
        <div className="p-2 sm:p-4 mt-2">
          {renderTabContent ? renderTabContent(activeTab, match) : renderDefaultTab()}
        </div>
      </div>

    </div>
  );
};
