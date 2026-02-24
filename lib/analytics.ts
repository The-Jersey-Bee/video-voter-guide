/**
 * Analytics utility for tracking events in Google Analytics 4
 * Also sends events to parent window for iframe embeds
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Track an event in GA4 and notify parent window
 */
export function trackEvent(eventName: string, params?: EventParams) {
  // Send to GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Also send to parent window for iframe embeds
  if (typeof window !== 'undefined' && window.parent !== window) {
    try {
      window.parent.postMessage({
        type: 'voter-guide-analytics',
        event: eventName,
        params,
      }, '*');
    } catch (e) {
      // Ignore cross-origin errors
    }
  }
}

// Pre-defined event helpers for consistency

export const analytics = {
  /** User clicked the "Watch" button */
  watchClick: () => trackEvent('watch_button_click'),

  /** User clicked an external link */
  externalLinkClick: (linkName: string, url: string) =>
    trackEvent('external_link_click', { link_name: linkName, url }),

  /** User opened a section accordion */
  sectionOpen: (sectionId: string, sectionTitle: string) =>
    trackEvent('section_open', { section_id: sectionId, section_title: sectionTitle }),

  /** User clicked on a candidate to view video */
  candidateClick: (candidateId: string, candidateName: string, questionId: string) =>
    trackEvent('candidate_click', {
      candidate_id: candidateId,
      candidate_name: candidateName,
      question_id: questionId
    }),

  /** Video started playing */
  videoPlay: (candidateId: string, candidateName: string, questionId: string) =>
    trackEvent('video_play', {
      candidate_id: candidateId,
      candidate_name: candidateName,
      question_id: questionId
    }),

  /** Video reached a milestone (25%, 50%, 75%, 100%) */
  videoProgress: (candidateId: string, questionId: string, percent: number) =>
    trackEvent('video_progress', {
      candidate_id: candidateId,
      question_id: questionId,
      percent
    }),

  /** User clicked the share button */
  shareClick: (candidateId: string, questionId: string) =>
    trackEvent('share_click', { candidate_id: candidateId, question_id: questionId }),

  /** User navigated to next/prev candidate in player */
  candidateNavigate: (direction: 'next' | 'prev', newCandidateId: string) =>
    trackEvent('candidate_navigate', { direction, candidate_id: newCandidateId }),
};
