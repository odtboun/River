import { useState, useCallback, useEffect } from 'react';
import { BN } from '@coral-xyz/anchor';
import { NegotiationData } from '../lib';

interface CandidateFlowProps {
  connected: boolean;
  negotiation: NegotiationData | null;
  negotiationId: BN | null;
  loading: boolean;
  txSignature: string | null;
  teeActive?: boolean;
  isBurnerWallet?: boolean;
  walletAddress: string | null;
  activeFields?: string[];
  matchDetails?: {
    baseMatch: boolean;
    bonusMatch: boolean;
    equityMatch: boolean;
    totalMatch: boolean;
  } | null;
  onJoin: () => Promise<void>;
  onSubmit: (base: number, bonus: number, equity: number, total: number) => Promise<void>;
  onReset: () => void;
}

export function CandidateFlow({
  connected,
  negotiation,
  negotiationId,
  loading,
  txSignature,
  teeActive = false,
  isBurnerWallet = false,
  walletAddress,
  activeFields = ['base'],
  matchDetails,
  onJoin,
  onSubmit,
  onReset
}: CandidateFlowProps) {
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');

  // Total Logic
  const [total, setTotal] = useState('');
  const [isTotalManual, setIsTotalManual] = useState(false);

  // Determine mode
  const isBasicMode = activeFields.length === 1 && activeFields[0] === 'base';

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setter(raw);
  }, []);

  // Auto-calculate total if not manually edited
  useEffect(() => {
    if (!isTotalManual) {
      const sum = (
        (parseInt(baseSalary) || 0) +
        (parseInt(bonus) || 0) +
        (parseInt(equity) || 0)
      );
      setTotal(sum > 0 ? sum.toString() : '');
    }
  }, [baseSalary, bonus, equity, isTotalManual]);

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setTotal(raw);
    setIsTotalManual(true);
  };

  const handleSubmit = useCallback(async () => {
    if (isBasicMode) {
      // In basic mode, the single input represents the base/total
      const value = parseInt(baseSalary);
      if (value > 0) {
        // For basic mode, bonus and equity are 0
        await onSubmit(value, 0, 0, value);
      }
    } else {
      // Complex mode
      const baseVal = parseInt(baseSalary) || 0;
      const bonusVal = parseInt(bonus) || 0;
      const equityVal = parseInt(equity) || 0;

      if (baseVal > 0 || bonusVal > 0 || equityVal > 0) {
        const totalVal = parseInt(total.replace(/,/g, '')) || 0;
        await onSubmit(baseVal, bonusVal, equityVal, totalVal);
      }
    }
  }, [baseSalary, bonus, equity, isBasicMode, onSubmit]);

  const formatNumber = (val: string) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('en-US');
  };

  // Check if candidate has already joined
  const hasJoined = negotiation?.candidate === walletAddress;

  // No negotiation ID in URL
  if (!negotiationId) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Join a Negotiation</h1>
          <p className="page-description">
            You need a link from an employer to join their negotiation.
          </p>
        </div>

        <div className="card">
          <div className="status-waiting">
            <div className="status-icon">🔗</div>
            <div className="status-title">No negotiation found</div>
            <div className="status-description">
              Ask the employer to send you a negotiation link
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Go to Homepage
        </button>
      </>
    );
  }

  // Waiting for negotiation data to load
  if (!negotiation) {
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

  // Negotiation exists but employer hasn't submitted budget yet
  if (!negotiation.hasEmployerSubmitted) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Waiting for employer</h1>
          <p className="page-description">
            The employer hasn't set their budget yet. Please wait.
          </p>
        </div>

        <div className="card">
          <div className="status-waiting">
            <div className="status-icon">⏳</div>
            <div className="status-title">Negotiation not ready</div>
            <div className="status-description">
              The employer needs to submit their budget first
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Go to Homepage
        </button>
      </>
    );
  }

  // Need to connect
  if (!connected) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Join Negotiation</h1>
          <p className="page-description">
            Get started to participate in this negotiation.
          </p>
        </div>

        <div className="card">
          <div className="status-waiting">
            <div className="status-icon">👋</div>
            <div className="status-title">Get Started</div>
            <div className="status-description">
              Click "Quick Start" above - no wallet needed!
            </div>
          </div>
        </div>

        <div className={`privacy-badge ${teeActive ? 'tee-active' : ''}`} style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{teeActive ? 'TEE active - values encrypted in hardware' : 'Your salary requirement will remain private'}</span>
        </div>
      </>
    );
  }

  // Need to join the negotiation first
  if (!hasJoined && negotiation.status !== 'complete' && negotiation.status !== 'finalized') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Join Negotiation</h1>
          <p className="page-description">
            The employer has created a negotiation. Join to submit your salary requirement.
          </p>
        </div>

        <div className="card">
          <p className="card-text">
            By joining, you'll be able to submit your minimum salary requirement.
            The comparison will happen securely without revealing either party's number.
          </p>
          <button
            className="btn btn-primary btn-full btn-large"
            onClick={onJoin}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Negotiation'}
          </button>
        </div>

        <div className={`privacy-badge ${teeActive ? 'tee-active' : ''}`} style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{teeActive ? 'TEE active - values encrypted in hardware' : 'All values processed securely'}</span>
        </div>
      </>
    );
  }

  // Ready for candidate input (joined but not submitted)
  if (hasJoined && !negotiation.hasCandidateSubmitted && negotiation.status !== 'complete' && negotiation.status !== 'finalized') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Enter your requirement</h1>
          <p className="page-description">
            The employer has set their budget. Enter your minimum salary requirement to see if there's a match.
          </p>
        </div>

        <div className="card">
          {isBasicMode ? (
            // Basic Mode: Single Input
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Min Salary Requirement</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ fontSize: '1.25rem', fontWeight: 700 }}
                  placeholder="100,000"
                  value={formatNumber(baseSalary)}
                  onChange={(e) => handleInputChange(e, setBaseSalary)}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            // Complex Mode: Multiple Inputs
            <>
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

              {(activeFields.includes('bonus') || activeFields.includes('equity')) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {activeFields.includes('bonus') && (
                    <div className="form-group">
                      <label className="form-label">Min Performance Bonus</label>
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
                  )}

                  {activeFields.includes('equity') && (
                    <div className="form-group">
                      <label className="form-label">Min Equity Value</label>
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
                  )}
                </div>
              )}

              <div style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Min Total Package</label>
                  {isTotalManual && (
                    <button
                      onClick={() => setIsTotalManual(false)}
                      style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Reset to Auto-Sum
                    </button>
                  )}
                </div>

                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}
                    placeholder="0"
                    value={formatNumber(total)}
                    onChange={handleTotalChange}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="btn btn-primary btn-full btn-large"
          onClick={handleSubmit}
          disabled={!baseSalary || (isBasicMode ? parseInt(baseSalary) <= 0 : false) || loading}
        >
          {loading ? 'Submitting...' : 'Check for Match'}
        </button>

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
          <span>{teeActive ? 'TEE active - values encrypted in hardware' : 'Your salary requirement will remain private'}</span>
        </div>
      </>
    );
  }

  // Show result
  if (negotiation.status === 'complete' || negotiation.status === 'finalized') {
    const isMatch = negotiation.result === 'match';

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Result</h1>
          <p className="page-description">
            The negotiation is complete. Here's the outcome.
          </p>
        </div>

        <div className="card result-card">
          <div className="result-icon">{isMatch ? '✓' : '✗'}</div>
          <h2 className={`result-title ${isMatch ? 'match' : 'no-match'}`}>
            {isMatch ? 'Match Found' : 'No Match'}
          </h2>
          <p className="result-description">
            {isMatch
              ? 'Great news! Your minimum is within the employer\'s budget. Time to talk!'
              : 'Unfortunately, the employer\'s budget doesn\'t meet your minimum requirement.'}
          </p>

          {matchDetails && !isBasicMode && (
            <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem' }}>Match Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ color: '#6b7280' }}>Base Salary</div>
                <div style={{ fontWeight: 600, color: matchDetails.baseMatch ? '#059669' : '#dc2626' }}>
                  {matchDetails.baseMatch ? '✓ Matched' : '✗ No Match'}
                </div>

                {activeFields.includes('bonus') && (
                  <>
                    <div style={{ color: '#6b7280' }}>Bonus</div>
                    <div style={{ fontWeight: 600, color: matchDetails.bonusMatch ? '#059669' : '#dc2626' }}>
                      {matchDetails.bonusMatch ? '✓ Matched' : '✗ No Match'}
                    </div>
                  </>
                )}

                {activeFields.includes('equity') && (
                  <>
                    <div style={{ color: '#6b7280' }}>Equity</div>
                    <div style={{ fontWeight: 600, color: matchDetails.equityMatch ? '#059669' : '#dc2626' }}>
                      {matchDetails.equityMatch ? '✓ Matched' : '✗ No Match'}
                    </div>
                  </>
                )}

                <div style={{ color: '#111827', fontWeight: 600, marginTop: '0.5rem' }}>Total Package</div>
                <div style={{ fontWeight: 700, color: matchDetails.totalMatch ? '#059669' : '#dc2626', marginTop: '0.5rem' }}>
                  {matchDetails.totalMatch ? '✓ Matched' : '✗ No Match'}
                </div>
              </div>
            </div>
          )}
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
          Go to Homepage
        </button>
      </>
    );
  }

  return null;
}
