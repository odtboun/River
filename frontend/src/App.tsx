import { useState, useEffect, useCallback } from 'react';
import { EmployerFlow } from './components/EmployerFlow';
import { CandidateFlow } from './components/CandidateFlow';
import { LandingPage } from './components/LandingPage';

type View = 'landing' | 'employer' | 'candidate';

interface NegotiationData {
  id: string;
  employerMax: number | null;
  candidateMin: number | null;
  status: 'pending_employer' | 'pending_candidate' | 'complete';
  result: boolean | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Encode negotiation data for URL (base64)
function encodeNegotiation(data: NegotiationData): string {
  return btoa(JSON.stringify(data));
}

// Decode negotiation data from URL
function decodeNegotiation(encoded: string): NegotiationData | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function App() {
  const [view, setView] = useState<View>('landing');
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);

  // Check URL for negotiation data on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('d');
    
    if (encoded) {
      const data = decodeNegotiation(encoded);
      if (data) {
        setNegotiation(data);
        // If employer has set their max, show candidate flow
        if (data.employerMax !== null) {
          setView('candidate');
        } else {
          setView('employer');
        }
      }
    }
  }, []);

  // Update URL when negotiation changes (for employer flow)
  const updateUrl = useCallback((data: NegotiationData) => {
    const encoded = encodeNegotiation(data);
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    window.history.replaceState({}, '', url);
  }, []);

  const getShareUrl = useCallback((data: NegotiationData): string => {
    const encoded = encodeNegotiation(data);
    return `${window.location.origin}${window.location.pathname}?d=${encoded}`;
  }, []);

  const handleStartEmployer = useCallback(() => {
    const newNegotiation: NegotiationData = {
      id: generateId(),
      employerMax: null,
      candidateMin: null,
      status: 'pending_employer',
      result: null,
    };
    setNegotiation(newNegotiation);
    setView('employer');
  }, []);

  const handleEmployerSubmit = useCallback((maxBudget: number) => {
    if (!negotiation) return;
    
    const updated: NegotiationData = {
      ...negotiation,
      employerMax: maxBudget,
      status: 'pending_candidate',
    };
    setNegotiation(updated);
    updateUrl(updated);
  }, [negotiation, updateUrl]);

  const handleCandidateSubmit = useCallback((minSalary: number) => {
    if (!negotiation || negotiation.employerMax === null) return;
    
    const result = minSalary <= negotiation.employerMax;
    const updated: NegotiationData = {
      ...negotiation,
      candidateMin: minSalary,
      status: 'complete',
      result,
    };
    setNegotiation(updated);
    updateUrl(updated);
  }, [negotiation, updateUrl]);

  const handleReset = useCallback(() => {
    setView('landing');
    setNegotiation(null);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const shareUrl = negotiation ? getShareUrl(negotiation) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <a href="/" onClick={(e) => { e.preventDefault(); handleReset(); }} className="logo">
            <img src="/river.svg" alt="River" className="logo-icon" />
            <span className="logo-text">River</span>
          </a>
          <div className="network-badge">
            <span className="network-dot"></span>
            Solana Devnet
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'landing' && (
          <LandingPage 
            onStartEmployer={handleStartEmployer}
            onStartCandidate={() => setView('candidate')}
          />
        )}
        
        {view === 'employer' && (
          <EmployerFlow
            negotiation={negotiation}
            shareUrl={shareUrl}
            onSubmit={handleEmployerSubmit}
            onReset={handleReset}
          />
        )}
        
        {view === 'candidate' && (
          <CandidateFlow
            negotiation={negotiation}
            onSubmit={handleCandidateSubmit}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-links">
          <a href="https://noir-lang.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            Noir
          </a>
          <a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            Solana
          </a>
          <a href="https://github.com/reilabs/sunspot" target="_blank" rel="noopener noreferrer" className="footer-link">
            Sunspot
          </a>
        </div>
        <p className="footer-text">
          Zero-knowledge salary negotiation. Your numbers stay private.
        </p>
      </footer>
    </div>
  );
}

export default App;
