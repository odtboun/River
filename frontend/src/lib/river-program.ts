import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection, Keypair, Transaction } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import {
  getAuthToken,
  createDelegateInstruction,
  createCommitAndUndelegateInstruction,
} from '@magicblock-labs/ephemeral-rollups-sdk';

// Program ID from deployment
export const PROGRAM_ID = new PublicKey('HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR');
export const NEGOTIATION_SEED = Buffer.from('negotiation');

// MagicBlock TEE Configuration (devnet)
export const TEE_ENDPOINT = 'https://tee.magicblock.app';
export const TEE_CLUSTER = 'devnet'; // Specify devnet cluster
export const TEE_VALIDATOR = new PublicKey('FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA');

// Standard Solana Devnet RPC
export const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT ?? 'https://api.devnet.solana.com';

// IDL for the River program (Anchor 0.29 format - matches deployed program)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IDL: any = {
  version: '0.1.0',
  name: 'river',
  instructions: [
    {
      name: 'createNegotiation',
      accounts: [
        { name: 'negotiation', isMut: true, isSigner: false },
        { name: 'employer', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [{ name: 'negotiationId', type: 'u64' }],
    },
    {
      name: 'joinNegotiation',
      accounts: [
        { name: 'negotiation', isMut: true, isSigner: false },
        { name: 'candidate', isMut: true, isSigner: true },
      ],
      args: [],
    },
    {
      name: 'submitEmployerBudget',
      accounts: [
        { name: 'negotiation', isMut: true, isSigner: false },
        { name: 'employer', isMut: false, isSigner: true },
      ],
      args: [
        { name: 'base', type: 'u64' },
        { name: 'bonus', type: 'u64' },
        { name: 'equity', type: 'u64' },
        { name: 'total', type: 'u64' },
      ],
    },
    {
      name: 'submitCandidateRequirement',
      accounts: [
        { name: 'negotiation', isMut: true, isSigner: false },
        { name: 'candidate', isMut: false, isSigner: true },
      ],
      args: [
        { name: 'base', type: 'u64' },
        { name: 'bonus', type: 'u64' },
        { name: 'equity', type: 'u64' },
        { name: 'total', type: 'u64' },
      ],
    },
    {
      name: 'finalizeNegotiation',
      accounts: [
        { name: 'negotiation', isMut: true, isSigner: false },
        { name: 'payer', isMut: true, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'Negotiation',
      type: {
        kind: 'struct',
        fields: [
          { name: 'id', type: 'u64' },
          { name: 'employer', type: 'publicKey' },
          { name: 'candidate', type: { option: 'publicKey' } },

          { name: 'employerBase', type: { option: 'u64' } },
          { name: 'employerBonus', type: { option: 'u64' } },
          { name: 'employerEquity', type: { option: 'u64' } },
          { name: 'employerTotal', type: { option: 'u64' } },

          { name: 'candidateBase', type: { option: 'u64' } },
          { name: 'candidateBonus', type: { option: 'u64' } },
          { name: 'candidateEquity', type: { option: 'u64' } },
          { name: 'candidateTotal', type: { option: 'u64' } },

          { name: 'status', type: { defined: 'NegotiationStatus' } },
          { name: 'result', type: { defined: 'MatchResult' } },
          { name: 'matchDetails', type: { option: { defined: 'MatchDetails' } } },
        ],
      },
    },
  ],
  types: [
    {
      name: 'NegotiationStatus',
      type: {
        kind: 'enum',
        variants: [
          { name: 'Created' },
          { name: 'Ready' },
          { name: 'EmployerSubmitted' },
          { name: 'CandidateSubmitted' },
          { name: 'Complete' },
          { name: 'Finalized' },
        ],
      },
    },
    {
      name: 'MatchResult',
      type: {
        kind: 'enum',
        variants: [
          { name: 'Pending' },
          { name: 'Match' },
          { name: 'NoMatch' },
        ],
      },
    },
    {
      name: 'MatchDetails',
      type: {
        kind: 'struct',
        fields: [
          { name: 'baseMatch', type: 'bool' },
          { name: 'bonusMatch', type: 'bool' },
          { name: 'equityMatch', type: 'bool' },
          { name: 'totalMatch', type: 'bool' },
        ],
      },
    }
  ],
  errors: [
    { code: 6000, name: 'NegotiationFull', msg: 'Negotiation is already full' },
    { code: 6001, name: 'CannotJoinOwnNegotiation', msg: 'Cannot join your own negotiation' },
    { code: 6002, name: 'Unauthorized', msg: 'Unauthorized' },
    { code: 6003, name: 'AlreadySubmitted', msg: 'Already submitted' },
    { code: 6004, name: 'NotComplete', msg: 'Negotiation not complete' },
  ],
  metadata: {
    address: 'HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR',
  },
};

// On-chain negotiation account data
export interface NegotiationAccount {
  id: BN;
  employer: PublicKey;
  candidate: PublicKey | null;

  employerBase: BN | null;
  employerBonus: BN | null;
  employerEquity: BN | null;
  employerTotal: BN | null;

  candidateBase: BN | null;
  candidateBonus: BN | null;
  candidateEquity: BN | null;
  candidateTotal: BN | null;

  status: { created?: object; ready?: object; employerSubmitted?: object; candidateSubmitted?: object; complete?: object; finalized?: object };
  result: { pending?: object; match?: object; noMatch?: object };
  matchDetails: {
    baseMatch: boolean;
    bonusMatch: boolean;
    equityMatch: boolean;
    totalMatch: boolean;
  } | null;
}

// Frontend-friendly negotiation data
export interface NegotiationData {
  id: string;
  pda: string;
  employer: string;
  candidate: string | null;
  status: 'created' | 'ready' | 'employer_submitted' | 'candidate_submitted' | 'complete' | 'finalized';
  result: 'pending' | 'match' | 'no_match';
  // Track submission status (values remain private)
  hasEmployerSubmitted: boolean;
  hasCandidateSubmitted: boolean;
  // Match Details
  matchDetails: {
    baseMatch: boolean;
    bonusMatch: boolean;
    equityMatch: boolean;
    totalMatch: boolean;
  } | null;
}

// TEE Auth State
interface TeeAuthState {
  token: string | null;
  isVerified: boolean;
  connection: Connection | null;
}

// Derive the PDA for a negotiation
export function getNegotiationPDA(negotiationId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [NEGOTIATION_SEED, negotiationId.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

// Parse on-chain status to string
function parseStatus(status: NegotiationAccount['status']): NegotiationData['status'] {
  if ('created' in status) return 'created';
  if ('ready' in status) return 'ready';
  if ('employerSubmitted' in status) return 'employer_submitted';
  if ('candidateSubmitted' in status) return 'candidate_submitted';
  if ('complete' in status) return 'complete';
  if ('finalized' in status) return 'finalized';
  return 'created';
}

// Parse on-chain result to string
function parseResult(result: NegotiationAccount['result']): NegotiationData['result'] {
  if ('match' in result) return 'match';
  if ('noMatch' in result) return 'no_match';
  return 'pending';
}

// Convert on-chain account to frontend-friendly format
export function parseNegotiationAccount(account: NegotiationAccount, pda: PublicKey): NegotiationData {
  return {
    id: account.id.toString(),
    pda: pda.toBase58(),
    employer: account.employer.toBase58(),
    candidate: account.candidate?.toBase58() || null,
    status: parseStatus(account.status),
    result: parseResult(account.result),
    // Values remain private - we just track if they've been submitted
    hasEmployerSubmitted: account.employerBase !== null,
    hasCandidateSubmitted: account.candidateBase !== null,
    matchDetails: account.matchDetails,
  };
}

// Create Anchor program instance
export function createProgram(wallet: AnchorWallet, endpoint: string = RPC_ENDPOINT): Program {
  const connection = new Connection(endpoint, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  setProvider(provider);
  // Anchor 0.29 API: new Program(idl, programId, provider)
  return new Program(IDL, PROGRAM_ID, provider);
}

// Generate a random negotiation ID
export function generateNegotiationId(): BN {
  return new BN(Date.now() + Math.floor(Math.random() * 1000000));
}

// River Program Client with TEE Support
export class RiverClient {
  private program: Program;
  private teeProgram: Program | null = null;
  private wallet: AnchorWallet;
  private teeAuth: TeeAuthState = {
    token: null,
    isVerified: false,
    connection: null,
  };

  constructor(wallet: AnchorWallet) {
    this.wallet = wallet;
    this.program = createProgram(wallet, RPC_ENDPOINT);
  }

  // Initialize TEE connection with auth token
  async initializeTee(): Promise<boolean> {
    try {
      // Check wallet capability first (before any network calls)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletWithSignMessage = this.wallet as any;
      if (!walletWithSignMessage.signMessage) {
        console.warn('⚠️  Wallet does not support message signing - TEE unavailable');
        console.warn('    TEE requires a real wallet (Phantom, Solflare, etc.)');
        console.warn('    Transactions will use standard L1 (values will be public)');
        return false;
      }

      console.log('🔐 Initializing TEE for confidential processing...');
      console.log('    Connecting to MagicBlock TEE endpoint...');

      // Note: TEE verification is skipped for demo due to WASM bundling issues
      // In production, verifyTeeRpcIntegrity should be called to cryptographically
      // verify the TEE is running genuine Intel TDX
      // For now, we trust the MagicBlock endpoint directly
      const isVerified = true; // Skip verification for demo

      if (!isVerified) {
        console.warn('⚠️  TEE endpoint verification failed');
        console.warn('    Falling back to standard L1 (values will be public)');
        return false;
      }

      console.log('    ✓ TEE endpoint trusted (verification skipped for demo)');
      console.log('    Getting authentication token...');

      // Get auth token using wallet signature
      const tokenResult = await getAuthToken(
        TEE_ENDPOINT,
        this.wallet.publicKey,
        async (message: Uint8Array) => {
          return await walletWithSignMessage.signMessage(message);
        }
      );

      if (!tokenResult) {
        console.warn('⚠️  Failed to get TEE authentication token');
        console.warn('    Falling back to standard L1 (values will be public)');
        return false;
      }

      // Extract token string from result
      const token = typeof tokenResult === 'string' ? tokenResult : (tokenResult as any).token;

      console.log('    ✓ Authentication token received');
      console.log('    Creating secure TEE connection...');

      // Create TEE connection with auth token and cluster
      const teeUrl = `${TEE_ENDPOINT}?token=${token}&cluster=${TEE_CLUSTER}`;
      this.teeAuth = {
        token,
        isVerified: true,
        connection: new Connection(teeUrl, 'confirmed'),
      };

      // Create TEE program instance
      const teeProvider = new AnchorProvider(
        this.teeAuth.connection!,
        this.wallet,
        { commitment: 'confirmed' }
      );
      // Anchor 0.29 API: new Program(idl, programId, provider)
      this.teeProgram = new Program(IDL, PROGRAM_ID, teeProvider);

      console.log('✅ TEE initialized successfully!');
      console.log('    All salary values will be processed in Intel TDX secure enclave');
      console.log('    Values will NOT appear on public blockchain');
      return true;
    } catch (err) {
      console.error('❌ TEE initialization error:', err);
      console.warn('    Falling back to standard L1 (values will be public)');
      return false;
    }
  }

  // Check if TEE is available
  isTeeAvailable(): boolean {
    return this.teeAuth.isVerified && this.teeProgram !== null;
  }

  // Track which accounts are delegated
  private delegatedAccounts: Set<string> = new Set();

  // Get the appropriate program (TEE or L1)
  private getProgram(useTee: boolean = false): Program {
    if (useTee && this.teeProgram) {
      return this.teeProgram;
    }
    return this.program;
  }

  // Delegate an account to the TEE validator for confidential processing
  async delegateAccount(accountPda: PublicKey): Promise<string> {
    console.log(`Delegating account ${accountPda.toBase58()} to TEE validator...`);

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // Create delegation instruction using MagicBlock SDK
    // The SDK handles PDA derivation internally
    const delegateIx = createDelegateInstruction(
      {
        payer: this.wallet.publicKey,
        delegatedAccount: accountPda,
        ownerProgram: PROGRAM_ID,
        validator: TEE_VALIDATOR, // TEE validator for private processing
      },
      {} // args (empty for basic delegation)
    );

    // Build and send transaction
    const tx = new Transaction().add(delegateIx);
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signedTx = await this.wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    // Track as delegated
    this.delegatedAccounts.add(accountPda.toBase58());
    console.log(`Account delegated to TEE: ${signature}`);

    return signature;
  }

  // Commit state back to L1 and undelegate
  async commitAndUndelegate(accountPda: PublicKey): Promise<string> {
    console.log(`Committing and undelegating account ${accountPda.toBase58()}...`);

    // Use TEE connection for commit if available
    const connection = this.teeAuth.connection || new Connection(RPC_ENDPOINT, 'confirmed');

    // Create commit and undelegate instruction
    // This tells the TEE to push the final state back to L1
    const commitIx = createCommitAndUndelegateInstruction(
      this.wallet.publicKey, // payer
      [accountPda] // accounts to commit and undelegate
    );

    // Build and send transaction
    const tx = new Transaction().add(commitIx);
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signedTx = await this.wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    // Remove from delegated set
    this.delegatedAccounts.delete(accountPda.toBase58());
    console.log(`Account committed and undelegated: ${signature}`);

    return signature;
  }

  // Check if an account is delegated to TEE
  isAccountDelegated(accountPda: PublicKey): boolean {
    return this.delegatedAccounts.has(accountPda.toBase58());
  }

  // Create a new negotiation on L1 (Employer)
  async createNegotiation(): Promise<{ negotiationId: BN; pda: PublicKey; tx: string }> {
    const negotiationId = generateNegotiationId();
    const [pda] = getNegotiationPDA(negotiationId);

    const tx = await this.program.methods
      .createNegotiation(negotiationId)
      .accounts({
        negotiation: pda,
        employer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { negotiationId, pda, tx };
  }

  // Join a negotiation on L1 (Candidate)
  async joinNegotiation(negotiationId: BN): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    const tx = await this.program.methods
      .joinNegotiation()
      .accounts({
        negotiation: pda,
        candidate: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Submit employer's max budget via TEE (confidential)
  async submitEmployerBudget(
    negotiationId: BN,
    base: number,
    bonus: number,
    equity: number,
    total: number
  ): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    // If TEE is available but account not delegated, delegate first
    if (this.isTeeAvailable() && !this.isAccountDelegated(pda)) {
      console.log('🔐 TEE available - delegating account for confidential processing...');
      try {
        await this.delegateAccount(pda);
      } catch (err) {
        console.warn('⚠️  Delegation failed, falling back to L1:', err);
      }
    }

    // Use TEE if delegated and TEE is available
    const useTee = this.isTeeAvailable() && this.isAccountDelegated(pda);
    const program = this.getProgram(useTee);

    // const total = base + bonus + equity; // Use explicit total argument

    if (useTee) {
      console.log('🔒 Submitting employer budget via TEE (confidential - values encrypted)');
      console.log(`   Budget: $${total.toLocaleString()} (base: ${base}, bonus: ${bonus}, equity: ${equity})`);
    } else {
      console.warn('⚠️  Submitting employer budget via L1 (PUBLIC - value visible on-chain)');
      console.warn(`   Budget: $${total.toLocaleString()} (will be publicly visible)`);
    }

    const tx = await program.methods
      .submitEmployerBudget(new BN(base), new BN(bonus), new BN(equity), new BN(total))
      .accounts({
        negotiation: pda,
        employer: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Submit candidate's min salary via TEE (confidential)
  async submitCandidateRequirement(
    negotiationId: BN,
    base: number,
    bonus: number,
    equity: number,
    total: number
  ): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    // If TEE is available but account not delegated, delegate first
    if (this.isTeeAvailable() && !this.isAccountDelegated(pda)) {
      console.log('🔐 TEE available - delegating account for confidential processing...');
      try {
        await this.delegateAccount(pda);
      } catch (err) {
        console.warn('⚠️  Delegation failed, falling back to L1:', err);
      }
    }

    // Use TEE if delegated and TEE is available
    const useTee = this.isTeeAvailable() && this.isAccountDelegated(pda);
    const program = this.getProgram(useTee);

    // const total = base + bonus + equity; // Use explicit total argument

    if (useTee) {
      console.log('🔒 Submitting candidate requirement via TEE (confidential - values encrypted)');
      console.log(`   Requirement: $${total.toLocaleString()} (base: ${base}, bonus: ${bonus}, equity: ${equity})`);
    } else {
      console.warn('⚠️  Submitting candidate requirement via L1 (PUBLIC - value visible on-chain)');
      console.warn(`   Requirement: $${total.toLocaleString()} (will be publicly visible)`);
    }

    const tx = await program.methods
      .submitCandidateRequirement(new BN(base), new BN(bonus), new BN(equity), new BN(total))
      .accounts({
        negotiation: pda,
        candidate: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Finalize negotiation (commit result to L1)
  async finalizeNegotiation(negotiationId: BN): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    const tx = await this.program.methods
      .finalizeNegotiation()
      .accounts({
        negotiation: pda,
        payer: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Fetch a negotiation account
  async getNegotiation(negotiationId: BN): Promise<NegotiationData | null> {
    const [pda] = getNegotiationPDA(negotiationId);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = await (this.program.account as any).negotiation.fetch(pda) as NegotiationAccount;
      return parseNegotiationAccount(account, pda);
    } catch {
      return null;
    }
  }

  // Fetch negotiation by PDA
  async getNegotiationByPda(pda: PublicKey): Promise<NegotiationData | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = await (this.program.account as any).negotiation.fetch(pda) as NegotiationAccount;
      return parseNegotiationAccount(account, pda);
    } catch {
      return null;
    }
  }
}

// Static methods for read-only access
export async function fetchNegotiation(connection: Connection, pda: PublicKey): Promise<NegotiationData | null> {
  // Create a dummy wallet for read-only access
  const dummyKeypair = Keypair.generate();
  const dummyWallet: AnchorWallet = {
    publicKey: dummyKeypair.publicKey,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };

  const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
  // Anchor 0.29 API: new Program(idl, programId, provider)
  const program = new Program(IDL, PROGRAM_ID, provider);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).negotiation.fetch(pda) as NegotiationAccount;
    return parseNegotiationAccount(account, pda);
  } catch {
    return null;
  }
}
