import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mpegts from 'mpegts.js';
import { api } from '../api/client.js';
import { ChannelDetail, EpgProgram } from '../types/index.js';

export const LiveTvChannelPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { t } = useTranslation();

  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);

  // Load channel detail & EPG
  useEffect(() => {
    if (!channelId) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setStreamError(false);

    api.getLiveTvChannelDetail(channelId)
      .then((data) => {
        if (isCancelled) return;
        setChannel(data);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load channel details:', err);
        setError('Failed to load TV channel. It might be offline or unavailable.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [channelId]);

  const streamUrl = channel?.streamUrl || (channelId ? `/api/streams/relay/${channelId}` : '');

  const handleLaunchStream = () => {
    console.log(`[LiveTvPlayer] Launching live broadcast for channel ${channelId} (${channel?.name}) -> URL: ${streamUrl}`);
    setStreamError(false);
    setIsConnecting(true);
    setIsPlaying(true);
  };

  const handleStopStream = () => {
    console.log('[LiveTvPlayer] Stopping channel stream playback');
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (e) {
        console.warn('[LiveTvPlayer] Error destroying player:', e);
      }
      playerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setIsPlaying(false);
    setIsConnecting(false);
    setStreamError(false);
  };

  // MPEG-TS Playback Effect
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !streamUrl) return;

    const fullStreamUrl = streamUrl.startsWith('http')
      ? streamUrl
      : `${window.location.origin}${streamUrl}`;

    console.log('[LiveTvPlayer] Connecting to live broadcast relay:', fullStreamUrl);

    // Clean up existing player
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch (e) {
        console.warn('[LiveTvPlayer] Error cleaning existing player:', e);
      }
      playerRef.current = null;
    }

    let isCancelled = false;

    if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
      try {
        const player = mpegts.createPlayer(
          {
            type: 'mpegts',
            isLive: true,
            url: fullStreamUrl,
          },
          {
            enableWorker: false, // Disabling worker ensures reliable operation without blob worker issues
            lazyLoad: false,
            autoCleanupSourceBuffer: true,
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 3.0,
            liveBufferLatencyMinRemain: 0.8,
          }
        );

        playerRef.current = player;
        player.attachMediaElement(videoRef.current);
        player.load();

        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!isCancelled) setIsConnecting(false);
            })
            .catch((err: any) => {
              console.warn('[mpegts] Autoplay prevented with sound, muting video:', err);
              if (videoRef.current && !isCancelled) {
                videoRef.current.muted = true;
                player.play()?.catch((e) => {
                  console.error('[mpegts] Muted playback failed:', e);
                  if (!isCancelled) setStreamError(true);
                });
                setIsConnecting(false);
              }
            });
        }

        player.on(mpegts.Events.ERROR, (errorType: string, errorDetail: string) => {
          console.error('[mpegts] Live TV Stream error:', errorType, errorDetail);
          if (!isCancelled) {
            setStreamError(true);
            setIsConnecting(false);
          }
        });

        player.on(mpegts.Events.MEDIA_INFO, () => {
          if (!isCancelled) setIsConnecting(false);
        });
      } catch (err: any) {
        console.error('Failed to create mpegts player, falling back to direct video:', err);
        if (videoRef.current && !isCancelled) {
          videoRef.current.src = fullStreamUrl;
          try {
            videoRef.current.play?.()?.catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play?.()?.catch(() => {});
              }
            });
          } catch {
            // Ignored in test environment
          }
          setIsConnecting(false);
        }
      }
    } else {
      // Native TS playback fallback (e.g. Safari)
      if (videoRef.current && !isCancelled) {
        videoRef.current.src = fullStreamUrl;
        try {
          videoRef.current.play?.()?.catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play?.()?.catch(() => {});
            }
          });
        } catch {
          // Ignored in test environment
        }
        setIsConnecting(false);
      }
    }

    return () => {
      isCancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
        } catch (e) {
          console.warn('[LiveTvPlayer] Error destroying player on unmount:', e);
        }
        playerRef.current = null;
      }
    };
  }, [isPlaying, streamUrl]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Connecting to channel center & program guide...</p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-surface-850 border border-surface-700 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center mx-auto text-xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-white">Channel Not Available</h2>
        <p className="text-xs text-slate-300">{error || 'The requested channel does not exist.'}</p>
        <Link
          to="/live-tv"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <span>←</span>
          <span>{t('backToLiveTv')}</span>
        </Link>
      </div>
    );
  }

  // Find currently active program or fallback to first
  const currentProgram = channel.epg.find((p) => p.isNowPlaying) || channel.epg[0];
  const upcomingPrograms = channel.epg.filter((p) => p !== currentProgram);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Channel Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-850/90 border border-surface-750/80 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/live-tv"
            className="p-2 bg-surface-800 hover:bg-surface-750 text-slate-300 hover:text-white rounded-xl border border-surface-700 transition-colors cursor-pointer"
            title={t('backToLiveTv')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          {/* Channel Logo */}
          <div className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center overflow-hidden p-1 flex-shrink-0 shadow-inner">
            {channel.streamIcon ? (
              <img
                src={channel.streamIcon}
                alt={channel.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl">📺</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-400 border border-brand-500/25">
                {channel.categoryName}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>
            <h1 className="font-display font-extrabold text-lg sm:text-xl text-white mt-1">
              {channel.name}
            </h1>
          </div>
        </div>

        {/* Back Link Button */}
        <div>
          <Link
            to="/live-tv"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 transition-colors"
          >
            <span>{t('backToLiveTv')}</span>
          </Link>
        </div>
      </div>

      {/* 2. Live Video Player (Multiplexed MPEG-TS) */}
      <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 overflow-hidden shadow-2xl">
        <div className="relative aspect-video w-full bg-black/95 flex items-center justify-center overflow-hidden" data-testid="live-channel-player">
          {/* Persistent HTML5 Video Element */}
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className={`w-full h-full object-contain ${isPlaying ? 'block' : 'hidden'}`}
            onError={() => {
              setStreamError(true);
              setIsConnecting(false);
            }}
          />

          {/* Launch Card Overlay (when not playing) */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-surface-900 via-surface-850 to-surface-900 cursor-pointer group z-10"
              onClick={handleLaunchStream}
              data-testid="channel-play-card"
            >
              <div className="absolute inset-0 bg-radial-gradient from-brand-500/10 to-transparent pointer-events-none group-hover:from-brand-500/20 transition-all" />

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
                    Live Multiplexed Broadcaster
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Ready to stream: {channel.name}
                  </p>
                  <p className="text-xs text-brand-400/90 font-medium mt-1">
                    Click to launch live TV broadcast
                  </p>
                </div>
              </div>

              {/* Watermark badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-surface-700/80 text-xs text-white pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                <span className="font-mono font-bold tracking-wider">LIVE TV</span>
              </div>
            </div>
          )}

          {/* Connecting Spinner Overlay */}
          {isPlaying && isConnecting && !streamError && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-15 pointer-events-none">
              <div className="w-10 h-10 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-white tracking-wide">Connecting to Live Channel Relay...</p>
            </div>
          )}

          {/* Stream Error Notification */}
          {streamError && (
            <div className="absolute inset-0 bg-surface-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-14 h-14 rounded-full bg-accent-red/20 border border-accent-red/40 flex items-center justify-center text-accent-red text-2xl shadow-lg">
                ⚠️
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">Broadcast Stream Unavailable</h4>
                <p className="text-xs text-slate-300 max-w-sm mt-1">
                  The upstream broadcast for <span className="font-semibold text-white">{channel.name}</span> could not be reached or is temporarily offline.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleStopStream();
                    setTimeout(() => handleLaunchStream(), 50);
                  }}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Retry Broadcast</span>
                </button>
                <button
                  onClick={handleStopStream}
                  className="px-3.5 py-2 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-surface-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Playing Controls: Live Badge & Stop Button */}
          {isPlaying && (
            <>
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-surface-700/80 text-xs text-white pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                <span className="font-mono font-bold tracking-wider">LIVE TV</span>
              </div>

              <button
                onClick={handleStopStream}
                className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-surface-900/80 hover:bg-surface-800 border border-surface-700 text-xs text-slate-300 hover:text-white rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
                aria-label="Close Stream"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Electronic Program Guide (EPG) Section Under Player */}
      <div className="bg-surface-850/90 rounded-2xl border border-surface-750/80 p-5 sm:p-6 shadow-xl space-y-5" data-testid="epg-section">
        <div className="flex items-center justify-between border-b border-surface-750 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white">
                {t('upcomingSchedule')}
              </h2>
              <p className="text-xs text-slate-400">
                Live TV schedule and program guide
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-800 border border-surface-700 text-slate-300">
            {channel.epg.length} Listings
          </span>
        </div>

        {/* Current Program Card */}
        {currentProgram && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-500/15 via-surface-800 to-surface-800 border border-brand-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500 text-surface-950">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-950 animate-ping" />
                {t('nowPlaying')}
              </span>
              <span className="text-xs font-mono font-semibold text-brand-300">
                {currentProgram.start ? currentProgram.start.slice(11, 16) : 'Now'} - {currentProgram.end ? currentProgram.end.slice(11, 16) : 'Later'}
              </span>
            </div>

            <h3 className="font-display font-bold text-base sm:text-lg text-white">
              {currentProgram.title}
            </h3>

            {currentProgram.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentProgram.description}
              </p>
            )}
          </div>
        )}

        {/* Upcoming Programs List */}
        {upcomingPrograms.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Upcoming Schedule
            </h4>

            <div className="divide-y divide-surface-750/70 border border-surface-750 rounded-xl overflow-hidden bg-surface-900/60">
              {upcomingPrograms.map((prog, idx) => (
                <div
                  key={prog.id || idx}
                  className="p-3.5 hover:bg-surface-800/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs sm:text-sm font-semibold text-slate-200">
                      {prog.title}
                    </h5>
                    {prog.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {prog.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className="text-xs font-mono font-medium text-slate-400 px-2 py-0.5 rounded bg-surface-800 border border-surface-700">
                      {prog.start ? prog.start.slice(11, 16) : ''} - {prog.end ? prog.end.slice(11, 16) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !currentProgram && (
            <div className="text-center py-8 text-xs text-slate-400">
              {t('noEpgAvailable')}
            </div>
          )
        )}
      </div>

    </div>
  );
};
