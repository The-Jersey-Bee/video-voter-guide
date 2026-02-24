
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles.css';
import App from './App';
import siteConfig from './site.config';

// Inject config colors and fonts as CSS custom properties
const root = document.documentElement;
root.style.setProperty('--color-brand-primary', siteConfig.colors.primary);
root.style.setProperty('--color-brand-primary-light', siteConfig.colors.primaryLight);
root.style.setProperty('--color-brand-primary-dark', siteConfig.colors.primaryDark);
root.style.setProperty('--color-brand-secondary', siteConfig.colors.secondary);
root.style.setProperty('--color-brand-secondary-light', siteConfig.colors.secondaryLight);
root.style.setProperty('--color-brand-secondary-dark', siteConfig.colors.secondaryDark);
root.style.setProperty('--font-display', `"${siteConfig.fonts.display}", sans-serif`);
root.style.setProperty('--font-sans', `"${siteConfig.fonts.body}", sans-serif`);

// Conditionally load GA4
if (siteConfig.ga4MeasurementId) {
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${siteConfig.ga4MeasurementId}`;
  document.head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) { window.dataLayer!.push(args); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', siteConfig.ga4MeasurementId);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const rootInstance = ReactDOM.createRoot(rootElement);
rootInstance.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
