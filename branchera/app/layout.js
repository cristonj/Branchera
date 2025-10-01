import "./globals.css";
import { Inter } from 'next/font/google';
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/components/DatabaseProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import FloatingActionButton from "@/components/FloatingActionButton";
import AppContent from "./AppContent";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: "Branches - Social media where you're a human, not a product",
    template: "%s | Branches"
  },
  description: "Social media where you're a human, not a product. Join meaningful conversations, fact-check content, and connect authentically without ads or algorithms.",
  keywords: ["Branches", "open source", "social media", "ad-free", "constructive dialogue", "fact-checking", "transparent", "AI-powered", "meaningful conversations", "no ads", "privacy-focused", "authentic connections"],
  authors: [{ name: "Branches Team" }],
  creator: "Branches",
  publisher: "Branches",
  category: "Social Media",
  classification: "Social Network",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://branches.live'), // Update this with your actual domain
  openGraph: {
    title: "Branches",
    description: "Social media where you're a human, not a product.",
    url: 'https://branches.live', // Update this with your actual domain
    siteName: 'Branches',
    images: [
      {
        url: '/og-image.png', // Will be served from public folder
        width: 1200,
        height: 630,
        alt: 'Branches',
        type: 'image/png',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Branches",
    description: "Social media where you're a human, not a product.",
    images: ['/og-image.png'], // Twitter will use this image
    creator: '@branches', // Update this with your actual Twitter handle
  },
  // Apple specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Branches',
    startupImage: [
      {
        url: '/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  // Icons for various platforms
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  // For Discord and other apps that use these meta tags
  other: {
    'discord:image': '/og-image.png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'theme-color': '#000000',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have them from Google Search Console and Bing Webmaster Tools
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />

        {/* Preload critical resources */}
        <link rel="preload" href="/logo.svg?v=3" as="image" type="image/svg+xml" />
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="//avatars.githubusercontent.com" />

        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Branches" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Branches" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Colors */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <DatabaseProvider>
            <ToastProvider>
              <AppContent>
                {children}
              </AppContent>
            </ToastProvider>
          </DatabaseProvider>
        </AuthProvider>

        <script dangerouslySetInnerHTML={{
          __html: `
            // Service Worker Registration
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }

            // Performance monitoring
            if ('PerformanceObserver' in window) {
              // Monitor Largest Contentful Paint
              const lcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                  }
                }
              });
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

              // Monitor First Input Delay
              const fidObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'first-input') {
                    console.log('FID:', entry.processingStart - entry.startTime);
                  }
                }
              });
              fidObserver.observe({ entryTypes: ['first-input'] });

              // Monitor Cumulative Layout Shift
              const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                  }
                }
                console.log('CLS:', clsValue);
              });
              clsObserver.observe({ entryTypes: ['layout-shift'] });
            }
          `
        }} />
      </body>
    </html>
  );
}
