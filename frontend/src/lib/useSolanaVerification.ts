import { useState, useEffect, useCallback } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

// Configuration
const DEVNET_RPC_URL = import.meta.env.VITE_QUICKNODE_RPC_URL 
  || import.meta.env.VITE_SOLANA_RPC_URL 
  || 'https://api.devnet.solana.com';

const VERIFIER_PROGRAM_ID = import.meta.env.VITE_VERIFIER_PROGRAM_ID;

interface VerificationResult {
  signature: string;
  verified: boolean;
}

export function useSolanaVerification() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [programId, setProgramId] = useState<PublicKey | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const conn = new Connection(DEVNET_RPC_URL, 'confirmed');
        
        // Test connection
        await conn.getLatestBlockhash();
        setConnection(conn);
        setIsConnected(true);

        // Set program ID if available
        if (VERIFIER_PROGRAM_ID) {
          try {
            setProgramId(new PublicKey(VERIFIER_PROGRAM_ID));
          } catch (e) {
            console.warn('Invalid program ID:', VERIFIER_PROGRAM_ID);
          }
        }
      } catch (error) {
        console.error('Failed to connect to Solana:', error);
        setIsConnected(false);
      }
    }

    init();
  }, []);

  const verifyOnChain = useCallback(async (
    proof: Uint8Array,
    publicWitness: Uint8Array
  ): Promise<VerificationResult> => {
    if (!connection) {
      throw new Error('Not connected to Solana');
    }

    // If we have a deployed verifier program, use it
    if (programId) {
      try {
        // Create instruction data: proof || public_witness
        const instructionData = Buffer.concat([
          Buffer.from(proof),
          Buffer.from(publicWitness),
        ]);

        // Generate a temporary keypair for the transaction
        // In production, you would use a wallet adapter
        const payer = Keypair.generate();

        // Request airdrop for transaction fees (devnet only)
        const airdropSig = await connection.requestAirdrop(
          payer.publicKey,
          0.01 * 1e9 // 0.01 SOL
        );
        await connection.confirmTransaction(airdropSig);

        // Create the verification instruction
        const instruction = new TransactionInstruction({
          keys: [],
          programId: programId,
          data: instructionData,
        });

        // Create and send transaction
        const transaction = new Transaction().add(instruction);
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer.publicKey;

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [payer],
          { commitment: 'confirmed' }
        );

        return {
          signature,
          verified: true, // If transaction succeeds, proof is valid
        };
      } catch (error) {
        console.error('On-chain verification failed:', error);
        throw error;
      }
    }

    // Demo mode: simulate on-chain verification
    console.log('Demo mode: Simulating on-chain verification');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency

    // Generate a fake transaction signature for demo
    const demoSignature = Array.from(
      crypto.getRandomValues(new Uint8Array(64))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      signature: demoSignature,
      verified: true,
    };
  }, [connection, programId]);

  return {
    verifyOnChain,
    isConnected,
    programId: programId?.toBase58() || null,
  };
}
