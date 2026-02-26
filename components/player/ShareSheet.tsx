
import React from 'react';
import {
  X, ExternalLink, Check, Instagram, Send, ChevronUp,
} from 'lucide-react';
import { ShareSheetProps } from './types';

const TikTokIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.72.42-1.24 1.16-1.31 1.97-.05.41-.01.82.07 1.22.15 1.02.87 1.86 1.81 2.27.76.35 1.61.47 2.44.25 1.05-.31 1.86-1.2 2.1-2.27.11-.45.11-.91.11-1.37.01-4.49 0-8.98.01-13.47z"/>
  </svg>
);

export const ShareSheet: React.FC<ShareSheetProps> = ({ candidate, clip, question, onClose, copied, setCopied, parentUrl }) => {

  const handleShareLink = async () => {
    // Use parent URL if embedded, otherwise use current window location
    const baseUrl = parentUrl
      ? parentUrl.split('#')[0]  // Remove any existing hash from parent URL
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}#q=${question.slug}&cand=${candidate.slug}`;
    const shareData = { url };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Clipboard also failed
        window.prompt('Copy this link:', url);
      }
    };

    // Web Share API requires secure context (HTTPS) and canShare support
    const canShare = navigator.share &&
                     window.isSecureContext &&
                     (!navigator.canShare || navigator.canShare(shareData));

    if (canShare) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // If user cancelled, do nothing; otherwise fall back to clipboard
        if (err?.name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col justify-end transition-opacity duration-300">
      <div className="bg-brand-white w-full rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-display font-black text-brand-secondary-dark">Share</h3>
          <button onClick={onClose} className="p-2 bg-brand-background rounded-full text-brand-secondary-dark" aria-label="Close share sheet">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          <button
            onClick={handleShareLink}
            className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-primary p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                <Send size={20} />
              </div>
              <div className="text-left">
                <span className="block font-display font-bold text-brand-secondary-dark">Share Link</span>
                <span className="block text-xs text-brand-text-light">Send via text, email, or other apps</span>
              </div>
            </div>
            {copied ? <Check size={20} className="text-green-600" /> : <ChevronUp size={20} className="rotate-90 text-brand-primary" />}
          </button>

          {clip.instagram_url && (
            <a
              href={clip.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                  <Instagram size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-display font-bold text-brand-secondary-dark">Instagram</span>
                  <span className="block text-xs text-brand-text-light">View and share on Instagram</span>
                </div>
              </div>
              <ExternalLink size={20} className="text-brand-primary" />
            </a>
          )}

          {clip.tiktok_url && (
            <a
              href={clip.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-5 bg-brand-background rounded-2xl hover:bg-brand-secondary-light transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black p-3 rounded-xl text-brand-white shadow-sm group-hover:scale-110 transition-transform">
                  <TikTokIcon size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-display font-bold text-brand-secondary-dark">TikTok</span>
                  <span className="block text-xs text-brand-text-light">View and share on TikTok</span>
                </div>
              </div>
              <ExternalLink size={20} className="text-brand-primary" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
