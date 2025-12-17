import type { Metadata } from "next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: "%s | Market Pulse",
    default: "Market Pulse: AI-Powered Volatility Prediction",
  },
  description:
    "AI-powered market volatility prediction platform. Analyze VIX regimes, volatility forecasts, and market anomalies to make informed investment decisions. Built with Google ADK, BigQuery, and Vertex AI.",
  keywords: [
    "Market Pulse",
    "Volatility Prediction",
    "VIX Analysis",
    "Stock Analysis",
    "BigQuery",
    "ADK Agent",
    "Google Cloud",
    "Vertex AI",
    "Market Forecasts",
    "AI Platform",
    "Market Intelligence",
    "Financial Analysis",
  ],
  openGraph: {
    title: "Market Pulse: AI-Powered Volatility Prediction",
    description:
      "AI-powered market volatility prediction platform. Analyze VIX regimes, volatility forecasts, and market anomalies for better investment decisions.",
    url: new URL(defaultUrl),
    siteName: "Market Pulse",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Market Pulse - AI-powered volatility prediction platform showing VIX analysis and market forecasts.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Market Pulse: AI-Powered Volatility Prediction",
    description:
      "AI-powered volatility prediction. Analyze VIX regimes, forecasts, and market anomalies.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const generateLegalMetadata = (
  title: string,
  description: string
): Metadata => {
  return {
    title: `${title} | Market Pulse`,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title} | Market Pulse`,
      description,
      type: "website",
    },
  };
};
