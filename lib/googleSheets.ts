import { AppData, ElectionInfo, Section, Question, Candidate, Clip } from '../types';

// Your Google Sheet ID (from the URL)
// Example: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';

// Public CSV export URL for each tab
const getSheetUrl = (tabName: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${tabName}`;

/**
 * Parse Google Sheets JSON response (it's wrapped in a callback)
 */
function parseGoogleSheetsResponse(text: string): any[] {
  // Remove the callback wrapper: google.visualization.Query.setResponse({...})
  const jsonString = text.replace(/^[^(]*\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonString);

  if (!data.table || !data.table.rows || data.table.rows.length === 0) {
    return [];
  }

  // Check if column labels exist (Google Sheets sometimes doesn't set them)
  const colLabels = data.table.cols.map((col: any) => col.label || '');
  const hasLabels = colLabels.some((label: string) => label.trim() !== '');

  let headers: string[];
  let dataRows: any[];

  if (hasLabels) {
    // Use column labels as headers
    headers = colLabels;
    dataRows = data.table.rows;
  } else {
    // Use first row as headers, skip it from data
    const firstRow = data.table.rows[0];
    headers = firstRow.c?.map((cell: any) => cell?.v ?? '') || [];
    dataRows = data.table.rows.slice(1);
  }

  // Map rows to objects
  return dataRows.map((row: any) => {
    const obj: Record<string, any> = {};
    row.c?.forEach((cell: any, index: number) => {
      const header = headers[index];
      if (header) {
        obj[header] = cell?.v ?? '';
      }
    });
    return obj;
  });
}

/**
 * Fetch a single sheet tab and parse it
 */
async function fetchSheet(tabName: string): Promise<any[]> {
  const url = getSheetUrl(tabName);
  const response = await fetch(url);
  const text = await response.text();
  return parseGoogleSheetsResponse(text);
}

/**
 * Fetch all data from Google Sheets
 */
export async function fetchGoogleSheetsData(): Promise<AppData> {
  if (!SHEET_ID) {
    throw new Error('VITE_GOOGLE_SHEET_ID environment variable is not set');
  }

  const [settingsRows, sectionsRows, questionsRows, candidatesRows, clipsRows] =
    await Promise.all([
      fetchSheet('settings'),
      fetchSheet('sections'),
      fetchSheet('questions'),
      fetchSheet('candidates'),
      fetchSheet('clips'),
    ]);

  // Parse settings (single row)
  const settings = settingsRows[0] || {};
  const election: ElectionInfo = {
    title: settings.title || '',
    intro_html: settings.intro_html || '',
    newsletter_embed_id: settings.newsletter_embed_id || '',
    plan_to_vote_url: settings.plan_to_vote_url || '',
    towns_url: settings.towns_url || '',
    filming_location_url: settings.filming_location_url || '',
  };

  // Parse sections
  const sections: Section[] = sectionsRows.map((row) => ({
    id: row.id || '',
    title: row.title || '',
    description: row.description || '',
    order: Number(row.order) || 0,
  }));

  // Parse questions
  const questions: Question[] = questionsRows.map((row) => ({
    id: row.id || '',
    section_id: row.section_id || '',
    prompt: row.prompt || '',
    short_title: row.short_title || '',
    order: Number(row.order) || 0,
    slug: row.slug || '',
  }));

  // Parse candidates
  const candidates: Candidate[] = candidatesRows.map((row) => ({
    id: row.id || '',
    name: row.name || '',
    slug: row.slug || '',
    headshot_url: row.headshot_url || '',
    order: Number(row.order) || 0,
    longform_url: row.longform_url || '',
    participated: row.participated === undefined || row.participated === '' || String(row.participated).toUpperCase() === 'TRUE',
  }));

  // Parse clips
  const clips: Clip[] = clipsRows.map((row) => ({
    id: row.id || '',
    question_id: row.question_id || '',
    candidate_id: row.candidate_id || '',
    video_src: row.video_src || '',
    poster_src: row.poster_src || '',
    captions_vtt_src: row.captions_vtt_src || '',
    transcript_text: row.transcript_text || '',
    duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : undefined,
    instagram_url: row.instagram_url || undefined,
    tiktok_url: row.tiktok_url || undefined,
  }));

  return {
    election,
    sections,
    questions,
    candidates,
    clips,
  };
}
