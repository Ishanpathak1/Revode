// components/SEOSchema.jsx
import React from 'react';
import { Helmet } from 'react-helmet';

const SEOSchema = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Revode",
    "url": "https://revode.vercel.app",
    "description": "A platform for practicing coding problems and tracking programming progress",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://revode.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Revode",
    "applicationCategory": "EducationalApplication",
    "description": "A comprehensive platform for practicing coding problems, tracking progress, and improving programming skills",
    "url": "https://revode.vercel.app",
    "author": {
      "@type": "Person",
      "name": "Ishan Pathak",
      "url": "mailto:ishan.pathak2711@gmail.com"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Daily coding problems",
      "Progress tracking system",
      "Streak maintenance",
      "Global ranking system",
      "Achievement badges",
      "Performance analytics",
      "Problem filtering by difficulty",
      "Search functionality",
      "User dashboard"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100",
      "bestRating": "5",
      "worstRating": "1"
    },
    "operatingSystem": "Any",
    "applicationCategory": "Education, Programming"
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revode",
    "url": "https://revode.vercel.app",
    "logo": "https://revode.vercel.app/logo.png",
    "sameAs": [
      "https://github.com/Ishanpathak1/revode",
      "https://www.linkedin.com/in/ishan-pathak-96852a1b7/" // Add your LinkedIn profile
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "ishan.pathak2711@gmail.com",
      "contactType": "customer service"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};

export default SEOSchema;