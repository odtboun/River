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

// Simple in-memory storage for demo (would be backend in production)
const negotiations = new Map<string, NegotiationData>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function App() {
  const [view, setView] = useState<View>('landing');
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);

  // Check URL for negotiation ID on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('n');
    if (id) {
      const existing = negotiations.get(id);
      if (existing) {
        setNegotiationId(id);
        setNegotiation(existing);
        setView('candidate');
      } else {
        // Create placeholder for this negotiation
        const newNegotiation: NegotiationData = {
          id,
          employerMax: null,
          candidateMin: null,
          status: 'pending_employer',
          result: null,
        };
        negotiations.set(id, newNegotiation);
        setNegotiationId(id);
        setNegotiation(newNegotiation);
        setView('candidate');
      }
    }
  }, []);

  const handleStartEmployer = useCallback(() => {
    const id = generateId();
    const newNegotiation: NegotiationData = {
      id,
      employerMax: null,
      candidateMin: null,
      status: 'pending_employer',
      result: null,
    };
    negotiations.set(id, newNegotiation);
    setNegotiationId(id);
    setNegotiation(newNegotiation);
    setView('employer');
  }, []);

  const handleEmployerSubmit = useCallback((maxBudget: number) => {
    if (!negotiationId || !negotiation) return;
    
    const updated: NegotiationData = {
      ...negotiation,
      employerMax: maxBudget,
      status: 'pending_candidate',
    };
    negotiations.set(negotiationId, updated);
    setNegotiation(updated);
  }, [negotiationId, negotiation]);

  const handleCandidateSubmit = useCallback((minSalary: number) => {
    if (!negotiationId || !negotiation || negotiation.employerMax === null) return;
    
    const result = minSalary <= negotiation.employerMax;
    const updated: NegotiationData = {
      ...negotiation,
      candidateMin: minSalary,
      status: 'complete',
      result,
    };
    negotiations.set(negotiationId, updated);
    setNegotiation(updated);
  }, [negotiationId, negotiation]);

  const handleReset = useCallback(() => {
    setView('landing');
    setNegotiationId(null);
    setNegotiation(null);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const shareUrl = negotiationId 
    ? `${window.location.origin}${window.location.pathname}?n=${negotiationId}`
    : null;

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
        
        {view === 'employer' && negotiation && (
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
