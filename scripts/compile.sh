#!/bin/bash
# River - Double-Blind Salary Negotiation Platform
# Compile Script: Compiles the Noir circuit and generates proving artifacts

set -e

echo "🌊 River - Circuit Compilation"
echo "=============================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/salary_match"

cd "$CIRCUIT_DIR"

echo "Step 1: Running circuit tests..."
nargo test
echo "✓ All tests passed"
echo ""

echo "Step 2: Compiling Noir circuit..."
nargo compile
echo "✓ Circuit compiled to target/salary_match.json"
echo ""

echo "Step 3: Executing circuit with test inputs..."
nargo execute witness
echo "✓ Witness generated at target/witness.gz"
echo ""

# Check if sunspot is available
if command -v sunspot &> /dev/null; then
    echo "Step 4: Converting to CCS format (Sunspot)..."
    sunspot compile target/salary_match.json
    echo "✓ CCS file generated"
    echo ""
    
    echo "Step 5: Generating proving and verifying keys..."
    echo "⚠️  WARNING: This uses an UNSAFE setup for development only!"
    sunspot setup salary_match.ccs
    echo "✓ Keys generated: proving_key.pk, verifying_key.vk"
    echo ""
    
    echo "Step 6: Generating test proof..."
    sunspot prove target/salary_match.json target/witness.gz salary_match.ccs proving_key.pk
    echo "✓ Proof generated: proof.proof, public_witness.pw"
    echo ""
    
    echo "Step 7: Verifying proof locally..."
    sunspot verify verifying_key.vk proof.proof public_witness.pw
    echo "✓ Proof verified successfully!"
    echo ""
    
    # Move artifacts to a dedicated directory
    mkdir -p artifacts
    mv -f salary_match.ccs artifacts/ 2>/dev/null || true
    mv -f proving_key.pk artifacts/ 2>/dev/null || true
    mv -f verifying_key.vk artifacts/ 2>/dev/null || true
    mv -f proof.proof artifacts/ 2>/dev/null || true
    mv -f public_witness.pw artifacts/ 2>/dev/null || true
    
    echo "✓ Artifacts moved to circuits/salary_match/artifacts/"
else
    echo "⚠️  Sunspot not found. Skipping CCS generation and key setup."
    echo "   Install Sunspot to enable Solana deployment:"
    echo "   https://github.com/reilabs/sunspot"
fi

echo ""
echo "Compilation complete!"
echo ""
echo "Circuit artifacts:"
echo "  - ACIR: $CIRCUIT_DIR/target/salary_match.json"
echo "  - Witness: $CIRCUIT_DIR/target/witness.gz"
if [ -d "$CIRCUIT_DIR/artifacts" ]; then
    echo "  - CCS: $CIRCUIT_DIR/artifacts/salary_match.ccs"
    echo "  - Proving Key: $CIRCUIT_DIR/artifacts/proving_key.pk"
    echo "  - Verifying Key: $CIRCUIT_DIR/artifacts/verifying_key.vk"
fi
