# River

**Double-Blind Salary Negotiation on Solana**

Discover if salary expectations align without revealing actual numbers. Powered by Zero-Knowledge Proofs.

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   1. EMPLOYER                  2. SHARE                          │
│   ┌─────────────┐              ┌─────────────┐                   │
│   │ Set budget  │─────────────▶│ Copy link   │                   │
│   │ ($120,000)  │              │ Send to     │                   │
│   │  [private]  │              │ candidate   │                   │
│   └─────────────┘              └──────┬──────┘                   │
│                                       │                          │
│   3. CANDIDATE                        │                          │
│   ┌─────────────┐◀────────────────────┘                          │
│   │ Visit link  │                                                │
│   │ Set minimum │                                                │
│   │ ($100,000)  │                                                │
│   │  [private]  │                                                │
│   └──────┬──────┘                                                │
│          │                                                       │
│          ▼                                                       │
│   4. RESULT                                                      │
│   ┌─────────────┐                                                │
│   │  ✓ Match    │  Both see result, numbers stay secret          │
│   └─────────────┘                                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## User Flow

1. **Employer creates negotiation** — enters maximum budget, locks it in
2. **Employer shares link** — copies unique URL to send to candidate  
3. **Candidate visits link** — enters minimum salary requirement
4. **Both see result** — Match or No Match (actual numbers never revealed)

## Tech Stack

| Component | Technology |
|-----------|------------|
| ZK Circuit | [Aztec Noir](https://noir-lang.org) |
| Solana Verifier | [Sunspot](https://github.com/reilabs/sunspot) |
| Blockchain | Solana Devnet |
| Frontend | React + TypeScript + Vite |

## Quick Start

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
River/
├── circuits/salary_match/     # Noir ZK circuit
│   ├── src/main.nr            # Circuit logic
│   └── Nargo.toml             # Config
├── frontend/                  # React app
│   ├── src/components/
│   │   ├── LandingPage.tsx    # Home page
│   │   ├── EmployerFlow.tsx   # Employer journey
│   │   └── CandidateFlow.tsx  # Candidate journey
│   └── src/lib/               # Proof & Solana utilities
├── scripts/                   # Build & deploy scripts
└── keypair/                   # Solana keys (gitignored)
```

## The Circuit

```noir
fn main(
    employer_max: u64,    // Private
    candidate_min: u64    // Private
) -> pub Field {
    let is_match = candidate_min <= employer_max;
    if is_match { 1 } else { 0 }
}
```

Only the result (1 or 0) is public. The actual salary numbers are never revealed.

## Full Setup (with Solana deployment)

### Prerequisites

- Node.js 18+
- [Noir](https://noir-lang.org/docs/getting_started/noir_installation) (nargo)
- [Solana CLI](https://solana.com/docs/intro/installation)
- [Go 1.24+](https://go.dev/dl/) (for Sunspot)

### Install Sunspot

```bash
git clone https://github.com/reilabs/sunspot.git ~/sunspot
cd ~/sunspot/go && go build -o sunspot .
sudo mv sunspot /usr/local/bin/
echo 'export GNARK_VERIFIER_BIN="$HOME/sunspot/gnark-solana/crates/verifier-bin"' >> ~/.zshrc
source ~/.zshrc
```

### Compile & Deploy

```bash
# Compile circuit
./scripts/compile.sh

# Deploy to Solana Devnet
solana config set --url devnet
./scripts/deploy.sh
```

## Environment Variables

Create `frontend/.env`:

```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_VERIFIER_PROGRAM_ID=<your-program-id>
```

For better performance, use [QuickNode](https://www.quicknode.com/):

```env
VITE_QUICKNODE_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/your-key/
```

## Security

⚠️ **Development Only** — The trusted setup is not production-ready. A proper MPC ceremony would be required for production.

- Never commit keypair files
- Circuit is tested but not audited
- Demo mode works without deployed circuit

## License

MIT
