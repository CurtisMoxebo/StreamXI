import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TopCompetitionsSidebar } from '../components/TopCompetitionsSidebar.js';
import { DateNavigator, StatusFilter } from '../components/DateNavigator.js';
import { MatchCard } from '../components/MatchCard.js';
import { api } from '../api/client.js';
import { Match, Competition } from '../types/index.js';
import { getCompetitionLogo } from '../utils/flags.js';

interface HomePageProps {
  searchQuery: string;
  onResetSearch: () => void;
}

interface GroupedMatches {
  competition: Competition;
  matches: Match[];
}

export const HomePage: React.FC<HomePageProps> = ({ searchQuery, onResetSearch }) => {
  const { t } = useTranslation();
  const [dateOffset, setDateOffset] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<GroupedMatches[]>([]);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Calculate current target date in YYYY-MM-DD
  const targetDateString = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().substring(0, 10);
  }, [dateOffset]);

  // Fetch matches when date changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getMatches(targetDateString)
      .then((data) => {
        if (isMounted) {
          setGroups(data.groups || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load matches:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetDateString]);

  // Handle date change with smooth filter animation
  const handleDateChange = (newOffset: number) => {
    setIsTransitioning(true);
    setDateOffset(newOffset);
    setTimeout(() => setIsTransitioning(false), 200);
  };

  // Trigger brief transition animation when search query or status filter changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, selectedCompetition]);

  // Match counts for status pills
  const matchCounts = useMemo(() => {
    const allMatches = groups.flatMap((g) => g.matches);
    return {
      all: allMatches.length,
      live: allMatches.filter((m) => m.status === 'live').length,
      upcoming: allMatches.filter((m) => m.status === 'upcoming').length,
      finished: allMatches.filter((m) => m.status === 'finished').length,
    };
  }, [groups]);

  // Filter groups based on search query, selected competition, and status filter
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return groups
      .map((group) => {
        const matchesComp = selectedCompetition === '' || 
          group.competition.name.toLowerCase().includes(selectedCompetition.toLowerCase());

        const filteredMatches = group.matches.filter((match) => {
          // Status filter
          if (statusFilter !== 'all' && match.status !== statusFilter) {
            return false;
          }

          // Search query filter (matches home team, away team, or competition)
          if (query) {
            const matchesHome = match.homeTeam.name.toLowerCase().includes(query);
            const matchesAway = match.awayTeam.name.toLowerCase().includes(query);
            const matchesCompetition = group.competition.name.toLowerCase().includes(query);
            return matchesHome || matchesAway || matchesCompetition;
          }

          return true;
        });

        return {
          ...group,
          matches: matchesComp ? filteredMatches : [],
        };
      })
      .filter((group) => group.matches.length > 0);
  }, [groups, searchQuery, statusFilter, selectedCompetition]);

  const totalVisibleMatches = filteredGroups.reduce((acc, g) => acc + g.matches.length, 0);

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
      
      {/* Persistent Left Sidebar: Top Competitions */}
      <TopCompetitionsSidebar
        onSelectCompetition={(keyword) => {
          setSelectedCompetition((prev) => (prev === keyword ? '' : keyword));
        }}
        selectedCompetition={selectedCompetition}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Top Date Navigator & Quick Status Tabs */}
        <DateNavigator
          currentDateOffset={dateOffset}
          onPrevDate={() => handleDateChange(dateOffset - 1)}
          onNextDate={() => handleDateChange(dateOffset + 1)}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          matchCounts={matchCounts}
        />

        {/* Matches Container with filter animation */}
        <div
          className={`space-y-6 transition-opacity duration-200 ${
            isTransitioning ? 'opacity-40' : 'opacity-100'
          }`}
          data-testid="matches-container"
        >
          {loading ? (
            <div className="bg-surface-850/80 rounded-2xl border border-surface-750 p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Loading football schedule...</p>
            </div>
          ) : totalVisibleMatches === 0 ? (
            /* No Results Empty State */
            <div className="bg-surface-850/80 rounded-2xl border border-surface-750/70 p-12 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface-800 flex items-center justify-center text-slate-400 text-2xl">
                🔍
              </div>
              <h3 className="text-lg font-bold text-white">{t('noResultsTitle')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t('noResultsDesc')}
              </p>
              <button
                onClick={() => {
                  onResetSearch();
                  setSelectedCompetition('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
              >
                {t('btnResetSearch')}
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section
                key={group.competition.id}
                className="bg-surface-850/70 rounded-2xl border border-surface-750/70 overflow-hidden shadow-lg"
              >
                {/* Competition Header */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-surface-800 via-surface-800/80 to-surface-850 border-b border-surface-750/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getCompetitionLogo(group.competition)}
                      alt={group.competition.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                    <div>
                      <h2 className="font-display font-bold text-base text-white tracking-wide">
                        {group.competition.name}
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        {group.competition.country}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20">
                    {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                {/* Match Cards List */}
                <div className="p-3 sm:p-4 space-y-3">
                  {group.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
