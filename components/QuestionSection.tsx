
import React, { useRef, useEffect } from 'react';
import { Section, Question, Candidate, Clip } from '../types';
import { ChevronRight, Play } from 'lucide-react';

interface QuestionSectionProps {
  section: Section;
  questions: Question[];
  candidates: Candidate[];
  clips: Clip[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectCandidate: (questionId: string, candidateId: string) => void;
}

export const QuestionSection: React.FC<QuestionSectionProps> = ({
  section,
  questions,
  candidates,
  clips,
  isOpen,
  onToggle,
  onSelectCandidate
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the top of the section when it is opened
  useEffect(() => {
    if (isOpen && sectionRef.current) {
      // Use a slight timeout to ensure the browser has rendered the newly opened content
      // and can calculate the correct scroll position.
      const timer = setTimeout(() => {
        sectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div 
      ref={sectionRef}
      className="mb-6 border border-gray-200 rounded-3xl overflow-hidden bg-brand-white shadow-sm hover:shadow-md transition-shadow scroll-mt-20 md:scroll-mt-24"
    >
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 md:p-8 bg-brand-white hover:bg-brand-background transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col">
          <span className="text-xs font-display font-bold text-brand-primary uppercase tracking-widest mb-1.5">{section.title}</span>
          <h2 className="text-xl md:text-3xl font-display font-black text-brand-secondary-dark">{section.description || "Browse Questions"}</h2>
        </div>
        <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-brand-primary text-brand-white' : 'bg-brand-background text-brand-secondary-dark'}`}>
          <ChevronRight 
            className={`transform transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
            size={24} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 sm:px-6 md:px-8 pb-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-300">
          {questions.map((question) => (
            <div key={question.id} className="border-t border-gray-100 pt-8 first:border-t-0 first:pt-0">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-display font-bold text-brand-secondary-dark leading-tight">
                  {question.prompt}
                </h3>
              </div>

              {/* Grid: 3 columns on mobile, scaling up to 6 on larger screens */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {candidates.map((candidate) => {
                  const didParticipate = candidate.participated !== false;

                  if (didParticipate) {
                    return (
                      <button
                        key={candidate.id}
                        onClick={() => onSelectCandidate(question.id, candidate.id)}
                        className="group relative flex flex-col items-center text-center focus:outline-none"
                      >
                        <div className="relative w-full aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden mb-2 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                          {candidate.headshot_url ? (
                            <img
                              src={candidate.headshot_url}
                              alt={candidate.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-brand-secondary-light" />
                          )}
                          <div className="absolute inset-0 bg-brand-secondary-dark/0 group-hover:bg-brand-secondary-dark/30 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            <div className="bg-brand-white p-2 sm:p-3 rounded-full shadow-2xl">
                              <Play size={18} className="text-brand-primary fill-brand-primary ml-0.5 sm:size-[24px]" />
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs md:text-sm font-display font-bold text-brand-text group-hover:text-brand-primary transition-colors line-clamp-2 px-0.5 leading-tight">
                          {candidate.name}
                        </span>
                      </button>
                    );
                  }

                  // Non-participating candidate - no hover/click
                  return (
                    <div
                      key={candidate.id}
                      className="relative flex flex-col items-center text-center"
                    >
                      <div className="relative w-full aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden mb-2 shadow-sm">
                        {candidate.headshot_url ? (
                          <img
                            src={candidate.headshot_url}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-secondary-light" />
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs md:text-sm font-display font-bold text-brand-text line-clamp-2 px-0.5 leading-tight">
                        {candidate.name}
                      </span>
                      <span className="text-[8px] sm:text-[10px] text-brand-text">
                        (Didn't Participate)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
