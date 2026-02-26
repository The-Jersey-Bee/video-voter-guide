
import React, { useState, useRef, useEffect, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { sendToParent, isAllowedOrigin } from '../../lib/postMessage';
import { PlayerOverlayProps } from './types';
import { VideoSlide } from './VideoSlide';
import { ShareSheet } from './ShareSheet';
import { QuestionOverlay } from './QuestionOverlay';

// Check if we're embedded in an iframe
const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

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
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(activeIndex);

  // Keep ref in sync with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

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
      if (!isAllowedOrigin(event)) return;
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
      sendToParent({ type: 'request-viewport-size' });
    }

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < participatingCandidates.length) {
      const direction = index > activeIndexRef.current ? 'next' : 'prev';
      const newCandidateId = participatingCandidates[index].id;
      analytics.candidateNavigate(direction, newCandidateId);
      setActiveIndex(index);
      onCandidateChange(newCandidateId);
    }
  }, [participatingCandidates, onCandidateChange]);

  // Wrap onClose to notify parent
  const handleClose = useCallback(() => {
    if (isEmbedded) {
      sendToParent({ type: 'video-player-closed' });
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
        navigateTo(activeIndexRef.current - 1);
      } else if (e.key === 'ArrowDown') {
        navigateTo(activeIndexRef.current + 1);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo, handleClose, showQuestion, showShareSheet]);

  // Wheel navigation with debounce
  const handleWheel = (e: React.WheelEvent) => {
    if (showQuestion || showShareSheet) return;
    if (wheelTimer.current) return;

    const threshold = 50;
    if (Math.abs(e.deltaY) > threshold) {
      if (e.deltaY > 0) {
        navigateTo(activeIndexRef.current + 1);
      } else {
        navigateTo(activeIndexRef.current - 1);
      }

      wheelTimer.current = setTimeout(() => {
        wheelTimer.current = null;
      }, 600);
    }
  };

  // Sync active index if initialCandidateId changes from outside
  useEffect(() => {
    const idx = participatingCandidates.findIndex(c => c.id === initialCandidateId);
    if (idx !== -1 && idx !== activeIndexRef.current) {
      setActiveIndex(idx);
    }
  }, [initialCandidateId, participatingCandidates]);

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
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
      }}
    >
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
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
    >
      <div className="hidden md:flex absolute right-8 flex-col gap-4 z-[60]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigateTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-4 bg-brand-white/10 hover:bg-brand-white/20 text-white rounded-full backdrop-blur-md transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 shadow-xl"
          aria-label="Previous candidate"
        >
          <ChevronUp size={32} />
        </button>
        <button
          onClick={() => navigateTo(activeIndex + 1)}
          disabled={activeIndex === participatingCandidates.length - 1}
          className="p-4 bg-brand-white/10 hover:bg-brand-white/20 text-white rounded-full backdrop-blur-md transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 shadow-xl"
          aria-label="Next candidate"
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
    </FocusTrap>
  );
};
