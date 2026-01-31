import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { EmployerFlow } from './components/EmployerFlow';
import { CandidateFlow } from './components/CandidateFlow';
import { LandingPage } from './components/LandingPage';
import { RiverClient, NegotiationData, getNegotiationPDA, fetchNegotiation, RPC_ENDPOINT } from './lib';

type View = 'landing' | 'employer' | 'candidate';

function App() {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  
  const [view, setView] = useState<View>('landing');
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [negotiationId, setNegotiationId] = useState<BN | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Check URL for negotiation ID on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('n');
    
    if (idParam) {
      try {
        const id = new BN(idParam);
        setNegotiationId(id);
        // Load negotiation data
        loadNegotiation(id);
        setView('candidate');
      } catch {
        console.error('Invalid negotiation ID in URL');
      }
    }
  }, []);

  // Load negotiation from chain
  const loadNegotiation = useCallback(async (id: BN) => {
    try {
      const [pda] = getNegotiationPDA(id);
      const conn = new Connection(RPC_ENDPOINT, 'confirmed');
      const data = await fetchNegotiation(conn, pda);
      if (data) {
        setNegotiation(data);
      }
    } catch (err) {
      console.error('Failed to load negotiation:', err);
    }
  }, []);

  // Refresh negotiation data periodically
  useEffect(() => {
    if (!negotiationId) return;

    const interval = setInterval(() => {
      loadNegotiation(negotiationId);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [negotiationId, loadNegotiation]);

  // Generate share URL
  const getShareUrl = useCallback((id: BN): string => {
    return `${window.location.origin}${window.location.pathname}?n=${id.toString()}`;
  }, []);

  // Handle employer starting a new negotiation
  const handleStartEmployer = useCallback(() => {
    setView('employer');
    setNegotiation(null);
    setNegotiationId(null);
    setError(null);
    setTxSignature(null);
  }, []);

  // Handle employer creating negotiation on-chain
  const handleCreateNegotiation = useCallback(async () => {
    if (!connected || !wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new RiverClient(wallet as any);
      const { negotiationId: newId, tx } = await client.createNegotiation();
      
      setNegotiationId(newId);
      setTxSignature(tx);
      
      // Update URL
      window.history.replaceState({}, '', `?n=${newId.toString()}`);
      
      // Load the negotiation data
      await loadNegotiation(newId);
    } catch (err: any) {
      console.error('Failed to create negotiation:', err);
      setError(err.message || 'Failed to create negotiation');
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, loadNegotiation]);

  // Handle employer submitting budget
  const handleEmployerSubmit = useCallback(async (maxBudget: number) => {
    if (!connected || !wallet.publicKey || !negotiationId) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new RiverClient(wallet as any);
      const tx = await client.submitEmployerBudget(negotiationId, maxBudget);
      setTxSignature(tx);
      
      // Reload negotiation data
      await loadNegotiation(negotiationId);
    } catch (err: any) {
      console.error('Failed to submit budget:', err);
      setError(err.message || 'Failed to submit budget');
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, negotiationId, loadNegotiation]);

  // Handle candidate joining negotiation
  const handleJoinNegotiation = useCallback(async () => {
    if (!connected || !wallet.publicKey || !negotiationId) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new RiverClient(wallet as any);
      const tx = await client.joinNegotiation(negotiationId);
      setTxSignature(tx);
      
      // Reload negotiation data
      await loadNegotiation(negotiationId);
    } catch (err: any) {
      console.error('Failed to join negotiation:', err);
      setError(err.message || 'Failed to join negotiation');
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, negotiationId, loadNegotiation]);

  // Handle candidate submitting requirement
  const handleCandidateSubmit = useCallback(async (minSalary: number) => {
    if (!connected || !wallet.publicKey || !negotiationId) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new RiverClient(wallet as any);
      const tx = await client.submitCandidateRequirement(negotiationId, minSalary);
      setTxSignature(tx);
      
      // Reload negotiation data
      await loadNegotiation(negotiationId);
    } catch (err: any) {
      console.error('Failed to submit requirement:', err);
      setError(err.message || 'Failed to submit requirement');
    } finally {
      setLoading(false);
    }
  }, [connected, wallet, negotiationId, loadNegotiation]);

  // Reset to landing page
  const handleReset = useCallback(() => {
    setView('landing');
    setNegotiation(null);
    setNegotiationId(null);
    setError(null);
    setTxSignature(null);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const shareUrl = negotiationId ? getShareUrl(negotiationId) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <a href="/" onClick={(e) => { e.preventDefault(); handleReset(); }} className="logo">
            <img src="/river.svg" alt="River" className="logo-icon" />
            <span className="logo-text">River</span>
          </a>
          <div className="header-right">
            <div className="network-badge">
              <span className="network-dot"></span>
              Solana Devnet
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}

        {view === 'landing' && (
          <LandingPage 
            onStartEmployer={handleStartEmployer}
            onStartCandidate={() => setView('candidate')}
          />
        )}
        
        {view === 'employer' && (
          <EmployerFlow
            connected={connected}
            negotiation={negotiation}
            negotiationId={negotiationId}
            shareUrl={shareUrl}
            loading={loading}
            txSignature={txSignature}
            onCreateNegotiation={handleCreateNegotiation}
            onSubmit={handleEmployerSubmit}
            onReset={handleReset}
          />
        )}
        
        {view === 'candidate' && (
          <CandidateFlow
            connected={connected}
            negotiation={negotiation}
            negotiationId={negotiationId}
            loading={loading}
            txSignature={txSignature}
            onJoin={handleJoinNegotiation}
            onSubmit={handleCandidateSubmit}
            onReset={handleReset}
            walletAddress={publicKey?.toBase58() || null}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-links">
          <a href="https://magicblock.gg" target="_blank" rel="noopener noreferrer" className="footer-link">
            MagicBlock
          </a>
          <a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            Solana
          </a>
          <a href="https://github.com/odtboun/River" target="_blank" rel="noopener noreferrer" className="footer-link">
            GitHub
          </a>
        </div>
        <p className="footer-text">
          Confidential salary negotiation powered by TEE. Your numbers stay private.
        </p>
      </footer>
    </div>
  );
}

export default App;
