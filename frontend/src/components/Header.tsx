'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass border-b border-white/10"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center font-bold">
            R
          </div>
          <span className="text-xl font-bold gradient-text">Infinite Relic</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link
            href="https://docs.infinite-relic.io"
            target="_blank"
            className="hover:text-primary transition-colors"
          >
            Docs
          </Link>
        </nav>

        <ConnectButton />
      </div>
    </motion.header>
  );
}
