# Local Secrets Reference

**DO NOT COMMIT THIS FILE IF YOU ADD ACTUAL SECRETS**

This file documents where sensitive files are stored locally.

## Keypair Files (in `keypair/` directory)

| File | Description | How to Regenerate |
|------|-------------|-------------------|
| `deployer.json` | Solana wallet for deployments | `solana-keygen new --outfile keypair/deployer.json` |

## Circuit Artifacts (in `circuits/salary_match/target/`)

| File | Description | Sensitive? |
|------|-------------|------------|
| `salary_match.json` | Compiled ACIR | No |
| `salary_match.ccs` | Constraint system | No |
| `salary_match.pk` | Proving key | No (but large) |
| `salary_match.vk` | Verifying key | No |
| `salary_match.so` | Solana program binary | No |
| `salary_match-keypair.json` | Program keypair | **Yes** |
| `witness.gz` | Test witness | No |

## Environment Files

| File | Description |
|------|-------------|
| `frontend/.env` | Frontend config (program ID, RPC URL) |

## Seed Phrase (KEEP OFFLINE)

The deployer wallet seed phrase should be stored securely offline.
It was shown when the keypair was generated.

If lost, generate a new keypair and redeploy.
