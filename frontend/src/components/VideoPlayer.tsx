import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import mpegts from 'mpegts.js';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isEnded = streamInfo.status === 'ended';
  const isUpcoming = streamInfo.status === 'upcoming';
  const isReady = streamInfo.status === 'ready';

  const activeChannel = streamInfo.channels.find((c) => c.id === activeChannelId) || streamInfo.channels[0];

  // Reset stream error when switching channels
  useEffect(() => {
    setStreamError(false);
  }, [activeChannelId]);

  const currentVideoSrc = activeChannel?.streamUrl;

  const handleLaunchStream = () => {
    setIsPlaying(true);
    setStreamError(false);
  };

  // Play real live IPTV MPEG-TS broadcast using mpegts.js (or native browser video for Safari)
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !currentVideoSrc) return;

    let player: mpegts.Player | null = null;

    if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
      try {
        player = mpegts.createPlayer(
          {
            type: 'mpegts',
            isLive: true,
            url: currentVideoSrc,
          },
          {
            enableWorker: true,
            lazyLoad: false,
            autoCleanupSourceBuffer: true,
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 3.0,
            liveBufferLatencyMinRemain: 0.8,
          }
        );

        player.attachMediaElement(videoRef.current);
        player.load();

        player.play()?.catch((err: any) => {
          console.warn('[mpegts] Autoplay prevented by browser, attempting muted playback:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            player?.play()?.catch((e) => {
              console.error('[mpegts] Playback failed:', e);
            });
          }
        });

        player.on(mpegts.Events.ERROR, (errorType: string, errorDetail: string) => {
          console.error('[mpegts] Player Error for channel:', activeChannel?.name, errorType, errorDetail);
          setStreamError(true);
        });
      } catch (err: any) {
        console.error('Failed to initialize mpegts player:', err);
        setStreamError(true);
      }
    } else {
      // Native browser video playback (e.g. Safari HLS/TS)
      videoRef.current.src = currentVideoSrc;
      try {
        videoRef.current.play?.()?.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play?.()?.catch(() => {});
          }
        });
      } catch {
        // Ignored
      }
    }

    return () => {
      if (player) {
        try {
          player.pause();
          player.unload();
          player.detachMediaElement();
          player.destroy();
        } catch (e) {
          console.warn('Error destroying mpegts player:', e);
        }
      }
    };
  }, [isPlaying, currentVideoSrc]);

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

        {/* State 3: Live or Ready (Streamer ready) */}
        {isReady && (
          isPlaying ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black" data-testid="stream-ready">
              <video
                ref={videoRef}
                key={activeChannel?.id || currentVideoSrc}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onError={() => {
                  setStreamError(true);
                }}
              />

              {/* Upstream Unavailable Notification */}
              {streamError && (
                <div className="absolute inset-0 bg-surface-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                  <div className="w-14 h-14 rounded-full bg-accent-red/20 border border-accent-red/40 flex items-center justify-center text-accent-red text-2xl shadow-lg">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">Live Broadcast Unavailable</h4>
                    <p className="text-xs text-slate-300 max-w-sm mt-1">
                      The upstream broadcast for <span className="font-semibold text-white">{activeChannel?.name}</span> could not be reached or is currently offline.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setStreamError(false);
                        setIsPlaying(false);
                        setTimeout(() => setIsPlaying(true), 50);
                      }}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Retry Broadcast</span>
                    </button>
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="px-3.5 py-2 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-surface-700 transition-all cursor-pointer"
                    >
                      Back to Channels
                    </button>
                  </div>
                </div>
              )}

              {/* Live Overlay watermark */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-surface-700/80 text-xs text-white pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                <span className="font-mono font-bold tracking-wider">LIVE STREAM</span>
              </div>

              {/* Stop / Close Stream Button */}
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-surface-900/80 hover:bg-surface-800 border border-surface-700 text-xs text-slate-300 hover:text-white rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
                aria-label="Close Stream"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </div>
          ) : (
            <div
              className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-surface-900 via-surface-850 to-surface-900 cursor-pointer group"
              onClick={handleLaunchStream}
              data-testid="stream-ready"
            >
              {/* Ambient Broadcast Glow */}
              <div className="absolute inset-0 bg-radial-gradient from-brand-500/10 to-transparent pointer-events-none group-hover:from-brand-500/20 transition-all" />

              {/* Video Player Feed Launch Card */}
              <div className="text-center space-y-4 z-10 px-4">
                <div className="relative inline-flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchStream();
                    }}
                    aria-label="Play Live Stream"
                    className="w-20 h-20 rounded-full bg-brand-500/20 group-hover:bg-brand-500/30 border-2 border-brand-400 group-hover:border-brand-300 flex items-center justify-center shadow-xl shadow-brand-500/20 group-hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <svg className="w-8 h-8 text-brand-400 group-hover:text-white transition-colors ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
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
                      Ready: {activeChannel.flag} {activeChannel.name}
                    </p>
                  )}
                  <p className="text-xs text-brand-400/90 font-medium mt-1">
                    Click to launch live broadcast
                  </p>
                </div>
              </div>

              {/* Live Overlay watermark */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-surface-700/80 text-xs text-white pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                <span className="font-mono font-bold tracking-wider">LIVE STREAM</span>
              </div>
            </div>
          )
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
              onChange={(e) => {
                onSelectChannel(e.target.value);
                setIsPlaying(true);
              }}
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
