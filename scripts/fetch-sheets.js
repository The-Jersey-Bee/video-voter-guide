#!/usr/bin/env node
/**
 * Fetch data from Google Sheets and output as JSON
 * Usage: node scripts/fetch-sheets.js > data/production-data.json
 */

const SHEET_ID = '1BQsheqMePpaFpNUyep_mKQOxn1KMma-fMyyj7Iq6pdU';

const getSheetUrl = (tabName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${tabName}`;

function parseGoogleSheetsResponse(text) {
  const jsonString = text.replace(/^[^(]*\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonString);

  if (!data.table || !data.table.rows || data.table.rows.length === 0) {
    return [];
  }

  const colLabels = data.table.cols.map((col) => col.label || '');
  const hasLabels = colLabels.some((label) => label.trim() !== '');

  let headers;
  let dataRows;

  if (hasLabels) {
    headers = colLabels;
    dataRows = data.table.rows;
  } else {
    const firstRow = data.table.rows[0];
    headers = firstRow.c?.map((cell) => cell?.v ?? '') || [];
    dataRows = data.table.rows.slice(1);
  }

  return dataRows.map((row) => {
    const obj = {};
    row.c?.forEach((cell, index) => {
      const header = headers[index];
      if (header) {
        obj[header] = cell?.v ?? '';
      }
    });
    return obj;
  });
}

async function fetchSheet(tabName) {
  const url = getSheetUrl(tabName);
  const response = await fetch(url);
  const text = await response.text();
  return parseGoogleSheetsResponse(text);
}

async function main() {
  const [settingsRows, sectionsRows, questionsRows, candidatesRows, clipsRows] =
    await Promise.all([
      fetchSheet('settings'),
      fetchSheet('sections'),
      fetchSheet('questions'),
      fetchSheet('candidates'),
      fetchSheet('clips'),
    ]);

  const settings = settingsRows[0] || {};
  const election = {
    title: settings.title || '',
    intro_html: settings.intro_html || '',
    newsletter_embed_id: settings.newsletter_embed_id || '',
    plan_to_vote_url: settings.plan_to_vote_url || '',
    towns_url: settings.towns_url || '',
    filming_location_url: settings.filming_location_url || '',
  };

  const sections = sectionsRows.map((row) => ({
    id: row.id || '',
    title: row.title || '',
    description: row.description || '',
    order: Number(row.order) || 0,
  }));

  const questions = questionsRows.map((row) => ({
    id: row.id || '',
    section_id: row.section_id || '',
    prompt: row.prompt || '',
    short_title: row.short_title || '',
    order: Number(row.order) || 0,
    slug: row.slug || '',
  }));

  const candidates = candidatesRows.map((row) => ({
    id: row.id || '',
    name: row.name || '',
    slug: row.slug || '',
    headshot_url: row.headshot_url || '',
    order: Number(row.order) || 0,
    longform_url: row.longform_url || '',
    participated: row.participated === undefined || row.participated === '' || String(row.participated).toUpperCase() === 'TRUE',
  }));

  const clips = clipsRows.map((row) => ({
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

  console.log(JSON.stringify({
    election,
    sections,
    questions,
    candidates,
    clips,
  }, null, 2));
}

main().catch(console.error);
