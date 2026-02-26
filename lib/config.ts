// lib/config.ts — Config types and accessor

export interface SiteConfig {
  orgName: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  ga4MeasurementId: string | null;
  googleSheetId: string;
  videoBaseUrl: string;
  embedParentOrigins: string[];
}

// Re-export the user's config
import siteConfig from '../site.config';
export default siteConfig;
