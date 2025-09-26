import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/components/DatabaseProvider";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata = {
  title: "Branchera - Social Media That Gets Out of Your Way",
  description: "The open source, ad-free social platform designed for constructive dialogue instead of endless engagement. AI-powered fact-checking, transparent discussions, and a community that respects your intelligence.",
  keywords: ["Branchera", "open source", "social media", "ad-free", "constructive dialogue", "fact-checking", "transparent", "AI-powered", "meaningful conversations", "no ads"],
  authors: [{ name: "Branchera Team" }],
  creator: "Branchera",
  publisher: "Branchera",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://branchera.org'), // Update this with your actual domain
  openGraph: {
    title: "Branchera - Social Media That Gets Out of Your Way",
    description: "The open source, ad-free social platform designed for constructive dialogue instead of endless engagement. AI-powered fact-checking, transparent discussions, and a community that respects your intelligence.",
    url: 'https://branchera.org', // Update this with your actual domain
    siteName: 'Branchera',
    images: [
      {
        url: '/og-image.svg', // Will be served from public folder
        width: 1200,
        height: 630,
        alt: 'Branchera - Where Progress Happens',
        type: 'image/svg+xml',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Branchera - Social Media That Gets Out of Your Way",
    description: "The open source, ad-free social platform designed for constructive dialogue instead of endless engagement. AI-powered fact-checking, transparent discussions, and a community that respects your intelligence.",
    images: ['/og-image.svg'], // Twitter will use this image
    creator: '@branchera', // Update this with your actual Twitter handle
  },
  // Apple specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Branchera',
  },
  // Icons for various platforms
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
  },
  // For Discord and other apps that use these meta tags
  other: {
    'discord:image': '/og-image.svg',
    'og:image:width': '1200',
    'og:image:height': '630',
    'theme-color': '#667eea',
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <AuthProvider>
          <DatabaseProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </DatabaseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
