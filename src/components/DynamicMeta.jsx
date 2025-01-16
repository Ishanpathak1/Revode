// components/DynamicMeta.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const DynamicMeta = ({ title, description }) => {
  const location = useLocation();
  const baseUrl = 'https://revode.vercel.app';
  const currentUrl = `${baseUrl}${location.pathname}`;

  const pageMetadata = {
    '/': {
      title: 'Revode - Problem Practice Platform',
      description: 'Practice coding problems, track progress, and improve your programming skills'
    },
    '/dashboard': {
      title: 'Revode Dashboard - Track Your Coding Progress',
      description: 'View your coding progress, solved problems, and achievements'
    },
    '/streakPage': {
      title: 'Coding Streaks - Maintain Your Daily Practice',
      description: 'Track your daily coding practice and maintain your streak'
    },
    '/rank': {
      title: 'Global Rankings - Compare Your Progress',
      description: 'See how you rank among other developers and track your improvement'
    },
    '/blog': {
      title: 'Revode Blog - Coding Tips and Updates',
      description: 'Read about coding best practices, tips, and platform updates'
    }
  };

  const currentPage = pageMetadata[location.pathname] || pageMetadata['/'];

  return (
    <Helmet>
      <title>{title || currentPage.title}</title>
      <meta name="description" content={description || currentPage.description} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title || currentPage.title} />
      <meta property="og:description" content={description || currentPage.description} />
      <meta property="og:url" content={currentUrl} />
      
      {/* Twitter tags */}
      <meta name="twitter:title" content={title || currentPage.title} />
      <meta name="twitter:description" content={description || currentPage.description} />
    </Helmet>
  );
};

export default DynamicMeta;