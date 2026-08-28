import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Revision Solved',
  description:
    'A two-repository revision tracker that shows coverage, due topics, urgency, and revision history.',
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Revision Solved',
    description: 'Know what to revise next across both study repositories.',
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1536,
        height: 864,
        alt: 'Revision Solved — Know what to revise next.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revision Solved',
    description: 'Know what to revise next across both study repositories.',
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
