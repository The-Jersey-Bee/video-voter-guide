
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuestionSection } from './components/QuestionSection';
import { PlayerOverlay } from './components/PlayerOverlay';
import { useIframeResize } from './hooks/useIframeResize';
import { useAppData } from './hooks/useAppData';
import { ArrowDown, ExternalLink, Loader2 } from 'lucide-react';
import { analytics } from './lib/analytics';

const App: React.FC = () => {
  const { data, loading, error } = useAppData();
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ questionId: string; candidateId: string } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Enable iframe resize communication for embedding
  const { isEmbedded } = useIframeResize();

  // Set initial open section when data loads (only once)
  useEffect(() => {
    if (data.sections.length > 0 && !hasInitialized) {
      const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
      setOpenSectionId(sortedSections[0]?.id || null);
      setHasInitialized(true);
    }
  }, [data.sections, hasInitialized]);

  /**
   * Safe utility to update the URL hash without crashing in restricted environments (like blob: URLs)
   */
  const safeReplaceHash = useCallback((hash: string) => {
    try {
      if (window.location.protocol === 'blob:') {
        window.location.hash = hash;
        return;
      }
      window.history.replaceState(null, '', hash);
    } catch (err) {
      console.warn('History API restricted:', err);
      try {
        window.location.hash = hash;
      } catch (e) {}
    }
  }, []);

  // Handle deep linking via hash
  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash.substring(1);
        if (!hash) return;
        
        const params = new URLSearchParams(hash);
        const qSlug = params.get('q');
        const cSlug = params.get('cand');

        if (qSlug && cSlug) {
          const question = data.questions.find(q => q.slug === qSlug);
          const candidate = data.candidates.find(c => c.slug === cSlug);
          if (question && candidate) {
            setSelectedVideo({ questionId: question.id, candidateId: candidate.id });
            setOpenSectionId(question.section_id);
          }
        }
      } catch (err) {
        console.error("Deep link error:", err);
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [data]);

  const activeQuestion = useMemo(() => {
    if (!selectedVideo) return null;
    return data.questions.find(q => q.id === selectedVideo.questionId);
  }, [selectedVideo, data.questions]);

  const activeClipsForQuestion = useMemo(() => {
    if (!selectedVideo) return [];
    return data.clips.filter(c => c.question_id === selectedVideo.questionId);
  }, [selectedVideo, data.clips]);

  const handleCandidateChange = useCallback((candidateId: string) => {
    if (!selectedVideo) return;
    setSelectedVideo(prev => prev ? { ...prev, candidateId } : null);
    
    const question = data.questions.find(q => q.id === selectedVideo.questionId);
    const candidate = data.candidates.find(c => c.id === candidateId);
    if (question && candidate) {
      safeReplaceHash(`#q=${question.slug}&cand=${candidate.slug}`);
    }
  }, [selectedVideo, data.questions, data.candidates, safeReplaceHash]);

  const handleWatchClick = () => {
    analytics.watchClick();
    const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
    const firstSectionId = sortedSections[0]?.id;
    if (firstSectionId) {
      setOpenSectionId(firstSectionId);
      // We give it a tiny timeout to ensure the DOM is ready or let the Section's own scroll logic take over if it was already closed.
      // If it was already open, we trigger an explicit scroll.
      document.getElementById('questions')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExternalLinkClick = (linkName: string, url: string) => {
    analytics.externalLinkClick(linkName, url);
  };

  const handleSectionToggle = (sectionId: string, sectionTitle: string) => {
    const isOpening = openSectionId !== sectionId;
    if (isOpening) {
      analytics.sectionOpen(sectionId, sectionTitle);
    }
    setOpenSectionId(openSectionId === sectionId ? null : sectionId);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-brand-text-light font-display">Loading voter guide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 bg-brand-background font-sans">
      <main className="max-w-4xl mx-auto px-4">
        <section className="mb-16">
          <h1 className="text-[1.9rem] md:text-[3.2rem] font-display font-semibold text-brand-secondary-dark mb-6 leading-tight">
            {data.election.title}
          </h1>
          <div 
            className="text-lg md:text-xl text-brand-text mb-8 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: data.election.intro_html }} 
          />
          <div className="flex flex-wrap gap-4">
            <button 
                onClick={handleWatchClick}
                className="bg-brand-primary text-brand-white px-8 py-4 rounded-xl font-display font-extrabold flex items-center gap-2 hover:bg-brand-primary-dark transition-all transform hover:-translate-y-1 shadow-md hover:shadow-xl"
            >
              Watch <ArrowDown size={20} />
            </button>
            <a
                href={data.election.plan_to_vote_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalLinkClick('Get voting info', data.election.plan_to_vote_url)}
                className="bg-brand-white text-brand-secondary-dark border-2 border-brand-secondary-dark px-8 py-4 rounded-xl font-display font-extrabold hover:bg-brand-secondary-light transition-colors text-center md:text-left leading-tight md:leading-normal flex items-center justify-center gap-2"
            >
              Get voting info <ExternalLink size={18} className="flex-shrink-0" />
            </a>
            {data.election.towns_url && (
              <a
                  href={data.election.towns_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleExternalLinkClick('Towns in the district', data.election.towns_url!)}
                  className="bg-brand-white text-brand-secondary-dark border-2 border-brand-secondary-dark px-8 py-4 rounded-xl font-display font-extrabold hover:bg-brand-secondary-light transition-colors text-center md:text-left leading-tight md:leading-normal flex items-center justify-center gap-2"
              >
                Towns in the district <ExternalLink size={18} className="flex-shrink-0" />
              </a>
            )}
            {data.election.filming_location_url && (
              <a
                  href={data.election.filming_location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleExternalLinkClick('Learn about where we filmed', data.election.filming_location_url!)}
                  className="bg-brand-white text-brand-secondary-dark border-2 border-brand-secondary-dark px-8 py-4 rounded-xl font-display font-extrabold hover:bg-brand-secondary-light transition-colors text-center md:text-left leading-tight md:leading-normal flex items-center justify-center gap-2"
              >
                Learn about where we filmed <ExternalLink size={18} className="flex-shrink-0" />
              </a>
            )}
          </div>
        </section>

        <section id="questions" className="space-y-6">
          {data.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <QuestionSection
                key={section.id}
                section={section}
                questions={data.questions.filter(q => q.section_id === section.id)}
                candidates={data.candidates}
                clips={data.clips}
                isOpen={openSectionId === section.id}
                onToggle={() => handleSectionToggle(section.id, section.description || section.title)}
                onSelectCandidate={(qId, cId) => {
                  const candidate = data.candidates.find(c => c.id === cId);
                  if (candidate) {
                    analytics.candidateClick(cId, candidate.name, qId);
                  }
                  setSelectedVideo({ questionId: qId, candidateId: cId });
                }}
              />
            ))
          }
        </section>

      </main>

      {selectedVideo && activeQuestion && (
        <PlayerOverlay
          clips={activeClipsForQuestion}
          candidates={data.candidates}
          question={activeQuestion}
          initialCandidateId={selectedVideo.candidateId}
          onClose={() => {
            setSelectedVideo(null);
            safeReplaceHash('');
          }}
          onCandidateChange={handleCandidateChange}
        />
      )}
    </div>
  );
};

export default App;
