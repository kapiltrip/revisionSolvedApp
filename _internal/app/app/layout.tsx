import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './maven-color.css';

const siteUrl = 'https://revision-solved.kapiltripathi267.chatgpt.site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Maven Silicon Revision',
  title: 'Maven Silicon Revision',
  description:
    'Maven Silicon Digital assignments, evidence-based recall, instructor reviews and trainer questions.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Maven Silicon Revision',
    statusBarStyle: 'black-translucent',
  },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Maven Silicon Revision',
    description:
      'Recall, explain and apply your Maven Silicon Digital assignments.',
  },
  twitter: {
    card: 'summary',
    title: 'Maven Silicon Revision',
    description:
      'Recall, explain and apply your Maven Silicon Digital assignments.',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#6d28d9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vendor/katex/katex.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
