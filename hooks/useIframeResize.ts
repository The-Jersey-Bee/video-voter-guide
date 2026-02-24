import { useEffect, useCallback, useState } from 'react';

/**
 * Hook to handle iframe resize communication with parent window.
 * Sends postMessage events when the document height changes,
 * allowing parent pages to auto-resize the iframe.
 *
 * Returns isEmbedded boolean so components can adapt their behavior.
 */
export function useIframeResize() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  const getContentHeight = useCallback(() => {
    // Measure the actual content by finding the lowest element
    // This avoids returning the iframe's container height
    const main = document.querySelector('main');
    if (main) {
      const rect = main.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      return Math.ceil(rect.bottom + scrollTop + 32); // 32px buffer
    }

    // Fallback: measure all direct children of body
    const children = document.body.children;
    let maxBottom = 0;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const bottom = rect.bottom + window.scrollY;
      if (bottom > maxBottom) maxBottom = bottom;
    }
    return Math.ceil(maxBottom + 32);
  }, []);

  const sendResizeMessage = useCallback(() => {
    // Only send if we're in an iframe
    if (window.parent === window) return;

    const height = getContentHeight();

    // Send postMessage for custom listeners
    window.parent.postMessage(
      {
        type: 'responsive-iframe-resize',
        height: height,
      },
      '*'
    );

    // Also set data attribute for alternative reading methods
    document.body.setAttribute('data-iframe-height', String(height));
  }, [getContentHeight]);

  useEffect(() => {
    // Check if we're embedded in an iframe
    const embedded = window.parent !== window;
    setIsEmbedded(embedded);

    if (!embedded) return;

    // Add embed-mode class to html element to disable internal scrolling
    document.documentElement.classList.add('embed-mode');

    // Send initial size multiple times to ensure parent catches it
    // Parent page might not be fully ready when we first load
    const initialDelays = [0, 100, 250, 500, 1000, 2000];
    const initialTimeouts = initialDelays.map(delay =>
      setTimeout(() => {
        requestAnimationFrame(sendResizeMessage);
      }, delay)
    );

    // Set up ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(sendResizeMessage);
    });

    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    // Also listen for window resize
    window.addEventListener('resize', sendResizeMessage);

    // Send resize on any DOM mutations (accordion open/close, etc.)
    const mutationObserver = new MutationObserver(() => {
      // Small delay to let animations/transitions complete
      setTimeout(sendResizeMessage, 50);
      setTimeout(sendResizeMessage, 300); // Extra send after animations
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'open'],
    });

    // Listen for transitionend to catch CSS transitions
    document.addEventListener('transitionend', sendResizeMessage);

    // Also send periodically for the first 5 seconds to catch late-loading content
    let intervalCount = 0;
    const periodicInterval = setInterval(() => {
      sendResizeMessage();
      intervalCount++;
      if (intervalCount >= 10) {
        clearInterval(periodicInterval);
      }
    }, 500);

    return () => {
      initialTimeouts.forEach(clearTimeout);
      clearInterval(periodicInterval);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', sendResizeMessage);
      document.removeEventListener('transitionend', sendResizeMessage);
      document.documentElement.classList.remove('embed-mode');
    };
  }, [sendResizeMessage]);

  // Return the function and embed state so components can adapt
  return { sendResizeMessage, isEmbedded };
}
