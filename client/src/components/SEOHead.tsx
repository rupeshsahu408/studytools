import { Helmet } from "react-helmet-async";

const SITE_NAME = "Topper 2.0";
const BASE_URL = "https://topper2.plyndrox.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "India's #1 AI study platform for Bihar Board Class 11 & 12. Get AI-generated notes, question banks, flashcards, simulations & doubt chat for NCERT Physics, Chemistry, Math and Biology.";
const DEFAULT_KEYWORDS =
  "Bihar Board Class 11 notes, Bihar Board Class 12 notes, NCERT AI notes, AI study platform India, Bihar Board exam preparation 2025, NCERT question bank, AI flashcards Class 11 12, Bihar Board science notes, NCERT AI tutor";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noIndex?: boolean;
  jsonLd?: object | object[];
  author?: string;
  publishedTime?: string;
  section?: string;
}

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noIndex = false,
  jsonLd,
  author,
  publishedTime,
  section,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Free AI Study Notes for Bihar Board Class 11 & 12`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {author && <meta name="author" content={author} />}

      {/* ── Open Graph ── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {section && <meta property="article:section" content={section} />}

      {/* ── Twitter ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@rupesh__gupta_" />

      {/* ── Structured Data ── */}
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
