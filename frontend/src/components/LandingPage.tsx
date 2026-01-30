interface LandingPageProps {
  onStartEmployer: () => void;
  onStartCandidate: () => void;
}

export function LandingPage({ onStartEmployer }: LandingPageProps) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Salary Negotiation</h1>
        <p className="page-description">
          Find out if your salary expectations match without revealing actual numbers. 
          Powered by zero-knowledge proofs.
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <div className="step-content">
              <div className="step-title">Create a negotiation</div>
              <div className="step-description">
                Enter your maximum budget as an employer
              </div>
            </div>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <div className="step-content">
              <div className="step-title">Share the link</div>
              <div className="step-description">
                Send the unique link to your candidate
              </div>
            </div>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <div className="step-content">
              <div className="step-title">Get the result</div>
              <div className="step-description">
                Both parties see if expectations align—numbers stay secret
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        className="btn btn-primary btn-full btn-large"
        onClick={onStartEmployer}
      >
        Start as Employer
      </button>

      <div className="privacy-badge" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Your salary numbers never leave your device</span>
      </div>
    </>
  );
}
