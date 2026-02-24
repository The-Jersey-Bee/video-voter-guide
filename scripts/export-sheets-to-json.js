#!/usr/bin/env node
/**
 * Export Google Sheets data to static JSON
 *
 * Usage:
 *   VITE_GOOGLE_SHEET_ID=your_sheet_id node scripts/export-sheets-to-json.js
 *
 * Or if you have .env file with VITE_GOOGLE_SHEET_ID:
 *   node scripts/export-sheets-to-json.js
 *
 * This creates/updates: src/data/production-data.json
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const SHEET_ID = process.env.VITE_GOOGLE_SHEET_ID;

if (!SHEET_ID) {
  console.error('Error: VITE_GOOGLE_SHEET_ID environment variable is required');
  console.error('Usage: VITE_GOOGLE_SHEET_ID=your_sheet_id node scripts/export-sheets-to-json.js');
  process.exit(1);
}

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

async function exportData() {
  console.log('Fetching data from Google Sheets...');
  console.log(`Sheet ID: ${SHEET_ID}`);

  try {
    const [settingsRows, sectionsRows, questionsRows, candidatesRows, clipsRows] =
      await Promise.all([
        fetchSheet('settings'),
        fetchSheet('sections'),
        fetchSheet('questions'),
        fetchSheet('candidates'),
        fetchSheet('clips'),
      ]);

    // Parse settings
    const settings = settingsRows[0] || {};
    const election = {
      title: settings.title || '',
      intro_html: settings.intro_html || '',
      newsletter_embed_id: settings.newsletter_embed_id || '',
      plan_to_vote_url: settings.plan_to_vote_url || '',
      towns_url: settings.towns_url || '',
    };

    // Parse sections
    const sections = sectionsRows.map((row) => ({
      id: row.id || '',
      title: row.title || '',
      description: row.description || '',
      order: Number(row.order) || 0,
    }));

    // Parse questions
    const questions = questionsRows.map((row) => ({
      id: row.id || '',
      section_id: row.section_id || '',
      prompt: row.prompt || '',
      short_title: row.short_title || '',
      order: Number(row.order) || 0,
      slug: row.slug || '',
    }));

    // Parse candidates
    const candidates = candidatesRows.map((row) => ({
      id: row.id || '',
      name: row.name || '',
      slug: row.slug || '',
      headshot_url: row.headshot_url || '',
      order: Number(row.order) || 0,
      longform_url: row.longform_url || '',
      participated: row.participated === undefined || row.participated === '' || String(row.participated).toUpperCase() === 'TRUE',
    }));

    // Parse clips
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

    const appData = {
      election,
      sections,
      questions,
      candidates,
      clips,
    };

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to JSON file
    const outputPath = path.join(dataDir, 'production-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(appData, null, 2));

    console.log('');
    console.log('Export complete!');
    console.log(`Output: ${outputPath}`);
    console.log('');
    console.log('Summary:');
    console.log(`  - ${sections.length} sections`);
    console.log(`  - ${questions.length} questions`);
    console.log(`  - ${candidates.length} candidates (${candidates.filter(c => c.participated).length} participating)`);
    console.log(`  - ${clips.length} clips`);
    console.log('');
    console.log('To use static data in production:');
    console.log('  Set USE_STATIC_DATA=true in your environment or .env file');

  } catch (error) {
    console.error('Failed to export data:', error.message);
    process.exit(1);
  }
}

exportData();
