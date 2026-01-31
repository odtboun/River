import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from './river-program';

const BURNER_WALLET_KEY = 'river_burner_wallet';
const MIN_BALANCE_SOL = 0.05; // Minimum balance to maintain

export interface BurnerWalletState {
  publicKey: string;
  secretKey: string; // Base64 encoded
  createdAt: number;
}

/**
 * Get or create a burner wallet stored in localStorage
 */
export function getOrCreateBurnerWallet(): Keypair {
  // Try to load existing wallet
  const stored = localStorage.getItem(BURNER_WALLET_KEY);
  
  if (stored) {
    try {
      const state: BurnerWalletState = JSON.parse(stored);
      const secretKey = Uint8Array.from(atob(state.secretKey).split('').map(c => c.charCodeAt(0)));
      return Keypair.fromSecretKey(secretKey);
    } catch (err) {
      console.error('Failed to load burner wallet, creating new one:', err);
    }
  }
  
  // Create new wallet
  const keypair = Keypair.generate();
  saveBurnerWallet(keypair);
  return keypair;
}

/**
 * Save a burner wallet to localStorage
 */
export function saveBurnerWallet(keypair: Keypair): void {
  const state: BurnerWalletState = {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: btoa(String.fromCharCode(...keypair.secretKey)),
    createdAt: Date.now(),
  };
  localStorage.setItem(BURNER_WALLET_KEY, JSON.stringify(state));
}

/**
 * Check if a burner wallet exists
 */
export function hasBurnerWallet(): boolean {
  return localStorage.getItem(BURNER_WALLET_KEY) !== null;
}

/**
 * Clear the burner wallet from localStorage
 */
export function clearBurnerWallet(): void {
  localStorage.removeItem(BURNER_WALLET_KEY);
}

/**
 * Get the balance of a wallet
 */
export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Request an airdrop for devnet
 */
export async function requestAirdrop(publicKey: PublicKey, amountSol: number = 1): Promise<string | null> {
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    // Check current balance first
    const currentBalance = await connection.getBalance(publicKey);
    if (currentBalance >= MIN_BALANCE_SOL * LAMPORTS_PER_SOL) {
      console.log('Wallet already has sufficient balance');
      return null;
    }
    
    // Request airdrop
    console.log(`Requesting airdrop of ${amountSol} SOL to ${publicKey.toBase58()}...`);
    const signature = await connection.requestAirdrop(
      publicKey,
      amountSol * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('Airdrop successful:', signature);
    
    return signature;
  } catch (err: any) {
    // Airdrop rate limiting is common on devnet
    if (err.message?.includes('429') || err.message?.includes('rate')) {
      console.warn('Airdrop rate limited, trying smaller amount...');
      // Try with smaller amount
      try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const signature = await connection.requestAirdrop(
          publicKey,
          0.1 * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(signature, 'confirmed');
        return signature;
      } catch {
        console.warn('Airdrop failed, user may need to fund manually');
      }
    }
    console.error('Airdrop error:', err);
    return null;
  }
}

/**
 * Ensure wallet has sufficient balance for transactions
 */
export async function ensureWalletFunded(publicKey: PublicKey): Promise<boolean> {
  try {
    const balance = await getWalletBalance(publicKey);
    
    if (balance < MIN_BALANCE_SOL) {
      console.log(`Balance (${balance} SOL) below minimum, requesting airdrop...`);
      await requestAirdrop(publicKey);
      
      // Check balance again
      const newBalance = await getWalletBalance(publicKey);
      return newBalance >= MIN_BALANCE_SOL;
    }
    
    return true;
  } catch (err) {
    console.error('Failed to ensure wallet funded:', err);
    return false;
  }
}

/**
 * Export wallet as JSON (for backup)
 */
export function exportBurnerWallet(): string | null {
  const stored = localStorage.getItem(BURNER_WALLET_KEY);
  if (!stored) return null;
  
  const state: BurnerWalletState = JSON.parse(stored);
  return JSON.stringify({
    publicKey: state.publicKey,
    secretKey: Array.from(Uint8Array.from(atob(state.secretKey).split('').map(c => c.charCodeAt(0)))),
  }, null, 2);
}

/**
 * Import wallet from JSON backup
 */
export function importBurnerWallet(json: string): Keypair | null {
  try {
    const data = JSON.parse(json);
    const secretKey = new Uint8Array(data.secretKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    saveBurnerWallet(keypair);
    return keypair;
  } catch (err) {
    console.error('Failed to import wallet:', err);
    return null;
  }
}
