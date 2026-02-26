import { z } from 'zod';

export const ElectionInfoSchema = z.object({
  title: z.string(),
  intro_html: z.string(),
  plan_to_vote_url: z.string(),
  towns_url: z.string().optional().default(''),
  filming_location_url: z.string().optional().default(''),
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  order: z.number(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  section_id: z.string(),
  prompt: z.string(),
  short_title: z.string(),
  order: z.number(),
  slug: z.string(),
});

export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  headshot_url: z.string().optional().default(''),
  order: z.number(),
  longform_url: z.string(),
  participated: z.boolean().optional().default(true),
});

export const ClipSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  candidate_id: z.string(),
  video_src: z.string(),
  poster_src: z.string(),
  captions_vtt_src: z.string(),
  transcript_text: z.string(),
  duration_seconds: z.number().optional(),
  instagram_url: z.string().optional(),
  tiktok_url: z.string().optional(),
});

export const AppDataSchema = z.object({
  election: ElectionInfoSchema,
  sections: z.array(SectionSchema),
  questions: z.array(QuestionSchema),
  candidates: z.array(CandidateSchema),
  clips: z.array(ClipSchema),
});

export function validateAppData(data: unknown) {
  return AppDataSchema.safeParse(data);
}
