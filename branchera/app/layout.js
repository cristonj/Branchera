import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/components/DatabaseProvider";

export const metadata = {
  title: "Branchera - Where Progress Happens",
  description: "Branchera is the social platform where clarity and logic beat distraction and misinformation. Our mission is to provide the best and most accssible social experience for critical discussion.",
  keywords: ["Branchera", "social", "platform", "critical", "discussion", "clarity", "logic", "debate", "misinformation", "distraction"],
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
    title: "Branchera - Where Progress Happens",
    description: "Branchera is the social platform where clarity and logic beat distraction and misinformation. Our mission is to provide the best and most accssible social experience for critical discussion.",
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
    title: "Branchera - Where Progress Happens",
    description: "Branchera is the social platform where clarity and logic beat distraction and misinformation. Our mission is to provide the best and most accssible social experience for critical discussion.",
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
            {children}
          </DatabaseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
