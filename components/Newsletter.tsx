
import React from 'react';

export const Newsletter: React.FC = () => {
  return (
    <div id="newsletter-signup" className="bg-brand-primary-light/10 border-2 border-brand-primary-light p-8 md:p-12 rounded-3xl my-16 text-center shadow-sm">
      <h3 className="text-2xl md:text-3xl font-display font-black text-brand-secondary-dark mb-3">Stay informed on NJ-11</h3>
      <p className="text-brand-text mb-8 text-lg font-sans">Get our special election reporting delivered straight to your inbox.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <input 
          type="email" 
          placeholder="your@email.com" 
          className="px-5 py-4 rounded-xl border border-gray-300 flex-grow max-w-xs focus:ring-2 focus:ring-brand-primary outline-none transition-all"
        />
        <button className="bg-brand-primary text-brand-white px-8 py-4 rounded-xl font-display font-extrabold hover:bg-brand-primary-dark transition-all shadow-md hover:shadow-lg">
          Subscribe
        </button>
      </div>
      <p className="text-xs text-brand-text-light mt-6 italic font-sans">By signing up, you agree to our Terms of Service.</p>
    </div>
  );
};
