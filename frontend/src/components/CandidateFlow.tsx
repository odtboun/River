import { useState, useCallback } from 'react';

interface NegotiationData {
  id: string;
  employerMax: number | null;
  candidateMin: number | null;
  status: 'pending_employer' | 'pending_candidate' | 'complete';
  result: boolean | null;
}

interface CandidateFlowProps {
  negotiation: NegotiationData | null;
  onSubmit: (minSalary: number) => void;
  onReset: () => void;
}

export function CandidateFlow({ negotiation, onSubmit, onReset }: CandidateFlowProps) {
  const [inputValue, setInputValue] = useState('');

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

  const formatNumber = (val: string) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('en-US');
  };

  // No negotiation found or employer hasn't submitted yet
  if (!negotiation || negotiation.status === 'pending_employer') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Waiting for employer</h1>
          <p className="page-description">
            The employer hasn't set their budget yet. Please wait or contact them.
          </p>
        </div>

        <div className="card">
          <div className="status-waiting">
            <div className="status-icon">⏳</div>
            <div className="status-title">Negotiation not ready</div>
            <div className="status-description">
              Check back soon or ask the employer to complete their part
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Go to Homepage
        </button>
      </>
    );
  }

  // Ready for candidate input
  if (negotiation.status === 'pending_candidate') {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Enter your requirement</h1>
          <p className="page-description">
            The employer has set their budget. Enter your minimum salary requirement to see if there's a match.
          </p>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Minimum Salary</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="100,000"
                value={formatNumber(inputValue)}
                onChange={handleInputChange}
                autoFocus
              />
            </div>
            <p className="form-hint">The minimum annual salary you'll accept</p>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-full btn-large"
          onClick={handleSubmit}
          disabled={!inputValue || parseInt(inputValue) <= 0}
        >
          Check for Match
        </button>

        <div className="privacy-badge" style={{ marginTop: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Your number will never be revealed to the employer</span>
        </div>
      </>
    );
  }

  // Show result
  if (negotiation.status === 'complete') {
    const isMatch = negotiation.result === true;

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
        </div>

        <button className="btn btn-secondary btn-full" onClick={onReset} style={{ marginTop: '1rem' }}>
          Go to Homepage
        </button>
      </>
    );
  }

  return null;
}
