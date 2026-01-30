import { useState, useCallback } from 'react';
import { RoleCard } from './components/RoleCard';
import { ResultSection } from './components/ResultSection';
import { useProofGeneration } from './lib/useProofGeneration';
import { useSolanaVerification } from './lib/useSolanaVerification';

type Role = 'employer' | 'candidate';
type VerificationStatus = 'idle' | 'generating' | 'submitting' | 'success' | 'failure';

interface RoleData {
  value: string;
  isReady: boolean;
}

function App() {
  const [employerData, setEmployerData] = useState<RoleData>({ value: '', isReady: false });
  const [candidateData, setCandidateData] = useState<RoleData>({ value: '', isReady: false });
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const { generateProof, isReady: proofSystemReady } = useProofGeneration();
  const { verifyOnChain, isConnected } = useSolanaVerification();

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, message, type }]);
  }, []);

  const handleValueChange = (role: Role, value: string) => {
    const numValue = parseInt(value) || 0;
    const data = { value, isReady: numValue > 0 };
    
    if (role === 'employer') {
      setEmployerData(data);
    } else {
      setCandidateData(data);
    }
  };

  const handleLockIn = (role: Role) => {
    if (role === 'employer') {
      setEmployerData(prev => ({ ...prev, isReady: true }));
      addLog(`Employer locked in their maximum budget`, 'success');
    } else {
      setCandidateData(prev => ({ ...prev, isReady: true }));
      addLog(`Candidate locked in their minimum requirement`, 'success');
    }
  };

  const canVerify = employerData.isReady && candidateData.isReady && status === 'idle';

  const handleVerify = async () => {
    if (!canVerify) return;

    const employerMax = parseInt(employerData.value);
    const candidateMin = parseInt(candidateData.value);

    setStatus('generating');
    setResult(null);
    setTxSignature(null);
    setLogs([]);
    
    addLog('Starting double-blind verification...', 'info');
    addLog(`Both parties have locked in their values (hidden)`, 'info');

    try {
      // Step 1: Generate ZK proof
      addLog('Generating zero-knowledge proof...', 'info');
      const { proof, publicWitness, expectedResult } = await generateProof(employerMax, candidateMin);
      addLog('Proof generated successfully', 'success');
      addLog(`Public output: ${expectedResult ? 'MATCH' : 'NO MATCH'}`, 'info');

      // Step 2: Submit to Solana for verification
      setStatus('submitting');
      addLog('Submitting proof to Solana Devnet...', 'info');
      
      const { signature, verified } = await verifyOnChain(proof, publicWitness);
      
      if (verified) {
        setTxSignature(signature);
        setResult(expectedResult);
        setStatus('success');
        addLog(`Transaction confirmed: ${signature.slice(0, 16)}...`, 'success');
        addLog(expectedResult ? 'MATCH FOUND - There is overlap in salary expectations!' : 'NO MATCH - Salary expectations do not overlap', 
          expectedResult ? 'success' : 'info');
      } else {
        throw new Error('Proof verification failed on-chain');
      }
    } catch (error) {
      setStatus('failure');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`, 'error');
      
      // For demo purposes, show the expected result anyway
      const expectedResult = candidateMin <= employerMax;
      setResult(expectedResult);
      addLog(`Demo mode: Showing expected result based on inputs`, 'info');
    }
  };

  const handleReset = () => {
    setEmployerData({ value: '', isReady: false });
    setCandidateData({ value: '', isReady: false });
    setStatus('idle');
    setResult(null);
    setTxSignature(null);
    setLogs([]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/river.svg" alt="River" className="logo-icon" />
            <span className="logo-text">River</span>
          </div>
          <div className="network-badge">
            Solana Devnet
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1>Double-Blind Salary Negotiation</h1>
          <p>
            Find out if your salary expectations match without revealing your actual numbers.
            Powered by Zero-Knowledge Proofs on Solana.
          </p>
        </section>

        <div className="cards-grid">
          <RoleCard
            role="employer"
            title="Employer"
            subtitle="Set your maximum budget"
            icon="🏢"
            value={employerData.value}
            isReady={employerData.isReady}
            onValueChange={(value) => handleValueChange('employer', value)}
            onLockIn={() => handleLockIn('employer')}
            disabled={status !== 'idle'}
          />
          <RoleCard
            role="candidate"
            title="Candidate"
            subtitle="Set your minimum requirement"
            icon="👤"
            value={candidateData.value}
            isReady={candidateData.isReady}
            onValueChange={(value) => handleValueChange('candidate', value)}
            onLockIn={() => handleLockIn('candidate')}
            disabled={status !== 'idle'}
          />
        </div>

        <ResultSection
          status={status}
          result={result}
          logs={logs}
          txSignature={txSignature}
          canVerify={canVerify}
          onVerify={handleVerify}
          onReset={handleReset}
          proofSystemReady={proofSystemReady}
          isConnected={isConnected}
        />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a 
              href="https://github.com/reilabs/sunspot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Sunspot
            </a>
            <a 
              href="https://noir-lang.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Noir
            </a>
            <a 
              href="https://solana.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Solana
            </a>
          </div>
          <p className="footer-text">
            Built with Zero-Knowledge Proofs. Your salary expectations never leave your device.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
