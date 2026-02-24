
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX,
  HelpCircle, Share2, ChevronUp, ChevronDown,
  ExternalLink, Check, Instagram, Send, Info, Loader2
} from 'lucide-react';
import { Clip, Candidate, Question } from '../types';
import { analytics } from '../lib/analytics';

// Check if we're embedded in an iframe
const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

interface PlayerOverlayProps {
  clips: Clip[];
  candidates: Candidate[];
  question: Question;
  initialCandidateId: string;
  onClose: () => void;
  onCandidateChange: (candidateId: string) => void;
}

export const PlayerOverlay: React.FC<PlayerOverlayProps> = ({
  clips,
  candidates,
  question,
  initialCandidateId,
  onClose,
  onCandidateChange
}) => {
  // Filter to only include candidates who participated
  const participatingCandidates = candidates.filter(c => c.participated !== false);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = participatingCandidates.findIndex(c => c.id === initialCandidateId);
    return idx === -1 ? 0 : idx;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const lastDragOffset = useRef<number>(0);
  const wheelTimer = useRef<any>(null);

  // Track parent viewport dimensions and URL when embedded
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [parentUrl, setParentUrl] = useState<string | null>(null);

  // Lock scroll and get parent viewport size when embedded
  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Listen for viewport size from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'viewport-size') {
        setViewportHeight(event.data.height);
        if (event.data.parentUrl) {
          setParentUrl(event.data.parentUrl);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request viewport size from parent
    if (isEmbedded) {
      window.parent.postMessage({ type: 'request-viewport-size' }, '*');
    }

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < participatingCandidates.length) {
      const direction = index > activeIndex ? 'next' : 'prev';
      const newCandidateId = participatingCandidates[index].id;
      analytics.candidateNavigate(direction, newCandidateId);
      setActiveIndex(index);
      onCandidateChange(newCandidateId);
    }
  }, [participatingCandidates, onCandidateChange, activeIndex]);

  // Wrap onClose to notify parent
  const handleClose = useCallback(() => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'video-player-closed' }, '*');
    }
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQuestion || showShareSheet) {
        if (e.key === 'Escape') {
          setShowQuestion(false);
          setShowShareSheet(false);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        navigateTo(activeIndex - 1);
      } else if (e.key === 'ArrowDown') {
        navigateTo(activeIndex + 1);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, navigateTo, handleClose, showQuestion, showShareSheet]);

  // Wheel navigation with debounce
  const handleWheel = (e: React.WheelEvent) => {
    if (showQuestion || showShareSheet) return;
    if (wheelTimer.current) return;

    const threshold = 50;
    if (Math.abs(e.deltaY) > threshold) {
      if (e.deltaY > 0) {
        navigateTo(activeIndex + 1);
      } else {
        navigateTo(activeIndex - 1);
      }
      
      wheelTimer.current = window.setTimeout(() => {
        wheelTimer.current = null;
      }, 600);
    }
  };

  // Sync active index if initialCandidateId changes from outside
  useEffect(() => {
    const idx = participatingCandidates.findIndex(c => c.id === initialCandidateId);
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
    }
  }, [initialCandidateId, participatingCandidates, activeIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showQuestion || showShareSheet) return;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
    lastDragOffset.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || showQuestion || showShareSheet) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    
    let offset = deltaY;
    if (activeIndex === 0 && deltaY > 0) offset = deltaY * 0.3;
    if (activeIndex === participatingCandidates.length - 1 && deltaY < 0) offset = deltaY * 0.3;
    
    setDragOffset(offset);
    lastDragOffset.current = offset;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = window.innerHeight * 0.15;
    if (lastDragOffset.current < -threshold && activeIndex < participatingCandidates.length - 1) {
      navigateTo(activeIndex + 1);
    } else if (lastDragOffset.current > threshold && activeIndex > 0) {
      navigateTo(activeIndex - 1);
    }
    
    setDragOffset(0);
  };

  const activeCandidate = participatingCandidates[activeIndex];
  if (!activeCandidate) return null;

  const activeClip = clips.find(c => c.candidate_id === activeCandidate.id && c.question_id === question.id);

  // Calculate video dimensions based on viewport
  const videoHeight = viewportHeight;
  const videoWidth = Math.min(viewportHeight * (9 / 16), window.innerWidth);

  return (
    <div
      ref={overlayRef}
      className="fixed z-50 bg-black/90 flex flex-col items-center justify-center font-sans select-none cursor-pointer"
      style={{
        top: 0,
        left: 0,
        width: '100vw',
        height: `${viewportHeight}px`,
      }}
      onWheel={handleWheel}
      onClick={handleClose}
    >
      <div className="hidden md:flex absolute right-8 flex-col gap-4 z-[60]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigateTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-4 bg-brand-white/10 hover:bg-brand-white/20 text-white rounded-full backdrop-blur-md transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 shadow-xl"
          title="Previous Candidate (Arrow Up)"
        >
          <ChevronUp size={32} />
        </button>
        <button
          onClick={() => navigateTo(activeIndex + 1)}
          disabled={activeIndex === participatingCandidates.length - 1}
          className="p-4 bg-brand-white/10 hover:bg-brand-white/20 text-white rounded-full backdrop-blur-md transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 shadow-xl"
          title="Next Candidate (Arrow Down)"
        >
          <ChevronDown size={32} />
        </button>
      </div>

      {/* Video container: sized based on viewport height with 9:16 aspect ratio */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-brand-secondary-dark shadow-2xl touch-none cursor-default"
        style={{
          height: `${videoHeight}px`,
          width: `${videoWidth}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`w-full h-full flex flex-col transition-transform ${isDragging ? '' : 'duration-500 ease-out'}`}
          style={{ 
            transform: `translateY(calc(-${activeIndex * 100}% + ${dragOffset}px))` 
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {participatingCandidates.map((candidate, index) => {
            const clip = clips.find(c => c.candidate_id === candidate.id && c.question_id === question.id);
            const isActive = index === activeIndex;

            return (
              <VideoSlide
                key={candidate.id}
                candidate={candidate}
                clip={clip}
                isActive={isActive}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                onToggleQuestion={() => setShowQuestion(true)}
                onOpenShare={() => setShowShareSheet(true)}
                onClose={handleClose}
                index={index}
                total={participatingCandidates.length}
                question={question}
                parentUrl={parentUrl}
              />
            );
          })}
        </div>

        {showShareSheet && activeClip && (
          <ShareSheet
            candidate={activeCandidate}
            clip={activeClip}
            question={question}
            onClose={() => setShowShareSheet(false)}
            copied={copied}
            setCopied={setCopied}
            parentUrl={parentUrl}
          />
        )}

        {showQuestion && (
          <QuestionOverlay
            question={question}
            candidate={activeCandidate}
            index={activeIndex}
            total={participatingCandidates.length}
            onClose={() => setShowQuestion(false)}
          />
        )}
      </div>
    </div>
  );
};

interface VideoSlideProps {
  candidate: Candidate;
  clip?: Clip;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleQuestion: () => void;
  onOpenShare: () => void;
  onClose: () => void;
  index: number;
  total: number;
  question: Question;
  parentUrl?: string | null;
}

const VideoSlide: React.FC<VideoSlideProps> = ({
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
        // Clipboard also failed, nothing we can do
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
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={handlePlayPause} className="text-white hover:text-brand-primary transition-colors pointer-events-auto">
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime -= 10; resetControlsTimeout(); }} className="text-white hover:text-brand-primary transition-colors pointer-events-auto">
              <RotateCcw size={28} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleMute(); resetControlsTimeout(); }} className="text-white hover:text-brand-primary transition-colors pointer-events-auto">
              {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleQuestion(); }}
              className="p-2 rounded-xl text-white hover:bg-brand-white/10 transition-all pointer-events-auto"
            >
              <HelpCircle size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="text-white hover:text-brand-primary transition-colors pointer-events-auto relative"
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

const TikTokIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.72.42-1.24 1.16-1.31 1.97-.05.41-.01.82.07 1.22.15 1.02.87 1.86 1.81 2.27.76.35 1.61.47 2.44.25 1.05-.31 1.86-1.2 2.1-2.27.11-.45.11-.91.11-1.37.01-4.49 0-8.98.01-13.47z"/>
  </svg>
);

const ShareSheet: React.FC<{
  candidate: Candidate;
  clip: Clip;
  question: Question;
  onClose: () => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  parentUrl?: string | null;
}> = ({ candidate, clip, question, onClose, copied, setCopied, parentUrl }) => {

  const handleShareLink = async () => {
    // Use parent URL if embedded, otherwise use current window location
    const baseUrl = parentUrl
      ? parentUrl.split('#')[0]  // Remove any existing hash from parent URL
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}#q=${question.slug}&cand=${candidate.slug}`;
    const shareData = { url };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Clipboard also failed
      }
    };

    // Web Share API requires secure context (HTTPS) and canShare support
    const canShare = navigator.share &&
                     window.isSecureContext &&
                     (!navigator.canShare || navigator.canShare(shareData));

    if (canShare) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // If user cancelled, do nothing; otherwise fall back to clipboard
        if (err?.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col justify-end transition-opacity duration-300">
      <div className="bg-brand-white w-full rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-display font-black text-brand-secondary-dark">Share</h3>
          <button onClick={onClose} className="p-2 bg-brand-background rounded-full text-brand-secondary-dark">
            <X size={20} />
          </button>
        </div>
        
        <div className="grid gap-4">
          <button 
            onClick={handleShareLink}
            className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-primary p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                <Send size={20} />
              </div>
              <div className="text-left">
                <span className="block font-display font-bold text-brand-secondary-dark">Share Link</span>
                <span className="block text-xs text-brand-text-light">Send via text, email, or other apps</span>
              </div>
            </div>
            {copied ? <Check size={20} className="text-green-600" /> : <ChevronUp size={20} className="rotate-90 text-brand-primary" />}
          </button>

          {clip.instagram_url && (
            <a 
              href={clip.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                  <Instagram size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-display font-bold text-brand-secondary-dark">Instagram</span>
                  <span className="block text-xs text-brand-text-light">View and share on Instagram</span>
                </div>
              </div>
              <ExternalLink size={20} className="text-brand-primary" />
            </a>
          )}

          {clip.tiktok_url && (
            <a 
              href={clip.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                  <TikTokIcon size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-display font-bold text-brand-secondary-dark">TikTok</span>
                  <span className="block text-xs text-brand-text-light">View and share on TikTok</span>
                </div>
              </div>
              <ExternalLink size={20} className="text-brand-primary" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionOverlay: React.FC<{
  question: Question;
  candidate: Candidate;
  index: number;
  total: number;
  onClose: () => void;
}> = ({ question, candidate, index, total, onClose }) => (
  <div
    className="absolute inset-0 z-[70] flex flex-col justify-between cursor-pointer animate-in fade-in duration-300"
    onClick={onClose}
  >
    {/* Top: Candidate info */}
    <div className="p-5 bg-gradient-to-b from-black/90 to-transparent">
      <h4 className="text-white font-display font-black text-xl leading-tight">{candidate.name}</h4>
      <span className="text-white/70 text-sm font-medium uppercase tracking-widest">{index + 1} of {total} candidates</span>
    </div>

    {/* Bottom: Question */}
    <div className="p-6 pt-12 bg-gradient-to-t from-black/90 via-black/80 to-transparent">
      <p className="text-white font-display font-bold text-lg md:text-xl leading-snug">
        {question.prompt}
      </p>
      <p className="text-white/50 text-xs mt-3 font-display uppercase tracking-widest">
        Tap to dismiss
      </p>
    </div>
  </div>
);
