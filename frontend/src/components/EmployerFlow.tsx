import { useState, useCallback } from 'react';

interface NegotiationData {
  id: string;
  employerMax: number | null;
  candidateMin: number | null;
  status: 'pending_employer' | 'pending_candidate' | 'complete';
  result: boolean | null;
}

interface EmployerFlowProps {
  negotiation: NegotiationData;
  shareUrl: string | null;
  onSubmit: (maxBudget: number) => void;
  onReset: () => void;
}

export function EmployerFlow({ negotiation, shareUrl, onSubmit, onReset }: EmployerFlowProps) {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
  }, []);

  const handleSubmit = useCallback(() => {
    const value = parseInt(inputValue);
    if (value > 0) {
      onSubmit(value);
    }
  }, [inputValue, onSubmit]);

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

  // Step 1: Enter budget
  if (negotiation.status === 'pending_employer') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Set your budget</h1>
          <p className="page-description">
            Enter the maximum salary you're willing to offer. This number will remain private.
          </p>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Maximum Budget</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="120,000"
                value={formatNumber(inputValue)}
                onChange={handleInputChange}
                autoFocus
              />
            </div>
            <p className="form-hint">Annual salary in USD</p>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-full btn-large"
          onClick={handleSubmit}
          disabled={!inputValue || parseInt(inputValue) <= 0}
        >
          Lock in Budget
        </button>

        <div className="privacy-badge" style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>This amount will never be revealed</span>
        </div>
      </>
    );
  }

  // Step 2: Share link & wait
  if (negotiation.status === 'pending_candidate') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Share with candidate</h1>
          <p className="page-description">
            Your budget is locked. Send this link to your candidate so they can submit their requirement.
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
              The candidate hasn't submitted their requirement yet
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Start New Negotiation
        </button>

        {copied && <div className="copy-feedback">Link copied to clipboard</div>}
      </>
    );
  }

  // Step 3: Show result
  if (negotiation.status === 'complete') {
    const isMatch = negotiation.result === true;

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

        <button className="btn btn-primary btn-full btn-large" onClick={onReset}>
          Start New Negotiation
        </button>
      </>
    );
  }

  return null;
}
