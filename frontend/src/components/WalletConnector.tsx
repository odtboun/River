import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRiverWallet } from '../hooks/useRiverWallet';

export function WalletConnector() {
  const { connecting: externalConnecting } = useWallet();
  const {
    connected,
    connecting,
    publicKey,
    balance,
    connectBurner,
    disconnect,
    isBurnerWallet
  } = useRiverWallet();

  const [showOptions, setShowOptions] = useState(false);

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // If connected, show wallet info
  if (connected && publicKey) {
    return (
      <div className="wallet-connected">
        <button
          className="wallet-info-btn"
          onClick={() => setShowOptions(!showOptions)}
        >
          <span className="wallet-indicator">
            {isBurnerWallet ? '🔥' : '👛'}
          </span>
          <span className="wallet-address">{truncateAddress(publicKey.toBase58())}</span>
          {balance !== null && (
            <span className="wallet-balance">{balance.toFixed(3)} SOL</span>
          )}
        </button>

        {showOptions && (
          <div className="wallet-dropdown">
            <div className="wallet-dropdown-info">
              <span className="wallet-type">{isBurnerWallet ? 'Local Wallet' : 'External Wallet'}</span>
              <span className="wallet-full-address">{publicKey.toBase58()}</span>
            </div>
            <button className="wallet-dropdown-btn" onClick={disconnect}>
              Disconnect
            </button>
            {!isBurnerWallet && (
              <button className="wallet-dropdown-btn" onClick={connectBurner}>
                Switch to Local Wallet
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Not connected - show connect options
  return (
    <div className="wallet-connect">
      {connecting || externalConnecting ? (
        <button className="btn btn-secondary" disabled>
          Connecting...
        </button>
      ) : (
        <>
          <button
            className="btn btn-primary wallet-quick-btn"
            onClick={connectBurner}
          >
            Quick Start
          </button>
          <div className="wallet-divider">or</div>
          <WalletMultiButton />
        </>
      )}
    </div>
  );
}

// Simpler inline version for header
export function WalletButton() {
  const {
    connected,
    connecting,
    publicKey,
    balance,
    connectBurner,
    isBurnerWallet
  } = useRiverWallet();
  const { connecting: externalConnecting, select, wallets } = useWallet();

  const [showMenu, setShowMenu] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="wallet-btn-container">
        <button
          className="wallet-btn connected"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="wallet-icon">{isBurnerWallet ? '🔥' : '👛'}</span>
          <span>{truncateAddress(publicKey.toBase58())}</span>
          {balance !== null && <span className="wallet-bal">{balance.toFixed(2)}</span>}
        </button>
        {showMenu && (
          <WalletMenu onClose={() => setShowMenu(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="wallet-btn-container">
      <button
        className="wallet-btn"
        onClick={() => setShowMenu(!showMenu)}
        disabled={connecting || externalConnecting}
      >
        {connecting || externalConnecting ? 'Connecting...' : 'Connect'}
      </button>
      {showMenu && (
        <div className="wallet-menu">
          <button
            className="wallet-menu-item primary"
            onClick={() => { connectBurner(); setShowMenu(false); }}
          >
            <span>🔥</span>
            <div>
              <strong>Quick Start (for tests only)</strong>
              <small>No wallet needed</small>
            </div>
          </button>
          <div className="wallet-menu-divider">or connect wallet</div>
          {wallets.filter(w => w.readyState === 'Installed').map(wallet => (
            <button
              key={wallet.adapter.name}
              className="wallet-menu-item"
              onClick={() => { select(wallet.adapter.name); setShowMenu(false); }}
            >
              <img src={wallet.adapter.icon} alt="" width={24} height={24} />
              <span>{wallet.adapter.name}</span>
            </button>
          ))}
          {wallets.filter(w => w.readyState === 'Installed').length === 0 && (
            <div className="wallet-menu-empty">
              No wallets detected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WalletMenu({ onClose }: { onClose: () => void }) {
  const {
    publicKey,
    balance,
    disconnect,
    isBurnerWallet,
    exportWallet,
    refreshBalance
  } = useRiverWallet();

  const handleExport = () => {
    const data = exportWallet();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'river-wallet-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
    }
  };

  return (
    <>
      <div className="wallet-menu-backdrop" onClick={onClose} />
      <div className="wallet-menu">
        <div className="wallet-menu-header">
          <span>{isBurnerWallet ? '🔥 Local Wallet' : '👛 External Wallet'}</span>
          <button className="wallet-menu-close" onClick={onClose}>×</button>
        </div>
        <div className="wallet-menu-address" onClick={handleCopyAddress}>
          {publicKey?.toBase58()}
          <small>Click to copy</small>
        </div>
        <div className="wallet-menu-balance">
          <span>{balance?.toFixed(4) || '0'} SOL</span>
          <button onClick={refreshBalance}>↻</button>
        </div>
        {isBurnerWallet && (
          <button className="wallet-menu-item" onClick={handleExport}>
            <span>💾</span>
            <span>Export Backup</span>
          </button>
        )}
        <button className="wallet-menu-item danger" onClick={() => { disconnect(); onClose(); }}>
          <span>🚪</span>
          <span>Disconnect</span>
        </button>
      </div>
    </>
  );
}
