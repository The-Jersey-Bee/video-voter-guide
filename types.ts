
export interface ElectionInfo {
  title: string;
  intro_html: string;
  newsletter_embed_id: string;
  plan_to_vote_url: string;
  towns_url?: string;
  filming_location_url?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface Question {
  id: string;
  section_id: string;
  prompt: string;
  short_title: string;
  order: number;
  slug: string;
}

export interface Candidate {
  id: string;
  name: string;
  slug: string;
  headshot_url?: string;
  order: number;
  longform_url: string;
  participated?: boolean;
}

export interface Clip {
  id: string;
  question_id: string;
  candidate_id: string;
  video_src: string;
  poster_src: string;
  captions_vtt_src: string;
  transcript_text: string;
  duration_seconds?: number;
  instagram_url?: string;
  tiktok_url?: string;
}

export interface AppData {
  election: ElectionInfo;
  sections: Section[];
  questions: Question[];
  candidates: Candidate[];
  clips: Clip[];
}
