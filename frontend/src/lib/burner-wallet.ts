import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { RPC_ENDPOINT } from './river-program';

const BURNER_WALLET_KEY = 'river_burner_wallet';
const MIN_BALANCE_SOL = 0.01; // Minimum balance to maintain (reduced for efficiency)
const FUND_AMOUNT_SOL = 0.02; // Amount to transfer from funder (enough for ~20 transactions)

/**
 * Get the funder keypair from environment variable
 */
function getFunderKeypair(): Keypair | null {
  try {
    const secretKeyStr = import.meta.env.VITE_FUNDER_SECRET_KEY;
    if (!secretKeyStr) {
      console.warn('No funder wallet configured (VITE_FUNDER_SECRET_KEY)');
      return null;
    }
    const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
    return Keypair.fromSecretKey(secretKey);
  } catch (err) {
    console.error('Failed to load funder keypair:', err);
    return null;
  }
}

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
 * Fund a wallet from the project funder wallet
 * This is the preferred method - more reliable than devnet airdrop
 */
export async function fundFromFunder(recipientPublicKey: PublicKey): Promise<string | null> {
  const funder = getFunderKeypair();
  if (!funder) {
    console.warn('Funder wallet not available, falling back to airdrop');
    return null;
  }

  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    // Check funder balance
    const funderBalance = await connection.getBalance(funder.publicKey);
    const requiredLamports = FUND_AMOUNT_SOL * LAMPORTS_PER_SOL;
    
    if (funderBalance < requiredLamports + 5000) { // 5000 for tx fee
      console.warn(`Funder balance too low: ${funderBalance / LAMPORTS_PER_SOL} SOL`);
      return null;
    }
    
    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funder.publicKey,
        toPubkey: recipientPublicKey,
        lamports: requiredLamports,
      })
    );
    
    // Send and confirm
    console.log(`Funding ${recipientPublicKey.toBase58()} with ${FUND_AMOUNT_SOL} SOL from funder...`);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [funder],
      { commitment: 'confirmed' }
    );
    
    console.log('Funding successful:', signature);
    return signature;
  } catch (err) {
    console.error('Failed to fund from funder:', err);
    return null;
  }
}

/**
 * Request an airdrop for devnet (fallback method)
 */
export async function requestAirdrop(publicKey: PublicKey, amountSol: number = 0.5): Promise<string | null> {
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
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
    console.error('Airdrop error:', err);
    return null;
  }
}

/**
 * Ensure wallet has sufficient balance for transactions
 * Tries funder wallet first, falls back to airdrop
 */
export async function ensureWalletFunded(publicKey: PublicKey): Promise<boolean> {
  try {
    const balance = await getWalletBalance(publicKey);
    
    if (balance >= MIN_BALANCE_SOL) {
      console.log(`Wallet already has ${balance} SOL`);
      return true;
    }
    
    console.log(`Balance (${balance} SOL) below minimum (${MIN_BALANCE_SOL} SOL), funding...`);
    
    // Try funder wallet first (more reliable)
    let funded = await fundFromFunder(publicKey);
    
    // If funder failed, try airdrop as fallback
    if (!funded) {
      console.log('Funder unavailable, trying airdrop...');
      funded = await requestAirdrop(publicKey);
    }
    
    if (!funded) {
      console.error('Failed to fund wallet through any method');
      return false;
    }
    
    // Verify balance
    const newBalance = await getWalletBalance(publicKey);
    console.log(`New balance: ${newBalance} SOL`);
    return newBalance >= MIN_BALANCE_SOL;
  } catch (err) {
    console.error('Failed to ensure wallet funded:', err);
    return false;
  }
}

/**
 * Get funder wallet balance (for debugging/monitoring)
 */
export async function getFunderBalance(): Promise<number | null> {
  const funder = getFunderKeypair();
  if (!funder) return null;
  
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const balance = await connection.getBalance(funder.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

/**
 * Get funder public key (for display/funding)
 */
export function getFunderPublicKey(): string | null {
  const funder = getFunderKeypair();
  return funder?.publicKey.toBase58() ?? null;
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
