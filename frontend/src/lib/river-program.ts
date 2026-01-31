import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection, Keypair } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';

// Program ID from deployment
export const PROGRAM_ID = new PublicKey('HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR');
export const NEGOTIATION_SEED = Buffer.from('negotiation');

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

// RPC endpoint
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Create Anchor program instance
export function createProgram(wallet: AnchorWallet): Program {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  setProvider(provider);
  return new Program(IDL, provider);
}

// Generate a random negotiation ID
export function generateNegotiationId(): BN {
  return new BN(Date.now() + Math.floor(Math.random() * 1000000));
}

// River Program Client
export class RiverClient {
  private program: Program;
  private wallet: AnchorWallet;

  constructor(wallet: AnchorWallet) {
    this.wallet = wallet;
    this.program = createProgram(wallet);
  }

  // Create a new negotiation (Employer)
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

  // Join a negotiation (Candidate)
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

  // Submit employer's max budget
  async submitEmployerBudget(negotiationId: BN, maxBudget: number): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    const tx = await this.program.methods
      .submitEmployerBudget(new BN(maxBudget))
      .accounts({
        negotiation: pda,
        employer: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Submit candidate's min salary
  async submitCandidateRequirement(negotiationId: BN, minSalary: number): Promise<string> {
    const [pda] = getNegotiationPDA(negotiationId);

    const tx = await this.program.methods
      .submitCandidateRequirement(new BN(minSalary))
      .accounts({
        negotiation: pda,
        candidate: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Finalize negotiation (clear private values before L1 commit)
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
