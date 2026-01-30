import { useState, useEffect, useCallback } from 'react';

// We use 'any' for the circuit type to avoid version mismatches with @noir-lang/types
// The actual structure is validated at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompiledCircuit = any;

interface ProofResult {
  proof: Uint8Array;
  publicWitness: Uint8Array;
  expectedResult: boolean;
}

// Circuit will be loaded from the compiled JSON
let circuitPromise: Promise<CompiledCircuit> | null = null;

async function loadCircuit(): Promise<CompiledCircuit> {
  if (!circuitPromise) {
    circuitPromise = fetch('/circuit/salary_match.json')
      .then(res => {
        if (!res.ok) throw new Error('Circuit not found');
        return res.json();
      })
      .catch(() => {
        // Return a mock circuit for demo purposes
        console.warn('Using demo mode - circuit not found');
        return null;
      });
  }
  return circuitPromise;
}

export function useProofGeneration() {
  const [isReady, setIsReady] = useState(false);
  const [noir, setNoir] = useState<any>(null);
  const [backend, setBackend] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Dynamically import Noir.js modules
        const [
          { Noir },
          { UltraHonkBackend },
          initNoirC,
          initACVM,
        ] = await Promise.all([
          import('@noir-lang/noir_js'),
          import('@aztec/bb.js'),
          import('@noir-lang/noirc_abi').then(m => m.default),
          import('@noir-lang/acvm_js').then(m => m.default),
        ]);

        // Get WASM URLs
        const [acvmModule, noircModule] = await Promise.all([
          import('@noir-lang/acvm_js/web/acvm_js_bg.wasm?url'),
          import('@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url'),
        ]);

        // Initialize WASM modules
        await Promise.all([
          initACVM(fetch(acvmModule.default)),
          initNoirC(fetch(noircModule.default)),
        ]);

        // Load the circuit
        const circuit = await loadCircuit();
        
        if (circuit && mounted) {
          const noirInstance = new Noir(circuit);
          const backendInstance = new UltraHonkBackend(circuit.bytecode);
          
          setNoir(noirInstance);
          setBackend(backendInstance);
          setIsReady(true);
        } else if (mounted) {
          // Demo mode - set ready without actual circuit
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize Noir:', error);
        // Still allow demo mode
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const generateProof = useCallback(async (
    employerMax: number,
    candidateMin: number
  ): Promise<ProofResult> => {
    const expectedResult = candidateMin <= employerMax;

    // If we have actual Noir infrastructure, use it
    if (noir && backend) {
      try {
        // Execute the circuit to generate witness
        const { witness } = await noir.execute({
          employer_max: BigInt(employerMax).toString(),
          candidate_min: BigInt(candidateMin).toString(),
        });

        // Generate the proof
        const proof = await backend.generateProof(witness);

        return {
          proof: proof.proof,
          publicWitness: new Uint8Array([expectedResult ? 1 : 0]),
          expectedResult,
        };
      } catch (error) {
        console.error('Proof generation failed:', error);
        throw error;
      }
    }

    // Demo mode: simulate proof generation
    console.log('Demo mode: Simulating proof generation');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work

    // Create a demo proof (in production this would be real cryptographic data)
    const demoProof = new Uint8Array(388);
    crypto.getRandomValues(demoProof);

    return {
      proof: demoProof,
      publicWitness: new Uint8Array([expectedResult ? 1 : 0]),
      expectedResult,
    };
  }, [noir, backend]);

  return {
    generateProof,
    isReady,
  };
}
