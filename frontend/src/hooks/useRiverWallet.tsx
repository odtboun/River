import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { 
  getOrCreateBurnerWallet, 
  hasBurnerWallet,
  ensureWalletFunded,
  getWalletBalance,
  exportBurnerWallet
} from '../lib/burner-wallet';

export type WalletMode = 'burner' | 'external' | 'none';

interface RiverWalletContextType {
  // Connection state
  connected: boolean;
  connecting: boolean;
  walletMode: WalletMode;
  
  // Public key
  publicKey: PublicKey | null;
  
  // Balance
  balance: number | null;
  
  // Actions
  connectBurner: () => Promise<void>;
  connectExternal: () => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  
  // Signing
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  
  // For Anchor compatibility
  anchorWallet: AnchorWallet | null;
  
  // Utils
  exportWallet: () => string | null;
  isBurnerWallet: boolean;
}

const RiverWalletContext = createContext<RiverWalletContextType | null>(null);

interface RiverWalletProviderProps {
  children: ReactNode;
}

export function RiverWalletProvider({ children }: RiverWalletProviderProps) {
  const externalWallet = useWallet();
  
  const [walletMode, setWalletMode] = useState<WalletMode>('none');
  const [burnerKeypair, setBurnerKeypair] = useState<Keypair | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Auto-connect burner wallet on mount if one exists
  useEffect(() => {
    if (hasBurnerWallet() && !externalWallet.connected) {
      connectBurner();
    }
  }, []);

  // Sync with external wallet
  useEffect(() => {
    if (externalWallet.connected && externalWallet.publicKey) {
      setWalletMode('external');
      setBurnerKeypair(null);
    }
  }, [externalWallet.connected, externalWallet.publicKey]);

  // Get the active public key
  const publicKey = walletMode === 'external' 
    ? externalWallet.publicKey 
    : walletMode === 'burner' 
      ? burnerKeypair?.publicKey ?? null
      : null;

  const connected = walletMode !== 'none' && publicKey !== null;

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    try {
      const bal = await getWalletBalance(publicKey);
      setBalance(bal);
    } catch {
      setBalance(null);
    }
  }, [publicKey]);

  // Refresh balance when wallet changes
  useEffect(() => {
    if (connected) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [connected, refreshBalance]);

  // Connect burner wallet
  const connectBurner = useCallback(async () => {
    setConnecting(true);
    try {
      // Disconnect external wallet if connected
      if (externalWallet.connected) {
        await externalWallet.disconnect();
      }
      
      // Get or create burner
      const keypair = getOrCreateBurnerWallet();
      setBurnerKeypair(keypair);
      setWalletMode('burner');
      
      // Ensure funded (airdrop if needed)
      await ensureWalletFunded(keypair.publicKey);
      
      // Refresh balance
      const bal = await getWalletBalance(keypair.publicKey);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to connect burner wallet:', err);
    } finally {
      setConnecting(false);
    }
  }, [externalWallet]);

  // Connect external wallet (just sets mode, actual connection handled by WalletMultiButton)
  const connectExternal = useCallback(() => {
    setWalletMode('external');
    setBurnerKeypair(null);
  }, []);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (walletMode === 'external') {
      await externalWallet.disconnect();
    }
    // Note: We don't clear burner wallet on disconnect, just switch mode
    setWalletMode('none');
    setBurnerKeypair(null);
    setBalance(null);
  }, [walletMode, externalWallet]);

  // Sign transaction
  const signTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
    if (walletMode === 'external' && externalWallet.signTransaction) {
      return await externalWallet.signTransaction(tx);
    }
    if (walletMode === 'burner' && burnerKeypair) {
      if (tx instanceof Transaction) {
        tx.sign(burnerKeypair);
        return tx;
      } else {
        // VersionedTransaction
        tx.sign([burnerKeypair]);
        return tx;
      }
    }
    throw new Error('No wallet connected');
  }, [walletMode, externalWallet, burnerKeypair]);

  // Sign all transactions
  const signAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
    if (walletMode === 'external' && externalWallet.signAllTransactions) {
      return await externalWallet.signAllTransactions(txs);
    }
    if (walletMode === 'burner' && burnerKeypair) {
      return txs.map(tx => {
        if (tx instanceof Transaction) {
          tx.sign(burnerKeypair);
        } else {
          tx.sign([burnerKeypair]);
        }
        return tx;
      });
    }
    throw new Error('No wallet connected');
  }, [walletMode, externalWallet, burnerKeypair]);

  // Sign message
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (walletMode === 'external' && externalWallet.signMessage) {
      return await externalWallet.signMessage(message);
    }
    if (walletMode === 'burner' && burnerKeypair) {
      // Use nacl for signing
      const { sign } = await import('tweetnacl');
      return sign.detached(message, burnerKeypair.secretKey);
    }
    throw new Error('No wallet connected or signing not supported');
  }, [walletMode, externalWallet, burnerKeypair]);

  // Create Anchor-compatible wallet
  const anchorWallet: AnchorWallet | null = connected && publicKey ? {
    publicKey,
    signTransaction,
    signAllTransactions,
  } : null;

  // Export wallet
  const exportWallet = useCallback(() => {
    if (walletMode === 'burner') {
      return exportBurnerWallet();
    }
    return null;
  }, [walletMode]);

  const value: RiverWalletContextType = {
    connected,
    connecting,
    walletMode,
    publicKey,
    balance,
    connectBurner,
    connectExternal,
    disconnect,
    refreshBalance,
    signTransaction,
    signAllTransactions,
    signMessage,
    anchorWallet,
    exportWallet,
    isBurnerWallet: walletMode === 'burner',
  };

  return (
    <RiverWalletContext.Provider value={value}>
      {children}
    </RiverWalletContext.Provider>
  );
}

export function useRiverWallet() {
  const context = useContext(RiverWalletContext);
  if (!context) {
    throw new Error('useRiverWallet must be used within a RiverWalletProvider');
  }
  return context;
}
