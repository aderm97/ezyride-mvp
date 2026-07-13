import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ezyride | Frictionless Luxury. Electric Airport Transfers.',
  description: 'Ezyride is a premium, 100% electric airport transfer service. Fixed pricing, live flight tracking, and professional chauffeurs — a silent, seamless transition from flight to ground.',
  keywords: ['airport transfer', 'electric chauffeur', 'e-hailing', 'EV ride', 'flight tracking', 'Ezyride', 'luxury airport pickup'],
  openGraph: {
    title: 'Ezyride | Frictionless Luxury. Electric Airport Transfers.',
    description: 'Premium, 100% electric airport transfers with live flight tracking, fixed pricing, and a chauffeur waiting when you land.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Ezyride',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ezyride | Frictionless Luxury',
    description: 'Premium, 100% electric airport transfers. A silent, seamless transition from flight to ground.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Providers } from '@/components/Providers';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} bg-background text-text-primary antialiased selection:bg-accent selection:text-on-accent overflow-x-hidden`}>
        <Providers>
          {children}
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
