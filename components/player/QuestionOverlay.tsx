
import React from 'react';
import { QuestionOverlayProps } from './types';

export const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, candidate, index, total, onClose }) => (
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
