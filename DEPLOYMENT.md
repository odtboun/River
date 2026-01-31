# Deployment Information

## Architecture Change

**Previous**: Zero-Knowledge Proofs with Aztec Noir + Sunspot
**Current**: Confidential Computing with MagicBlock Private Ephemeral Rollups (TEE)

The ZK approach was abandoned due to the "Single Prover" constraint where one party must know both private inputs to generate the proof.

## Solana Devnet (Current)

| Item | Value |
|------|-------|
| Network | Solana Devnet |
| Program ID | `HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR` |
| Deployer Address | `D8L5Duu5VbZrKqx7ryw4LW48E5iucfzRZ3FPGeyBVh9p` |
| Explorer | [View on Solscan](https://solscan.io/account/HaUJ1uQtgZi8x822pkGFNtVHXaFbGKd2JKGBRS4q5ZvR?cluster=devnet) |

## MagicBlock TEE Configuration

| Item | Value |
|------|-------|
| TEE Endpoint | `https://tee.magicblock.app` |
| TEE Validator | `FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA` |
| Delegation Program | `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` |

## Archived Components

The original Noir/Sunspot implementation is archived in `archive/noir-circuits/`:
- Noir circuit for salary comparison
- Sunspot verifier (deployed to Solana but no longer used)
- Old Program ID: `6ShLhqY6krAXKmZjpFeZ561cVvVaGUn1PeeLE91HDpBT`

## Deploy Steps

```bash
# Build the Anchor program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update Anchor.toml with new program ID
```
