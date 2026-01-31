# Deployment Information

## Solana Devnet

**Deployed:** January 31, 2026

| Item | Value |
|------|-------|
| Network | Solana Devnet |
| Program ID | `6ShLhqY6krAXKmZjpFeZ561cVvVaGUn1PeeLE91HDpBT` |
| Deployer Address | `D8L5Duu5VbZrKqx7ryw4LW48E5iucfzRZ3FPGeyBVh9p` |
| Explorer | [View Program](https://explorer.solana.com/address/6ShLhqY6krAXKmZjpFeZ561cVvVaGUn1PeeLE91HDpBT?cluster=devnet) |

## Circuit Info

| Item | Value |
|------|-------|
| Noir Version | 1.0.0-beta.18 |
| Circuit | `salary_match` |
| Constraints | 72 |
| Proof System | Groth16 (via Sunspot) |

## RPC Endpoints

```
Devnet: https://api.devnet.solana.com
```

For production, use [QuickNode](https://www.quicknode.com/) or another RPC provider.

## Verification

To verify a proof on-chain, send a transaction to the program with:
```
instruction_data = proof_bytes (388 bytes) || public_witness_bytes
```

The transaction succeeds if the proof is valid, fails otherwise.
