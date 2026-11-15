import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatchStreamInfo } from '../types/index.js';

interface VideoPlayerProps {
  streamInfo: MatchStreamInfo;
  activeChannelId?: string;
  onSelectChannel: (channelId: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamInfo,
  activeChannelId,
  onSelectChannel,
}) => {
  const { t } = useTranslation();

  const isEnded = streamInfo.status === 'ended';
  const isUpcoming = streamInfo.status === 'upcoming';
  const isReady = streamInfo.status === 'ready';

  const activeChannel = streamInfo.channels.find((c) => c.id === activeChannelId) || streamInfo.channels[0];

  return (
    <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 overflow-hidden shadow-2xl">
      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-black/95 flex items-center justify-center overflow-hidden">
        
        {/* State 1: Game Over */}
        {isEnded && (
          <div className="text-center p-8 space-y-3 z-10" data-testid="stream-ended">
            <div className="w-16 h-16 rounded-full bg-surface-800 border border-surface-700 mx-auto flex items-center justify-center text-slate-400 text-2xl shadow-inner">
              🏁
            </div>
            <h3 className="font-display font-bold text-xl text-white">
              {t('streamEnded')}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {streamInfo.statusMessage}
            </p>
          </div>
        )}

        {/* State 2: Game Upcoming (> 30 min) */}
        {isUpcoming && (
          <div className="text-center p-8 space-y-3 z-10" data-testid="stream-upcoming">
            <div className="w-16 h-16 rounded-full bg-surface-800 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 text-2xl shadow-lg shadow-amber-500/10">
              ⏳
            </div>
            <h3 className="font-display font-bold text-xl text-white">
              {t('streamUpcoming')}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Kickoff in approx. {streamInfo.minutesToKickoff} minutes. The broadcast relay will initialize automatically.
            </p>
          </div>
        )}

        {/* State 3: Live or < 30 min (Streamer ready) */}
        {isReady && (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-surface-900 via-surface-850 to-surface-900" data-testid="stream-ready">
            
            {/* Ambient Broadcast Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-brand-500/10 to-transparent pointer-events-none" />

            {/* Video Player Feed / Simulation */}
            <div className="text-center space-y-4 z-10 px-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <svg className="w-8 h-8 text-brand-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-accent-red border-2 border-surface-900" />
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  Xtream IPTV Live Feed
                </div>
                {activeChannel && (
                  <p className="text-sm font-semibold text-slate-200">
                    Transmitting: {activeChannel.flag} {activeChannel.name}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Multiplexed backend relay connected. Zero upstream buffer latency.
                </p>
              </div>
            </div>

            {/* Live Overlay watermark */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-surface-700/80 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
              <span className="font-mono font-bold tracking-wider">LIVE STREAM</span>
            </div>
          </div>
        )}

      </div>

      {/* Under Player: Channel Dropdown with Country Flags */}
      {isReady && streamInfo.channels.length > 0 && (
        <div className="p-4 bg-surface-800/80 border-t border-surface-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeWidth="2" />
              <polyline points="17 2 12 7 7 2" strokeWidth="2" />
            </svg>
            <span>{t('chooseBroadcast')}</span>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={activeChannel?.id}
              onChange={(e) => onSelectChannel(e.target.value)}
              aria-label="Select broadcast channel"
              className="w-full sm:w-72 px-3.5 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors shadow-inner cursor-pointer"
            >
              {streamInfo.channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.flag} {ch.name} ({ch.country})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
