import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { verifyTeeRpcIntegrity, getAuthToken } from '@magicblock-labs/ephemeral-rollups-sdk';

// Program ID from deployment
export const PROGRAM_ID = new PublicKey('HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR');
export const NEGOTIATION_SEED = Buffer.from('negotiation');

// MagicBlock TEE Configuration
export const TEE_ENDPOINT = 'https://tee.magicblock.app';
export const TEE_VALIDATOR = new PublicKey('FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA');

// Standard Solana Devnet RPC
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// IDL for the River program (Anchor 0.30+ format)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IDL: any = {
  version: '0.1.0',
  name: 'river',
  address: 'HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR',
  instructions: [
    {
      name: 'createNegotiation',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        { name: 'negotiation', writable: true, pda: { seeds: [{ kind: 'const', value: [110, 101, 103, 111, 116, 105, 97, 116, 105, 111, 110] }, { kind: 'arg', path: 'negotiationId' }] } },
        { name: 'employer', writable: true, signer: true },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [{ name: 'negotiationId', type: 'u64' }],
    },
    {
      name: 'joinNegotiation',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 1],
      accounts: [
        { name: 'negotiation', writable: true },
        { name: 'candidate', writable: true, signer: true },
      ],
      args: [],
    },
    {
      name: 'submitEmployerBudget',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 2],
      accounts: [
        { name: 'negotiation', writable: true },
        { name: 'employer', signer: true },
      ],
      args: [{ name: 'maxBudget', type: 'u64' }],
    },
    {
      name: 'submitCandidateRequirement',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 3],
      accounts: [
        { name: 'negotiation', writable: true },
        { name: 'candidate', signer: true },
      ],
      args: [{ name: 'minSalary', type: 'u64' }],
    },
    {
      name: 'finalizeNegotiation',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 4],
      accounts: [
        { name: 'negotiation', writable: true },
        { name: 'payer', writable: true, signer: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'Negotiation',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
  types: [
    {
      name: 'Negotiation',
      type: {
        kind: 'struct',
        fields: [
          { name: 'id', type: 'u64' },
          { name: 'employer', type: 'pubkey' },
          { name: 'candidate', type: { option: 'pubkey' } },
          { name: 'employerMax', type: { option: 'u64' } },
          { name: 'candidateMin', type: { option: 'u64' } },
          { name: 'status', type: { defined: { name: 'NegotiationStatus' } } },
          { name: 'result', type: { defined: { name: 'MatchResult' } } },
        ],
      },
    },
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
        variants: [{ name: 'Pending' }, { name: 'Match' }, { name: 'NoMatch' }],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'NegotiationFull', msg: 'Negotiation is already full' },
    { code: 6001, name: 'CannotJoinOwnNegotiation', msg: 'Cannot join your own negotiation' },
    { code: 6002, name: 'Unauthorized', msg: 'Unauthorized' },
    { code: 6003, name: 'AlreadySubmitted', msg: 'Already submitted' },
    { code: 6004, name: 'NotComplete', msg: 'Negotiation not complete' },
  ],
};

// On-chain negotiation account data
export interface NegotiationAccount {
  id: BN;
  employer: PublicKey;
  candidate: PublicKey | null;
  employerMax: BN | null;
  candidateMin: BN | null;
  status: { created?: object; ready?: object; employerSubmitted?: object; candidateSubmitted?: object; complete?: object; finalized?: object };
  result: { pending?: object; match?: object; noMatch?: object };
}

// Frontend-friendly negotiation data
export interface NegotiationData {
  id: string;
  pda: string;
  employer: string;
  candidate: string | null;
  status: 'created' | 'ready' | 'employer_submitted' | 'candidate_submitted' | 'complete' | 'finalized';
  result: 'pending' | 'match' | 'no_match';
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
  };
}

// Create Anchor program instance
export function createProgram(wallet: AnchorWallet, endpoint: string = RPC_ENDPOINT): Program {
  const connection = new Connection(endpoint, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  setProvider(provider);
  return new Program(IDL, provider);
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
      console.log('Verifying TEE RPC integrity...');
      
      // Verify TEE integrity
      const isVerified = await verifyTeeRpcIntegrity(TEE_ENDPOINT);
      if (!isVerified) {
        console.warn('TEE verification failed, falling back to L1');
        return false;
      }
      
      console.log('TEE verified! Getting auth token...');
      
      // Get auth token using wallet signature
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletWithSignMessage = this.wallet as any;
      if (!walletWithSignMessage.signMessage) {
        console.warn('Wallet does not support message signing, TEE unavailable');
        return false;
      }
      
      const tokenResult = await getAuthToken(
        TEE_ENDPOINT,
        this.wallet.publicKey,
        async (message: Uint8Array) => {
          return await walletWithSignMessage.signMessage(message);
        }
      );
      
      if (!tokenResult) {
        console.warn('Failed to get TEE auth token');
        return false;
      }
      
      // Extract token string from result
      const token = typeof tokenResult === 'string' ? tokenResult : (tokenResult as any).token;
      
      // Create TEE connection with auth token
      const teeUrl = `${TEE_ENDPOINT}?token=${token}`;
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
      this.teeProgram = new Program(IDL, teeProvider);
      
      console.log('TEE initialized successfully!');
      return true;
    } catch (err) {
      console.error('TEE initialization error:', err);
      return false;
    }
  }

  // Check if TEE is available
  isTeeAvailable(): boolean {
    return this.teeAuth.isVerified && this.teeProgram !== null;
  }

  // Get the appropriate program (TEE or L1)
  private getProgram(useTee: boolean = false): Program {
    if (useTee && this.teeProgram) {
      return this.teeProgram;
    }
    return this.program;
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
  async submitEmployerBudget(negotiationId: BN, maxBudget: number): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);
    
    // Try to use TEE for confidential submission
    const program = this.getProgram(this.isTeeAvailable());
    const endpoint = this.isTeeAvailable() ? 'TEE' : 'L1';
    console.log(`Submitting employer budget via ${endpoint}...`);

    const tx = await program.methods
      .submitEmployerBudget(new BN(maxBudget))
      .accounts({
        negotiation: pda,
        employer: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Submit candidate's min salary via TEE (confidential)
  async submitCandidateRequirement(negotiationId: BN, minSalary: number): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    // Try to use TEE for confidential submission
    const program = this.getProgram(this.isTeeAvailable());
    const endpoint = this.isTeeAvailable() ? 'TEE' : 'L1';
    console.log(`Submitting candidate requirement via ${endpoint}...`);

    const tx = await program.methods
      .submitCandidateRequirement(new BN(minSalary))
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
  const program = new Program(IDL, provider);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).negotiation.fetch(pda) as NegotiationAccount;
    return parseNegotiationAccount(account, pda);
  } catch {
    return null;
  }
}
