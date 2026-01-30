import { useState } from 'react';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ResultSectionProps {
  status: 'idle' | 'generating' | 'submitting' | 'success' | 'failure';
  result: boolean | null;
  logs: LogEntry[];
  txSignature: string | null;
  canVerify: boolean;
  onVerify: () => void;
  onReset: () => void;
  proofSystemReady: boolean;
  isConnected: boolean;
}

export function ResultSection({
  status,
  result,
  logs,
  txSignature,
  canVerify,
  onVerify,
  onReset,
  proofSystemReady,
  isConnected: _isConnected
}: ResultSectionProps) {
  // _isConnected is available for future use when we show connection status
  void _isConnected;
  const [showLogs, setShowLogs] = useState(false);

  const isProcessing = status === 'generating' || status === 'submitting';
  const isComplete = status === 'success' || status === 'failure';

  const getResultDisplay = () => {
    if (isProcessing) {
      return (
        <div className="result-display loading">
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p className="result-text" style={{ color: 'var(--color-text-secondary)' }}>
            {status === 'generating' ? 'Generating Proof...' : 'Verifying on Solana...'}
          </p>
        </div>
      );
    }

    if (result !== null) {
      return (
        <div className={`result-display ${result ? 'match' : 'no-match'}`}>
          <div className="result-icon">{result ? '✅' : '❌'}</div>
          <p className="result-text">
            {result ? 'MATCH FOUND!' : 'NO MATCH'}
          </p>
          <p style={{ 
            marginTop: '0.5rem', 
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem'
          }}>
            {result 
              ? 'Great news! Your salary expectations overlap.' 
              : 'Unfortunately, your salary expectations do not align.'}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="result-section">
      <h2>Verification Result</h2>

      {status === 'idle' && !result && (
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          marginBottom: '1.5rem' 
        }}>
          Both parties must lock in their values before verification can begin.
        </p>
      )}

      {getResultDisplay()}

      {txSignature && (
        <a
          href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
        >
          View transaction on Solana Explorer →
        </a>
      )}

      {!isComplete && (
        <button
          className="btn btn-primary btn-large"
          onClick={onVerify}
          disabled={!canVerify || isProcessing}
          style={{ marginTop: '1rem' }}
        >
          {isProcessing ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18 }} />
              Processing...
            </>
          ) : (
            'Verify Match'
          )}
        </button>
      )}

      {isComplete && (
        <button
          className="btn btn-primary btn-large"
          onClick={onReset}
          style={{ marginTop: '1rem' }}
        >
          Start New Negotiation
        </button>
      )}

      {!proofSystemReady && (
        <p style={{ 
          marginTop: '1rem',
          color: 'var(--color-warning)',
          fontSize: '0.875rem'
        }}>
          ⚠️ Loading proof system...
        </p>
      )}

      {logs.length > 0 && (
        <div className="logs-section">
          <button 
            className="logs-toggle"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? '▼' : '▶'} {showLogs ? 'Hide' : 'Show'} Logs ({logs.length})
          </button>
          
          {showLogs && (
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-time">{log.time}</span>
                  <span className={`log-message ${log.type}`}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: 'var(--color-bg-tertiary)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)'
      }}>
        <strong style={{ color: 'var(--color-text)' }}>How it works:</strong>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
          <li>Each party enters their salary value privately</li>
          <li>A Zero-Knowledge Proof is generated locally (values never leave your device)</li>
          <li>The proof is verified on Solana blockchain</li>
          <li>Only the match/no-match result is revealed - actual numbers stay secret</li>
        </ol>
      </div>
    </section>
  );
}
