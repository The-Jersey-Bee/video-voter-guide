
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX,
  HelpCircle, Share2, ChevronUp,
  ExternalLink, Check, Info, Loader2
} from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { VideoSlideProps } from './types';

export const VideoSlide: React.FC<VideoSlideProps> = ({
  candidate, clip, isActive, isMuted, onToggleMute, onToggleQuestion, onOpenShare, onClose, index, total, question, parentUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isEndedIdle, setIsEndedIdle] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const hasTrackedPlay = useRef(false);
  const trackedMilestones = useRef<Set<number>>(new Set());

  // Track video play event
  const trackVideoPlay = useCallback(() => {
    if (!hasTrackedPlay.current && clip) {
      hasTrackedPlay.current = true;
      analytics.videoPlay(candidate.id, candidate.name, question.id);
    }
  }, [candidate.id, candidate.name, question.id, clip]);

  // Track video progress milestones
  const trackVideoProgress = useCallback((currentTime: number, duration: number) => {
    if (!duration || !clip) return;

    const percent = (currentTime / duration) * 100;
    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (percent >= milestone && !trackedMilestones.current.has(milestone)) {
        trackedMilestones.current.add(milestone);
        analytics.videoProgress(candidate.id, question.id, milestone);
      }
    }
  }, [candidate.id, question.id, clip]);

  const handleShare = useCallback(async () => {
    // Track share click
    analytics.shareClick(candidate.id, question.id);
    // Use parent URL if embedded, otherwise use current window location
    const baseUrl = parentUrl
      ? parentUrl.split('#')[0]  // Remove any existing hash from parent URL
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}#q=${question.slug}&cand=${candidate.slug}`;
    const shareData = { url };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        // Clipboard also failed, use prompt fallback
        window.prompt('Copy this link:', url);
      }
    };

    // Web Share API requires secure context and permissions (allow="web-share" in iframe)
    const canShare = navigator.share &&
                     window.isSecureContext &&
                     (!navigator.canShare || navigator.canShare(shareData));

    if (canShare) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // If user cancelled (AbortError), do nothing
        // For any other error, fall back to clipboard
        if (err?.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  }, [question, candidate, parentUrl]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    setIsEndedIdle(false);
  }, []);

  useEffect(() => {
    if (isActive && videoRef.current) {
      // Reset tracking state for new video view
      hasTrackedPlay.current = false;
      trackedMilestones.current.clear();

      setIsBuffering(true);
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
      setIsPlaying(true);
      resetControlsTimeout();
      resetIdleTimeout();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }

    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    };
  }, [isActive, resetControlsTimeout, resetIdleTimeout]);

  const toggleControls = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    resetIdleTimeout();
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
      setIsPlaying(!isPlaying);
    }
    resetControlsTimeout();
  };

  const handleVideoEnded = () => {
    // Auto-replay the video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  if (!clip || !clip.video_src) {
    return (
      <div className="w-full h-full flex-shrink-0 relative bg-brand-secondary-dark flex flex-col items-center justify-center text-white p-8 text-center">
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 p-5 z-20 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start">
          <div className="flex flex-col">
            <h4 className="text-white font-display font-black text-xl leading-tight">{candidate.name}</h4>
            <span className="text-white/70 text-sm font-medium uppercase tracking-widest">{index + 1} of {total} candidates</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2.5 bg-brand-white/10 backdrop-blur-xl rounded-full text-white pointer-events-auto hover:bg-brand-white/20 transition-colors"
            aria-label="Close player"
          >
            <X size={24} />
          </button>
        </div>

        {/* Centered message */}
        <div className="flex flex-col items-center">
          <div className="bg-brand-white/10 p-4 rounded-full mb-4">
            <Info size={32} />
          </div>
          <p className="font-display font-bold text-lg">Video unavailable due to technical error.</p>
        </div>

        {/* Navigation hint */}
        {index < total - 1 && (
          <div className="absolute bottom-28 inset-x-0 flex flex-col items-center pointer-events-none gap-2 animate-in fade-in duration-500">
            <div className="flex flex-col items-center opacity-60 animate-bounce">
              <ChevronUp size={24} className="text-white" />
              <span className="text-[10px] text-white font-display font-black tracking-widest uppercase md:hidden">Swipe for Next</span>
              <span className="text-[10px] text-white font-display font-black tracking-widest uppercase hidden md:block">Next Candidate</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isLastCandidate = index === total - 1;
  const showSwipeHint = isActive && !isLastCandidate && (showControls || isEndedIdle);

  return (
    <div className="w-full h-full flex-shrink-0 relative overflow-hidden flex flex-col bg-black">
      {/* Top Header Controls */}
      <div className={`absolute top-0 inset-x-0 p-5 z-20 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col">
          <h4 className="text-white font-display font-black text-xl leading-tight">{candidate.name}</h4>
          <span className="text-white/70 text-sm font-medium uppercase tracking-widest">{index + 1} of {total} candidates</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2.5 bg-brand-white/10 backdrop-blur-xl rounded-full text-white pointer-events-auto hover:bg-brand-white/20 transition-colors"
          aria-label="Close player"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center relative cursor-pointer" onClick={toggleControls}>
        <video
          ref={videoRef}
          src={clip.video_src}
          poster={clip.poster_src}
          className="w-full h-full object-cover"
          playsInline
          muted={isMuted}
          onTimeUpdate={(e) => {
            const time = e.currentTarget.currentTime;
            const dur = e.currentTarget.duration;
            setCurrentTime(time);
            trackVideoProgress(time, dur);
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={handleVideoEnded}
          onPlay={() => {
            setIsPlaying(true);
            trackVideoPlay();
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onPlaying={() => setIsBuffering(false)}
        >
          {clip.captions_vtt_src && (
            <track label="English" kind="captions" srcLang="en" src={clip.captions_vtt_src} default />
          )}
        </video>

        {/* Loading Spinner */}
        {isBuffering && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-full">
              <Loader2 size={48} className="text-white animate-spin" />
            </div>
          </div>
        )}

        {/* Play/Pause Center Button Overlay */}
        {(!isPlaying || showControls) && !isBuffering && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={handlePlayPause}
              className="bg-brand-white/20 backdrop-blur-md p-8 rounded-full border border-brand-white/30 pointer-events-auto hover:bg-brand-white/30 transition-all scale-90 active:scale-75"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause size={48} className="text-white fill-white" /> : <Play size={48} className="text-white fill-white ml-1.5" />}
            </button>
          </div>
        )}

        {/* Swipe Hint Overlay */}
        {showSwipeHint && (
          <div className="absolute bottom-28 inset-x-0 flex flex-col items-center pointer-events-none gap-2 md:hidden animate-in fade-in duration-500">
            <div className="flex flex-col items-center opacity-60 animate-bounce">
                <ChevronUp size={24} className="text-white" />
                <span className="text-[10px] text-white font-display font-black tracking-widest uppercase">Swipe for Next</span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 inset-x-0 p-6 z-20 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="mb-5 px-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setCurrentTime(time);
              if (videoRef.current) videoRef.current.currentTime = time;
              resetControlsTimeout();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-1.5 bg-brand-white/20 rounded-full appearance-none cursor-pointer accent-brand-primary hover:accent-brand-primary-light transition-all"
            aria-label="Seek video"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={handlePlayPause} className="text-white hover:text-brand-primary transition-colors pointer-events-auto" aria-label={isPlaying ? 'Pause video' : 'Play video'}>
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime -= 10; resetControlsTimeout(); }} className="text-white hover:text-brand-primary transition-colors pointer-events-auto" aria-label="Rewind 10 seconds">
              <RotateCcw size={28} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleMute(); resetControlsTimeout(); }} className="text-white hover:text-brand-primary transition-colors pointer-events-auto" aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleQuestion(); }}
              className="p-2 rounded-xl text-white hover:bg-brand-white/10 transition-all pointer-events-auto"
              aria-label="Show question"
            >
              <HelpCircle size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="text-white hover:text-brand-primary transition-colors pointer-events-auto relative"
              aria-label="Share this video"
            >
              {showCopied ? <Check size={26} className="text-green-400" /> : <Share2 size={26} />}
            </button>
          </div>
        </div>

        {candidate.longform_url && (
          <div className="mt-6 flex justify-center">
            <a
              href={candidate.longform_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-white/70 text-xs font-display font-black flex items-center gap-1.5 hover:text-brand-primary transition-colors uppercase tracking-[0.15em] pointer-events-auto"
            >
              Full Interview <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
