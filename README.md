# River

**Double-Blind Salary Negotiation on Solana**

Employers and candidates discover if their salary expectations match — without revealing actual numbers to anyone.

## The Problem

Traditional salary negotiation creates information asymmetry:
- Employers know their budget but not if the candidate would accept less
- Candidates know their minimum but not if they're underselling
- First to reveal a number often "loses"

**River solves this** using MagicBlock's Private Ephemeral Rollups — both parties submit their number privately, and only learn "Match" or "No Match."

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SOLANA L1                                   │
│                                                                     │
│  1. Employer creates negotiation session                            │
│  2. Candidate joins                                                 │
│  3. Both delegate account to PER                                    │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              MAGICBLOCK PRIVATE EPHEMERAL ROLLUP (PER)              │
│                  Powered by Intel TDX Trusted Execution             │
│                                                                     │
│  4. Employer submits max_budget    (encrypted, never exposed)       │
│  5. Candidate submits min_salary   (encrypted, never exposed)       │
│                                                                     │
│  6. PER computes: min_salary <= max_budget                          │
│     Result: Match ✓ or NoMatch ✗                                    │
│                                                                     │
│  7. Clear salary values, commit only the boolean result             │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SOLANA L1                                   │
│                                                                     │
│  8. Final state: { result: Match | NoMatch }                        │
│     (actual salary numbers never stored on-chain)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology: PER vs TEE

| Term | What It Is |
|------|-----------|
| **TEE** | Trusted Execution Environment — hardware-level secure enclave (Intel TDX) |
| **PER** | Private Ephemeral Rollup — MagicBlock's infrastructure that uses TEE |

**River uses MagicBlock PER**, which includes:
- **Intel TDX TEE** — Hardware isolation ensuring computation privacy
- **Account Delegation** — Temporarily moves Solana accounts to the rollup
- **Authenticated RPC** — Token-based access to the secure environment
- **Commit Back to L1** — Finalizes only the result (not private data) on Solana

Think of **PER as the product** and **TEE as the engine** that powers it.

## Why PER/TEE Instead of ZK?

Zero-Knowledge Proofs have a "Single Prover" constraint — one party must know both private inputs to generate the proof. This defeats double-blind privacy.

PER with TEE solves this by acting as a **hardware-isolated blind third party**:
- Both parties send encrypted inputs to the TEE
- Computation happens in secure memory (Intel TDX)
- Not even the machine operator can see the values
- Only the result is committed to the blockchain

## Demo

**Live Demo:** Coming soon

### TEE Mode (Real Wallet)
- Requires Phantom, Solflare, Backpack, or similar
- Salary values are **truly private** — processed in Intel TDX
- Values never appear on public blockchain

### Quick Start Mode (Burner Wallet)
- No wallet needed — instant demo
- Values are **publicly visible** on-chain
- For testing the flow, not real negotiations

## Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contract | Anchor (Rust) on Solana |
| Privacy Layer | MagicBlock Private Ephemeral Rollups |
| TEE Hardware | Intel TDX |
| Blockchain | Solana Devnet |
| Frontend | React + TypeScript + Vite |

## Project Structure

```
River/
├── programs/river/          # Anchor smart contract
│   └── src/lib.rs           # Negotiation logic
├── frontend/                # React app
│   ├── src/lib/             # River SDK client
│   └── src/components/      # UI components
├── tests/                   # Integration tests
└── Anchor.toml              # Anchor config
```

## Development

### Prerequisites

- Rust 1.85+
- Solana CLI 2.3+
- Anchor 0.29+
- Node.js 20+

### Build & Deploy

```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## MagicBlock Integration

| Config | Value |
|--------|-------|
| TEE Endpoint | `https://tee.magicblock.app` |
| Cluster | `devnet` |
| TEE Validator | `FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA` |

**SDK Used:** `@magicblock-labs/ephemeral-rollups-sdk`

See [MagicBlock PER Documentation](https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/onchain-privacy)

## Security Model

| Aspect | Guarantee |
|--------|-----------|
| **Confidentiality** | Salary values encrypted via Intel TDX attestation |
| **Integrity** | TEE attestation ensures correct execution |
| **Finality** | Results committed to Solana L1 |
| **Privacy** | Raw salary integers never stored on-chain |

## How It Works (Technical)

1. **Create Negotiation** — Employer calls `create_negotiation` on L1
2. **Join** — Candidate calls `join_negotiation` on L1
3. **Delegate** — Account delegated to PER via `createDelegateInstruction`
4. **Authenticate** — Wallet signs challenge for TEE auth token
5. **Submit Values** — Both call `submit_*` via TEE RPC (values encrypted)
6. **Compare** — `compare` instruction runs in TEE, stores only result
7. **Finalize** — `createCommitAndUndelegateInstruction` commits to L1
8. **View Result** — Both see Match/NoMatch, values discarded

## License

MIT
