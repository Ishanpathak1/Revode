// components/PerformanceOptimizer.jsx
import React from 'react';
import { Helmet } from 'react-helmet';

const PerformanceOptimizer = () => {
  return (
    <Helmet>
      {/* Preload important resources */}
      <link rel="preload" href="/fonts/your-main-font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      
      {/* Preconnect to important origins */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Browser hints */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
    </Helmet>
  );
};

export default PerformanceOptimizer;