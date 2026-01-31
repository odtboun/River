# River

**Double-Blind Salary Negotiation on Solana**

Employers and candidates discover if their salary expectations match — without revealing actual numbers to anyone.

## Architecture

River uses **MagicBlock Private Ephemeral Rollups (PER)** with Intel TDX Trusted Execution Environments to solve the "Millionaires' Problem":

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SOLANA L1                                   │
│                                                                     │
│  1. Employer creates negotiation session                            │
│  2. Candidate joins                                                 │
│  3. Both delegate account to TEE                                    │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              MAGICBLOCK PRIVATE EPHEMERAL ROLLUP (TEE)              │
│                     Intel TDX Secure Enclave                        │
│                                                                     │
│  4. Employer submits max_budget    (encrypted, never exposed)       │
│  5. Candidate submits min_salary   (encrypted, never exposed)       │
│                                                                     │
│  6. TEE computes: min_salary <= max_budget                          │
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

## Why TEE instead of ZK?

Zero-Knowledge Proofs have a "Single Prover" constraint — one party must know both private inputs to generate the proof. This defeats double-blind privacy.

TEE (Trusted Execution Environment) solves this by acting as a **hardware-isolated blind third party**:
- Both parties send encrypted inputs to the TEE
- Computation happens in secure memory (Intel TDX)
- Not even the machine operator can see the values
- Only the result is committed to the blockchain

## Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contract | Anchor (Rust) |
| Privacy Layer | MagicBlock Private Ephemeral Rollups |
| TEE | Intel TDX via MagicBlock |
| Blockchain | Solana Devnet |
| Frontend | React + TypeScript |

## Project Structure

```
River/
├── programs/river/          # Anchor smart contract
│   └── src/lib.rs           # Negotiation logic
├── frontend/                # React app
├── tests/                   # Integration tests
├── archive/                 # Archived Noir circuits (previous approach)
└── Anchor.toml              # Anchor config
```

## TEE Requirements

**For Private Mode (TEE Enabled):**
- Requires a real Solana wallet with `signMessage` capability
- Compatible wallets: Phantom, Solflare, Backpack, Glow, etc.
- Salary values are encrypted and processed in Intel TDX secure enclave
- Values **never** appear on public blockchain

**Quick Start Mode (Burner Wallet):**
- No wallet installation required - instant demo
- Values are **publicly visible** on-chain (not private)
- Suitable for testing the flow, not for real negotiations

## Flow

1. **Employer** creates a negotiation session on Solana L1
2. **Candidate** joins the session
3. **Both parties** delegate the session account to the TEE (if using real wallet)
4. **Employer** submits `max_budget` to the TEE (encrypted)
5. **Candidate** submits `min_salary` to the TEE (encrypted)
6. **TEE** computes `min_salary <= max_budget` and stores result
7. **Finalize** commits only the boolean result back to Solana L1
8. **Both** see "Match" or "No Match" — actual numbers discarded

## Development

### Prerequisites

- Rust 1.85+
- Solana CLI 2.3+
- Anchor 0.30+
- Node.js 20+

### Build

```bash
anchor build
```

### Deploy

```bash
anchor deploy --provider.cluster devnet
```

### Test

```bash
anchor test
```

## MagicBlock Integration

TEE Endpoint: `https://tee.magicblock.app`
TEE Validator: `FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA`

See [MagicBlock PER Documentation](https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart)

## Security Model

- **Confidentiality**: Salary values encrypted in transit and memory via Intel TDX
- **Integrity**: TEE attestation ensures correct execution
- **Finality**: Results committed to Solana L1 with blockchain guarantees
- **Privacy**: Raw salary integers never stored on-chain

## License

MIT
