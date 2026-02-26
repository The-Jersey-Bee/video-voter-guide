import { Clip, Candidate, Question } from '../../types';

export interface PlayerOverlayProps {
  clips: Clip[];
  candidates: Candidate[];
  question: Question;
  initialCandidateId: string;
  onClose: () => void;
  onCandidateChange: (candidateId: string) => void;
}

export interface VideoSlideProps {
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

export interface ShareSheetProps {
  candidate: Candidate;
  clip: Clip;
  question: Question;
  onClose: () => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  parentUrl?: string | null;
}

export interface QuestionOverlayProps {
  question: Question;
  candidate: Candidate;
  index: number;
  total: number;
  onClose: () => void;
}
