export default function Footer() {
  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Infinite Relic</h3>
            <p className="text-sm text-gray-400">
              Real-World-Asset backed NFT yield system. Earn 5-25% APR on tokenized T-Bills.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="https://docs.infinite-relic.io" target="_blank" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://twitter.com/infiniterelic" target="_blank" className="hover:text-primary transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://t.me/infiniterelic" target="_blank" className="hover:text-primary transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="https://discord.gg/infiniterelic" target="_blank" className="hover:text-primary transition-colors">
                  Discord
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="hover:text-primary transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>&copy; 2025 Infinite Relic. All rights reserved.</p>
          <p className="mt-2">
            Built on <span className="text-primary">Arbitrum</span> · Powered by{' '}
            <span className="text-secondary">Ondo Finance</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
