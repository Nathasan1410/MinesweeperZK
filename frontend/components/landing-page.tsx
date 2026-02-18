import { BarChart3 } from 'lucide-react';

interface LandingPageProps {
  onConnectWallet: () => void;
}

export function LandingPage({ onConnectWallet }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="absolute top-0 left-0 p-6">
        <h1 className="text-sm font-bold tracking-widest" style={{ letterSpacing: '0.2em' }}>
          MINESWEEPER.ZK
        </h1>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center max-w-2xl space-y-6 mb-12">
        <h2 className="text-5xl md:text-6xl font-bold uppercase tracking-tight" style={{ letterSpacing: '0.02em' }}>
          PROVABLY FAIR.<br />ZK BATTLES.
        </h2>

        <p className="text-lg text-secondary">
          Commit your seed. Reveal the truth. Win XLM.
        </p>

        {/* Connect Wallet Button */}
        <button
          onClick={onConnectWallet}
          className="w-full max-w-xs py-3 px-6 bg-foreground text-background font-semibold uppercase tracking-wide border border-border-color transition-colors hover:bg-opacity-90"
          style={{ letterSpacing: '0.05em' }}
        >
          CONNECT WALLET
        </button>
      </div>

      {/* Live Stats Ticker */}
      <div className="w-full max-w-2xl">
        <div className="border border-border-color px-6 py-4 flex items-center justify-between text-center">
          <div className="flex-1 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 mr-2 text-success" />
            <span className="text-secondary text-sm">POOL:</span>
            <span className="font-mono font-bold text-success ml-2">124,050 XLM</span>
          </div>
          <div className="text-border-color">|</div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-secondary text-sm">LIVE:</span>
            <span className="font-mono font-bold text-success ml-2">42 GAMES</span>
          </div>
          <div className="text-border-color">|</div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-secondary text-sm">PAID:</span>
            <span className="font-mono font-bold text-success ml-2">500k+ XLM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
