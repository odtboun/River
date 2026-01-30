#!/bin/bash
# River - Double-Blind Salary Negotiation Platform
# Prove Script: Generates a proof for given salary values

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/salary_match"

# Parse arguments
EMPLOYER_MAX=${1:-100000}
CANDIDATE_MIN=${2:-80000}

echo "🌊 River - Proof Generation"
echo "==========================="
echo ""
echo "Employer Maximum: \$$EMPLOYER_MAX"
echo "Candidate Minimum: \$$CANDIDATE_MIN"
echo ""

cd "$CIRCUIT_DIR"

# Update Prover.toml with the values
cat > Prover.toml << EOF
# Private inputs for proof generation
employer_max = "$EMPLOYER_MAX"
candidate_min = "$CANDIDATE_MIN"
EOF

echo "Step 1: Executing circuit..."
nargo execute witness
echo "✓ Witness generated"

if command -v sunspot &> /dev/null && [ -f "artifacts/proving_key.pk" ]; then
    echo ""
    echo "Step 2: Generating Groth16 proof..."
    sunspot prove target/salary_match.json target/witness.gz artifacts/salary_match.ccs artifacts/proving_key.pk
    
    # Move proof to output directory
    mkdir -p output
    TIMESTAMP=$(date +%s)
    mv proof.proof "output/proof_${TIMESTAMP}.proof"
    mv public_witness.pw "output/public_witness_${TIMESTAMP}.pw"
    
    echo "✓ Proof generated"
    echo ""
    echo "Output files:"
    echo "  - output/proof_${TIMESTAMP}.proof"
    echo "  - output/public_witness_${TIMESTAMP}.pw"
    
    # Show expected result
    if [ "$CANDIDATE_MIN" -le "$EMPLOYER_MAX" ]; then
        echo ""
        echo "Expected result: ✅ MATCH FOUND"
    else
        echo ""
        echo "Expected result: ❌ NO MATCH"
    fi
else
    echo ""
    echo "⚠️  Sunspot not available or proving key not found."
    echo "    Run './scripts/compile.sh' first."
fi
