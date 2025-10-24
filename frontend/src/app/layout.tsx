import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Infinite Relic - Real-World-Yield NFTs',
  description: 'Mint time-locked relics, earn baseline 5% + boosted yield, trade anytime on OpenSea.',
  keywords: ['DeFi', 'NFT', 'Yield', 'RWA', 'Arbitrum', 'T-Bills'],
  openGraph: {
    title: 'Infinite Relic',
    description: 'Real-World-Asset backed NFT yield system',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinite Relic',
    description: 'Real-World-Asset backed NFT yield system',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
