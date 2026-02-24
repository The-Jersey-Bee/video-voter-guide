// site.config.ts — Edit this file to customize your voter guide
import type { SiteConfig } from './lib/config';

const config: SiteConfig = {
  // Your organization name (shown in metadata, accessibility labels)
  orgName: 'Your Organization',

  // Color palette — customize to match your brand
  colors: {
    primary: '#C06328',        // Main accent color (buttons, highlights)
    primaryLight: '#DFAB40',   // Lighter variant
    primaryDark: '#6C2F09',    // Darker variant (hover states)
    secondary: '#789FD4',      // Secondary accent (headings, badges)
    secondaryLight: '#E1EBF9', // Light background tint
    secondaryDark: '#2B2E34',  // Dark text / headings
  },

  // Font families — loaded via Google Fonts in index.html
  fonts: {
    display: 'Red Hat Display',  // Headings
    body: 'Red Hat Text',        // Body text
  },

  // Google Analytics 4 — set to null to disable tracking
  ga4MeasurementId: null,

  // Google Sheet ID — the long string from your sheet URL
  // https://docs.google.com/spreadsheets/d/THIS_PART/edit
  googleSheetId: '',

  // Base URL where your videos are hosted (no trailing slash)
  videoBaseUrl: '',
};

export default config;
