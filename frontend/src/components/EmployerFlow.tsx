import { useState, useCallback } from 'react';
import { BN } from '@coral-xyz/anchor';
import { NegotiationData } from '../lib';

interface EmployerFlowProps {
  connected: boolean;
  negotiation: NegotiationData | null;
  negotiationId: BN | null;
  shareUrl: string | null;
  loading: boolean;
  txSignature: string | null;
  teeActive?: boolean;
  isBurnerWallet?: boolean;
  onCreateNegotiation: () => Promise<void>;
  onSubmit: (maxBudget: number) => Promise<void>;
  onReset: () => void;
}

export function EmployerFlow({
  connected,
  negotiation,
  negotiationId,
  shareUrl,
  loading,
  txSignature,
  teeActive = false,
  isBurnerWallet = false,
  onCreateNegotiation,
  onSubmit,
  onReset
}: EmployerFlowProps) {
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setter(raw);
  }, []);

  const total = (
    (parseInt(baseSalary) || 0) +
    (parseInt(bonus) || 0) +
    (parseInt(equity) || 0)
  ).toString();

  const handleSubmit = useCallback(async () => {
    const value = parseInt(total);
    if (value > 0) {
      await onSubmit(value);
    }
  }, [total, onSubmit]);

  const handleCopy = useCallback(async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const formatNumber = (val: string) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('en-US');
  };

  // Step 0: Connect wallet & create negotiation
  if (!connected || !negotiationId) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Start a Negotiation</h1>
          <p className="page-description">
            Create a private salary negotiation. Your budget will be kept confidential.
          </p>
        </div>

        {!connected ? (
          <div className="card">
            <div className="status-waiting">
              <div className="status-icon">👋</div>
              <div className="status-title">Get Started</div>
              <div className="status-description">
                Click "Quick Start" above to begin - no wallet needed!
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="card-text">
              You'll create a negotiation session on Solana. This requires a small transaction fee.
            </p>
            <button
              className="btn btn-primary btn-full btn-large"
              onClick={onCreateNegotiation}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Negotiation'}
            </button>
          </div>
        )}

        {isBurnerWallet && !teeActive && (
          <div className="warning-banner" style={{ marginTop: '1.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <strong>Privacy Notice:</strong> Using burner wallet - values will be public on-chain.
              Connect a real wallet (Phantom, Solflare, etc.) for private mode.
            </div>
          </div>
        )}

        <div className={`privacy-badge ${teeActive ? 'tee-active' : ''}`} style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{teeActive ? 'TEE active - values encrypted in hardware' : 'Connect wallet to enable TEE privacy'}</span>
        </div>
      </>
    );
  }

  // Step 1: Enter budget (negotiation created but budget not submitted)
  // Use hasEmployerSubmitted flag since status doesn't change on submission
  const needsBudgetInput = negotiation && !negotiation.hasEmployerSubmitted;

  if (needsBudgetInput) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Set your budget</h1>
          <p className="page-description">
            Enter the maximum salary you're willing to offer. This number will be processed securely.
          </p>
        </div>

        <div className="card">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Base Salary</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="100,000"
                value={formatNumber(baseSalary)}
                onChange={(e) => handleInputChange(e, setBaseSalary)}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Signing Bonus</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="20,000"
                  value={formatNumber(bonus)}
                  onChange={(e) => handleInputChange(e, setBonus)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Equity Value</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="50,000"
                  value={formatNumber(equity)}
                  onChange={(e) => handleInputChange(e, setEquity)}
                />
              </div>
            </div>
          </div>

          <div style={{
            background: '#f3f4f6',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#4b5563', fontWeight: 500 }}>Total Package</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
              ${parseInt(total) > 0 ? parseInt(total).toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full btn-large"
          onClick={handleSubmit}
          disabled={!total || parseInt(total) <= 0 || loading}
        >
          {loading ? 'Submitting...' : 'Lock in Budget'}
        </button>

        {txSignature && (
          <div className="tx-link" style={{ marginTop: '1rem' }}>
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View creation transaction
            </a>
          </div>
        )}

        <div className="privacy-badge" style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{teeActive ? 'This amount will be encrypted in TEE - never revealed' : 'This amount will never be revealed to the candidate'}</span>
        </div>
      </>
    );
  }

  // Step 2: Share link & wait for candidate (employer has submitted, waiting for candidate)
  const waitingForCandidate = negotiation &&
    negotiation.hasEmployerSubmitted &&
    !negotiation.hasCandidateSubmitted &&
    negotiation.status !== 'complete' &&
    negotiation.status !== 'finalized';

  if (waitingForCandidate) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Share with candidate</h1>
          <p className="page-description">
            Your budget is locked on-chain. Send this link to your candidate.
          </p>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Candidate Link</label>
            <div className="link-box">
              <input
                type="text"
                className="link-input"
                value={shareUrl || ''}
                readOnly
              />
              <button className="btn btn-secondary btn-copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="status-waiting">
            <div className="status-icon">⏳</div>
            <div className="status-title">Waiting for candidate</div>
            <div className="status-description">
              The candidate needs to connect their wallet and submit their requirement
            </div>
          </div>
        </div>

        {txSignature && (
          <div className="tx-link" style={{ marginTop: '1rem' }}>
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </div>
        )}

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Start New Negotiation
        </button>

        {copied && <div className="copy-feedback">Link copied to clipboard</div>}
      </>
    );
  }

  // Step 3: Show result
  if (negotiation?.status === 'complete' || negotiation?.status === 'finalized') {
    const isMatch = negotiation.result === 'match';

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Negotiation Complete</h1>
          <p className="page-description">
            Both parties have submitted their numbers. Here's the result.
          </p>
        </div>

        <div className="card result-card">
          <div className="result-icon">{isMatch ? '✓' : '✗'}</div>
          <h2 className={`result-title ${isMatch ? 'match' : 'no-match'}`}>
            {isMatch ? 'Match Found' : 'No Match'}
          </h2>
          <p className="result-description">
            {isMatch
              ? 'Great news! The candidate\'s minimum is within your budget.'
              : 'The candidate\'s minimum requirement exceeds your budget.'}
          </p>
        </div>

        {txSignature && (
          <div className="tx-link" style={{ marginTop: '1rem' }}>
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </div>
        )}

        <button className="btn btn-primary btn-full btn-large" onClick={onReset}>
          Start New Negotiation
        </button>
      </>
    );
  }

  // Fallback: waiting for data
  return (
    <div className="card">
      <div className="status-waiting">
        <div className="status-icon">⏳</div>
        <div className="status-title">Loading...</div>
        <div className="status-description">
          Fetching negotiation data from chain
        </div>
      </div>
    </div>
  );
}
