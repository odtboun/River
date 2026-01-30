#!/bin/bash
# River - Double-Blind Salary Negotiation Platform
# Deploy Script: Deploys the verifier program to Solana Devnet

set -e

echo "🌊 River - Solana Deployment"
echo "============================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/salary_match"
KEYPAIR_DIR="$PROJECT_ROOT/keypair"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for required files
if [ ! -f "$CIRCUIT_DIR/artifacts/verifying_key.vk" ]; then
    echo -e "${RED}Error: verifying_key.vk not found${NC}"
    echo "Run './scripts/compile.sh' first to generate the verifying key."
    exit 1
fi

# Check for sunspot
if ! command -v sunspot &> /dev/null; then
    echo -e "${RED}Error: sunspot not found${NC}"
    echo "Please install Sunspot: https://github.com/reilabs/sunspot"
    exit 1
fi

# Check for GNARK_VERIFIER_BIN
if [ -z "$GNARK_VERIFIER_BIN" ]; then
    echo -e "${YELLOW}Warning: GNARK_VERIFIER_BIN not set${NC}"
    echo "Attempting to find it automatically..."
    if [ -d "$HOME/sunspot/gnark-solana/crates/verifier-bin" ]; then
        export GNARK_VERIFIER_BIN="$HOME/sunspot/gnark-solana/crates/verifier-bin"
        echo "Found at: $GNARK_VERIFIER_BIN"
    else
        echo -e "${RED}Error: Cannot find GNARK_VERIFIER_BIN${NC}"
        echo "Please set: export GNARK_VERIFIER_BIN=/path/to/sunspot/gnark-solana/crates/verifier-bin"
        exit 1
    fi
fi

# Generate deployer keypair if it doesn't exist
if [ ! -f "$KEYPAIR_DIR/deployer.json" ]; then
    echo "Generating deployer keypair..."
    mkdir -p "$KEYPAIR_DIR"
    solana-keygen new --outfile "$KEYPAIR_DIR/deployer.json" --no-bip39-passphrase -s
    echo -e "${GREEN}✓${NC} Keypair generated at $KEYPAIR_DIR/deployer.json"
    echo ""
fi

# Get deployer address
DEPLOYER_ADDRESS=$(solana address -k "$KEYPAIR_DIR/deployer.json")
echo "Deployer address: $DEPLOYER_ADDRESS"

# Check balance
echo ""
echo "Checking devnet balance..."
BALANCE=$(solana balance "$DEPLOYER_ADDRESS" --url devnet 2>/dev/null || echo "0 SOL")
echo "Current balance: $BALANCE"

# Request airdrop if needed
if [[ "$BALANCE" == "0 SOL" ]] || [[ "$BALANCE" < "2 SOL" ]]; then
    echo ""
    echo "Requesting devnet airdrop..."
    solana airdrop 2 "$DEPLOYER_ADDRESS" --url devnet || {
        echo -e "${YELLOW}Airdrop failed. Please use https://faucet.solana.com/${NC}"
        echo "Address: $DEPLOYER_ADDRESS"
    }
    sleep 5
fi

cd "$CIRCUIT_DIR"

# Build verifier program
echo ""
echo "Building Solana verifier program..."
sunspot deploy artifacts/verifying_key.vk

# The sunspot deploy command creates:
# - verifier.so (the Solana program binary)
# - verifier-keypair.json (the program keypair)

if [ -f "verifier.so" ]; then
    # Move artifacts
    mv verifier.so "$KEYPAIR_DIR/" 2>/dev/null || true
    mv verifier-keypair.json "$KEYPAIR_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✓${NC} Verifier program built"
    
    # Deploy to Solana Devnet
    echo ""
    echo "Deploying to Solana Devnet..."
    
    PROGRAM_ID=$(solana program deploy \
        "$KEYPAIR_DIR/verifier.so" \
        --keypair "$KEYPAIR_DIR/deployer.json" \
        --url devnet \
        --program-id "$KEYPAIR_DIR/verifier-keypair.json" \
        2>&1 | grep "Program Id:" | awk '{print $3}')
    
    if [ -n "$PROGRAM_ID" ]; then
        echo -e "${GREEN}✓${NC} Verifier deployed successfully!"
        echo ""
        echo "=========================================="
        echo -e "${GREEN}PROGRAM ID: $PROGRAM_ID${NC}"
        echo "=========================================="
        echo ""
        
        # Save program ID to file
        echo "$PROGRAM_ID" > "$PROJECT_ROOT/program_id.txt"
        
        # Create .env file for frontend
        echo "VITE_VERIFIER_PROGRAM_ID=$PROGRAM_ID" > "$PROJECT_ROOT/frontend/.env"
        echo "VITE_SOLANA_RPC_URL=https://api.devnet.solana.com" >> "$PROJECT_ROOT/frontend/.env"
        
        echo "Program ID saved to:"
        echo "  - program_id.txt"
        echo "  - frontend/.env"
        echo ""
        echo "View on Solana Explorer:"
        echo "https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
    else
        echo -e "${RED}Deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: verifier.so not generated${NC}"
    echo "Check sunspot deploy output for errors"
    exit 1
fi

echo ""
echo "Deployment complete!"
