import { useState, useCallback, useEffect } from 'react';
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
  onSubmit: (base: number, bonus: number, equity: number) => Promise<void>;
  onReset: () => void;
  // Make matchDetails optional in negotiation data or passed explicitly if simpler
  matchDetails?: {
    baseMatch: boolean;
    bonusMatch: boolean;
    equityMatch: boolean;
    totalMatch: boolean;
  } | null;
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
  onReset,
  matchDetails
}: EmployerFlowProps) {
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');

  // Total logic
  const [total, setTotal] = useState('');
  const [isTotalManual, setIsTotalManual] = useState(false);

  // Configuration State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [useBonus, setUseBonus] = useState(false);
  const [useEquity, setUseEquity] = useState(false);

  const [copied, setCopied] = useState(false);

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
    if (!isCustomMode) {
      // Basic mode: Base only (or treated as base)
      const val = parseInt(baseSalary);
      if (val > 0) {
        await onSubmit(val, 0, 0);
      }
    } else {
      // Custom mode
      const baseVal = parseInt(baseSalary) || 0;
      const bonusVal = parseInt(bonus) || 0;
      const equityVal = parseInt(equity) || 0;

      if (baseVal > 0 || bonusVal > 0 || equityVal > 0) {
        await onSubmit(baseVal, bonusVal, equityVal);
      }
    }
  }, [baseSalary, bonus, equity, isCustomMode, onSubmit]);

  const getActiveFields = () => {
    const fields = ['base'];
    if (isCustomMode) {
      if (useBonus) fields.push('bonus');
      if (useEquity) fields.push('equity');
    }
    return fields;
  };

  const handleCopy = useCallback(async () => {
    if (shareUrl) {
      const fields = getActiveFields();
      const fieldsParam = fields.join(',');
      const finalUrl = fields.length > 1 ? `${shareUrl}&fields=${fieldsParam}` : shareUrl;

      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl, isCustomMode, useBonus, useEquity]);

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

  // Step 1: Enter budget
  const needsBudgetInput = negotiation && !negotiation.hasEmployerSubmitted;

  if (needsBudgetInput) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Set your budget</h1>
          <p className="page-description">
            Configure the offer structure and enter your maximum budget.
          </p>
        </div>

        <div className="card">
          {/* Configuration Toggles */}
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                className={`btn ${!isCustomMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsCustomMode(false)}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                Basic (Salary Only)
              </button>
              <button
                className={`btn ${isCustomMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsCustomMode(true)}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                Complex (Total Comp)
              </button>
            </div>

            {isCustomMode && (
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useBonus}
                    onChange={(e) => setUseBonus(e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Performance Bonus
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useEquity}
                    onChange={(e) => setUseEquity(e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Equity
                </label>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Max Base Salary</label>
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

          {(isCustomMode && (useBonus || useEquity)) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {useBonus && (
                <div className="form-group">
                  <label className="form-label">Max Bonus</label>
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

              {useEquity && (
                <div className="form-group">
                  <label className="form-label">Max Equity</label>
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

          {isCustomMode && (
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Max Total Budget</label>
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
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                This is the binding number used for the match. {isTotalManual ? "You have set a custom total." : "It is currently the sum of your components."}
              </div>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary btn-full btn-large"
          onClick={handleSubmit}
          disabled={!baseSalary || (isCustomMode && parseInt(baseSalary) <= 0) || loading}
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

  // Step 2: Share link
  const waitingForCandidate = negotiation &&
    negotiation.hasEmployerSubmitted &&
    !negotiation.hasCandidateSubmitted &&
    negotiation.status !== 'complete' &&
    negotiation.status !== 'finalized';

  if (waitingForCandidate) {
    const fields = getActiveFields();
    // Only append fields if complex mode
    const finalShareUrl = (fields.length > 1 && shareUrl)
      ? `${shareUrl}&fields=${fields.join(',')}`
      : shareUrl;

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Share with candidate</h1>
          <p className="page-description">
            Your budget is locked. Send this link to your candidate.
          </p>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Candidate Link</label>
            <div className="link-box">
              <input
                type="text"
                className="link-input"
                value={finalShareUrl || ''}
                readOnly
              />
              <button className="btn btn-secondary btn-copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {fields.length > 1 && (
              <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Includes configuration: {fields.filter(f => f !== 'base').join(', ')}
              </p>
            )}
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

          {matchDetails && (
            <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem' }}>Breakdown (Your View)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ color: '#6b7280' }}>Base Salary</div>
                <div style={{ fontWeight: 600, color: matchDetails.baseMatch ? '#059669' : '#dc2626' }}>
                  {matchDetails.baseMatch ? '✓ Within Budget' : '✗ Exceeds Budget'}
                </div>

                {getActiveFields().includes('bonus') && (
                  <>
                    <div style={{ color: '#6b7280' }}>Bonus</div>
                    <div style={{ fontWeight: 600, color: matchDetails.bonusMatch ? '#059669' : '#dc2626' }}>
                      {matchDetails.bonusMatch ? '✓ Within Budget' : '✗ Exceeds Budget'}
                    </div>
                  </>
                )}

                {getActiveFields().includes('equity') && (
                  <>
                    <div style={{ color: '#6b7280' }}>Equity</div>
                    <div style={{ fontWeight: 600, color: matchDetails.equityMatch ? '#059669' : '#dc2626' }}>
                      {matchDetails.equityMatch ? '✓ Within Budget' : '✗ Exceeds Budget'}
                    </div>
                  </>
                )}

                <div style={{ color: '#111827', fontWeight: 600, marginTop: '0.5rem' }}>Total Package</div>
                <div style={{ fontWeight: 700, color: matchDetails.totalMatch ? '#059669' : '#dc2626', marginTop: '0.5rem' }}>
                  {matchDetails.totalMatch ? '✓ Within Budget' : '✗ Exceeds Budget'}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Offer Structure Used:</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              {getActiveFields().map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(' + ')}
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

        <button className="btn btn-primary btn-full btn-large" onClick={onReset}>
          Start New Negotiation
        </button>
      </>
    );
  }

  // Fallback
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
