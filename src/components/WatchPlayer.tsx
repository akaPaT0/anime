'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';

interface WatchPlayerProps {
  animeId: number;
  title: string;
  episode: number;
  totalEpisodes: number;
  initialDub: boolean;
  malId: number | null;
  tmdbId: string | null;
  isMovie: boolean;
  routeId: string;
}

export default function WatchPlayer({
  animeId,
  title,
  episode,
  totalEpisodes,
  initialDub,
  malId,
  routeId,
}: WatchPlayerProps) {
  const [isDub, setIsDub] = useState(initialDub);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Native HTML5 Video States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch the raw stream URL from our API route
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStreamUrl(null);

    // Destroy existing HLS instance on track changes
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const subOrDubState = isDub ? 'dub' : 'sub';
    fetch(`/api/stream?anilistId=${animeId}&episodeNumber=${episode}&subOrDub=${subOrDubState}`, {
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Failed to resolve raw streaming links');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data.proxyUrl || data.url) {
          // Prefer proxyUrl to bypass CORS and referer constraints on client side
          setStreamUrl(data.proxyUrl || data.url);
          setLoading(false);
        } else {
          throw new Error('No valid streams returned from API');
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (!active) return;
        console.error('[WatchPlayer] Extraction failed:', err);
        if (err.name === 'AbortError') {
          setError('Extraction timed out. The scraping process took longer than 10 seconds.');
        } else {
          setError('Failed to extract streaming source. The server might be down or rate-limited.');
        }
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [animeId, episode, isDub, retryCount]);

  // 2. Bind HLS.js to the video tag
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // Limit buffer size to prevent memory warnings
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[WatchPlayer] HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[WatchPlayer] HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[WatchPlayer] Fatal HLS error:', data);
              setError('Playback error. Attempting to recover...');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS support
      video.src = streamUrl;
    } else {
      setError('HLS streaming is not supported on this browser.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Handle auto-fade of controls on mouse idle
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Native Control Actions
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(console.error);
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleDurationChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = Number(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = Number(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      video.volume = 0;
    } else {
      video.volume = volume || 0.5;
    }
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
    resetControlsTimeout();
  };

  // Sync fullscreen state if changed via browser default controls/escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episode < totalEpisodes ? episode + 1 : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Native Video Player Container ── */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 shadow-lg group"
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 z-30 gap-3">
            <svg className="animate-spin h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-neutral-100 text-sm font-semibold tracking-wider">Extracting Stream...</span>
          </div>
        )}

        {/* Error Boundaries Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 z-30 px-6 text-center gap-4">
            <svg className="w-12 h-12 text-orange-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-100 font-bold text-lg">Extraction Failure</span>
              <span className="text-neutral-400 text-sm max-w-md">{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 bg-orange-500 text-neutral-100 rounded-md font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
              </svg>
              Retry Connection
            </button>
          </div>
        )}

        {/* The Native HTML5 Video Element */}
        <video
          ref={videoRef}
          onClick={handlePlayPause}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
        />

        {/* Custom Video Controls Overlay */}
        {!loading && !error && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950/95 via-neutral-900/80 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-20 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Seeker Progress Timeline */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-neutral-100 text-xs font-mono">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 rounded-lg bg-neutral-700 appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600 transition-colors"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #404040 ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #404040 100%)`
                }}
              />
              <span className="text-neutral-100 text-xs font-mono">{formatTime(duration)}</span>
            </div>

            {/* Bottom Row Control Buttons */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {/* Play / Pause button */}
                <button
                  onClick={handlePlayPause}
                  className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-neutral-100 active:scale-95 transition-transform duration-100 shadow"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Volume Controls */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-neutral-100 hover:text-teal-400 transition-colors">
                    {isMuted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 rounded bg-neutral-700 appearance-none cursor-pointer accent-teal-400"
                  />
                </div>
              </div>

              {/* Server indicator / Title indicator & Fullscreen */}
              <div className="flex items-center gap-4">
                <span className="text-teal-400 text-xs font-semibold px-2 py-1 bg-teal-950/55 rounded border border-teal-900/50">
                  HLS Mode
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="text-neutral-100 hover:text-teal-400 transition-colors p-1"
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Title block + Sub/Dub Toggle ── */}
      <div className="flex flex-col gap-3 bg-neutral-900/50 backdrop-blur border border-neutral-800 p-5 rounded-lg">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-neutral-100 inline">
              {title}
            </h1>
            <span className="text-lg text-neutral-400 ml-2">
              — Episode {episode}
            </span>
          </div>

          {/* Sub/Dub Quick Toggle */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-md border border-neutral-800">
            <button
              onClick={() => setIsDub(false)}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all duration-200 ${
                !isDub
                  ? 'bg-orange-500 text-neutral-100 shadow'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              SUB
            </button>
            <button
              onClick={() => setIsDub(true)}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all duration-200 ${
                isDub
                  ? 'bg-orange-500 text-neutral-100 shadow'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              DUB
            </button>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-3 border-t border-neutral-800/80 pt-4">
          {prevEp ? (
            <Link
              href={`/watch/${animeId}/${prevEp}?dub=${isDub}`}
              className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-100 border border-neutral-800 rounded-md text-sm font-semibold transition-all"
            >
              ← Prev Episode
            </Link>
          ) : (
            <span className="px-4 py-2 bg-neutral-900/30 text-neutral-500 border border-neutral-900/30 rounded-md text-sm font-semibold cursor-not-allowed">
              ← Prev Episode
            </span>
          )}

          {nextEp ? (
            <Link
              href={`/watch/${animeId}/${nextEp}?dub=${isDub}`}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-neutral-100 rounded-md text-sm font-bold shadow transition-all active:scale-95"
            >
              Next Episode →
            </Link>
          ) : (
            <span className="px-5 py-2 bg-neutral-900/30 text-neutral-500 border border-neutral-900/30 rounded-md text-sm font-bold cursor-not-allowed">
              Next Episode →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
