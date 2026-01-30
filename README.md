# 🌊 River

**Double-Blind Salary Negotiation Platform on Solana**

River enables employers and candidates to discover if their salary expectations overlap—without revealing actual numbers to anyone. Powered by Zero-Knowledge Proofs (Aztec Noir) and verified on Solana.

![River Demo](https://img.shields.io/badge/Solana-Devnet-blue) ![Noir](https://img.shields.io/badge/Noir-1.0.0--beta.13-purple) ![License](https://img.shields.io/badge/license-MIT-green)

## How It Works

```
┌─────────────────┐     ┌─────────────────┐
│    Employer     │     │    Candidate    │
│  Max: $100,000  │     │  Min: $80,000   │
│    (private)    │     │    (private)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Zero-Knowledge      │
         │   Proof Generation    │
         │   (client-side)       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Solana Blockchain   │
         │   Proof Verification  │
         └───────────┬───────────┘
                     │
                     ▼
              ┌──────────────┐
              │  ✅ MATCH    │
              │  or ❌ NO    │
              │    MATCH     │
              └──────────────┘
```

**The magic:** Neither party ever reveals their actual number—only whether there's an overlap.

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| ZK Circuit | [Aztec Noir](https://noir-lang.org) | Write and compile ZK circuits |
| Solana Verifier | [Sunspot](https://github.com/reilabs/sunspot) | Groth16 proof verification on Solana |
| Blockchain | Solana Devnet | On-chain verification |
| Frontend | React + TypeScript | User interface |
| RPC | QuickNode / Solana | Blockchain communication |

## Project Structure

```
River/
├── circuits/
│   └── salary_match/
│       ├── src/main.nr          # Noir circuit
│       ├── Nargo.toml           # Noir config
│       ├── Prover.toml          # Test inputs
│       └── artifacts/           # Compiled artifacts
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── lib/                 # Proof & Solana utilities
│   │   └── styles/              # CSS
│   └── public/
├── scripts/
│   ├── setup.sh                 # Install dependencies
│   ├── compile.sh               # Compile circuit
│   ├── deploy.sh                # Deploy to Solana
│   └── prove.sh                 # Generate proofs
└── keypair/                     # Solana keypairs (gitignored)
```

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **Rust**: [Install](https://rustup.rs/)
- **Solana CLI**: [Installation Guide](https://solana.com/docs/intro/installation)
- **Noir (nargo)**: [Installation Guide](https://noir-lang.org/docs/getting_started/noir_installation)
- **Go 1.24+**: [Download](https://go.dev/dl/) (for Sunspot)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/River.git
cd River

# Install Noir (if not already installed)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup -v 1.0.0-beta.13

# Run setup script
./scripts/setup.sh
```

### 2. Install Sunspot (for Solana deployment)

```bash
# Clone Sunspot
git clone https://github.com/reilabs/sunspot.git ~/sunspot
cd ~/sunspot/go && go build -o sunspot .

# Add to PATH
sudo mv sunspot /usr/local/bin/

# Set environment variable
echo 'export GNARK_VERIFIER_BIN="$HOME/sunspot/gnark-solana/crates/verifier-bin"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Compile the Circuit

```bash
./scripts/compile.sh
```

This will:
- Run circuit tests
- Compile Noir → ACIR
- Generate CCS, proving/verifying keys (if Sunspot installed)

### 4. Deploy to Solana Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Deploy verifier (requires funded wallet)
./scripts/deploy.sh
```

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Configuration

### QuickNode RPC (Recommended)

For better performance, use a QuickNode endpoint:

1. Create account at [quicknode.com](https://www.quicknode.com/)
2. Create a Solana Devnet endpoint
3. Update `frontend/.env`:

```env
VITE_QUICKNODE_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/your-key/
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_QUICKNODE_RPC_URL` | QuickNode Solana RPC | - |
| `VITE_SOLANA_RPC_URL` | Fallback RPC | `https://api.devnet.solana.com` |
| `VITE_VERIFIER_PROGRAM_ID` | Deployed verifier program | Set by deploy.sh |

## The Circuit

The Noir circuit (`circuits/salary_match/src/main.nr`) implements the core logic:

```noir
fn main(
    employer_max: u64,      // Private: Employer's maximum budget
    candidate_min: u64      // Private: Candidate's minimum requirement
) -> pub Field {
    // Check for overlap
    let is_match = candidate_min <= employer_max;
    
    // Return public result (1 = match, 0 = no match)
    if is_match { 1 } else { 0 }
}
```

**Key properties:**
- Inputs are private—never revealed
- Only the boolean result (match/no match) is public
- Verified cryptographically on Solana

## Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Noir     │    │   Sunspot   │    │   Solana    │    │  Frontend   │
│   Circuit   │───▶│   Compile   │───▶│   Deploy    │───▶│   Verify    │
│  (main.nr)  │    │  (keys, so) │    │  (program)  │    │  (proofs)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Step-by-Step

1. **Write** (`main.nr`) - Define circuit logic in Noir
2. **Compile** (`nargo compile`) - Convert to ACIR bytecode
3. **Setup** (`sunspot setup`) - Generate proving/verifying keys
4. **Deploy** (`sunspot deploy` + `solana program deploy`) - Deploy verifier to Solana
5. **Prove** (client-side) - Generate ZK proof in browser
6. **Verify** (on-chain) - Submit proof to Solana for verification

## API Reference

### Proof Generation

```typescript
import { useProofGeneration } from './lib/useProofGeneration';

const { generateProof, isReady } = useProofGeneration();

// Generate a proof
const { proof, publicWitness, expectedResult } = await generateProof(
  100000,  // employer max
  80000    // candidate min
);
```

### Solana Verification

```typescript
import { useSolanaVerification } from './lib/useSolanaVerification';

const { verifyOnChain, isConnected } = useSolanaVerification();

// Verify on-chain
const { signature, verified } = await verifyOnChain(proof, publicWitness);
```

## Development

### Running Tests

```bash
# Circuit tests
cd circuits/salary_match
nargo test

# Frontend tests
cd frontend
npm test
```

### Generating Proofs Manually

```bash
# Generate proof with custom values
./scripts/prove.sh 100000 80000  # employer_max candidate_min
```

## Security Considerations

⚠️ **Development Only**: The trusted setup used by Sunspot is NOT secure for production. A proper multi-party computation (MPC) ceremony is required for production deployments.

- Never commit keypair files
- The circuit has been tested but not audited
- Demo mode simulates proofs when Noir isn't available

## Troubleshooting

### "Sunspot not found"

Install Sunspot following the [installation guide](#2-install-sunspot-for-solana-deployment).

### "Circuit not found" in browser

Ensure the compiled circuit is available:
```bash
./scripts/compile.sh
cp circuits/salary_match/target/salary_match.json frontend/public/circuit/
```

### Airdrop failed

Devnet airdrops can fail during high traffic. Use the [Solana Faucet](https://faucet.solana.com/) instead.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Aztec](https://aztec.network/) - Noir language and NoirJS
- [Reilabs](https://reilabs.io/) - Sunspot Solana verifier
- [Solana Foundation](https://solana.org/) - Noir examples and documentation
- [QuickNode](https://www.quicknode.com/) - RPC infrastructure

---

**Built with 🔐 Zero-Knowledge Proofs**
